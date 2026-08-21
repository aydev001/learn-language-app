/**
 * Kino uyi (watch party) — ma'lumotlar qatlami.
 *
 * ## Nega WebSocket emas
 *
 * Ilova Vercel'da serverless funksiya sifatida ishlaydi: doimiy ulanish ham,
 * instansiyalar orasidagi umumiy xotira ham yo'q. Shuning uchun haqiqat
 * manbai — MongoDB, mijoz esa 1-2 soniyada bir marta `sync` so'raydi.
 * Bitta kod lokalda ham, Vercel'da ham bir xil ishlaydi.
 *
 * ## Vaqt bilan ishlash
 *
 * Bazada videoning "hozirgi joyi" saqlanmaydi — u har soniyada o'zgaradi.
 * Uning o'rniga `positionSec` (belgilangan lahzadagi joy) va `stateAt`
 * (o'sha lahza) saqlanadi. Hozirgi joyni mijoz hisoblaydi. Mijoz soati
 * xato bo'lishi mumkin, shuning uchun har javobda server o'z vaqtini
 * (`serverNow`) yuboradi va mijoz farqni to'g'rilab oladi.
 */
import type {
  RoomAccess,
  RoomMemberView,
  RoomMessageView,
  PublicRoomSummary,
  RoomSummary,
  RoomVisibility,
  RoomSync,
} from "../../shared/types.js"
import type { RoomDoc, RoomMemberDoc, RoomMessageDoc, Store } from "./db.js"
import type { TelegramUser } from "./auth.js"
import { botTokenId, getMe, sendMessage } from "./botApi.js"
import { env, hasBotToken } from "./env.js"

/** Shu vaqt ichida sync so'ragan a'zo "hozir uyda" hisoblanadi. */
const ONLINE_MS = 20_000

/** Chat tarixi shundan keyin o'chadi — uy suhbati arxiv emas. */
const MESSAGE_TTL_MS = 48 * 60 * 60 * 1000

/** Bir so'rovda qaytariladigan xabarlar chegarasi. */
const MESSAGE_LIMIT = 60

/** «Ochiq uylar» ro'yxatida ko'rsatiladigan uylar soni. */
const PUBLIC_LIMIT = 30

export const MAX_MESSAGE_LENGTH = 400

const now = () => Date.now()

/**
 * Taklif kodi. Adashtiradigan belgilar (0/O, 1/l/I) yo'q — kodni og'zaki
 * aytib berish yoki qo'lda kiritish oson bo'lsin.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"

function makeCode(length = 6): string {
  let out = ""
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

const memberId = (roomId: string, userId: number) => `${roomId}:${userId}`

export const displayName = (user: TelegramUser) =>
  [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || "Foydalanuvchi"

/* --------------------------------------------------------------- o'qish */

export async function getRoom(store: Store, code: string): Promise<RoomDoc | null> {
  return store.rooms.findOne({ _id: code.toLowerCase() })
}

export async function getMember(
  store: Store,
  roomId: string,
  userId: number,
): Promise<RoomMemberDoc | null> {
  return store.roomMembers.findOne({ _id: memberId(roomId, userId) })
}

/**
 * Hujjat holatini ilova tushunadigan `access` ga aylantiradi.
 *
 * Holati yo'q hujjat ham uchraydi: mavjudlikni belgilash (`lastSeenAt`)
 * upsert bilan yoziladi, ya'ni a'zo shu orada uydan chiqarilgan bo'lsa
 * yozuv qaytadan — bo'sh holda — yaratilib qoladi. Ilgari bunday skelet
 * "pending" deb o'qilardi va uy egasida hech kim yubormagan kirish
 * so'rovi paydo bo'lardi. Bazada shunday yozuv haqiqatan topildi.
 */
export function accessOf(member: RoomMemberDoc | null): RoomAccess {
  if (!member) return "none"
  if (member.status === "approved") return "member"
  if (member.status === "blocked") return "blocked"
  if (member.status === "pending") return "pending"
  return "none"
}

/* -------------------------------------------------------------- yaratish */

export interface CreateRoomInput {
  videoId: string
  title: string
  visibility: RoomVisibility
}

/**
 * Uy ko'rinishi.
 *
 * Eski hujjatlarda maydon yo'q — ular ochiq deb hisoblanadi, chunki
 * maxfiylik keyin qo'shildi va hech kimning uyi kutilmaganda yashirinib
 * qolmasligi kerak.
 */
export const visibilityOf = (room: RoomDoc): RoomVisibility =>
  room.visibility === "private" ? "private" : "public"

export async function createRoom(
  store: Store,
  user: TelegramUser,
  input: CreateRoomInput,
): Promise<RoomDoc> {
  const at = now()
  const name = displayName(user)

  // Kod noyob bo'lishi kerak. To'qnashuv ehtimoli juda kichik, lekin
  // bo'lganda mehmon begona uyga tushib qolardi — shuning uchun tekshiramiz.
  let code = makeCode()
  for (let attempt = 0; attempt < 5 && (await store.rooms.findOne({ _id: code })); attempt++) {
    code = makeCode(attempt >= 2 ? 8 : 6)
  }

  const room: RoomDoc = {
    _id: code,
    ownerId: user.id,
    ownerName: name,
    videoId: input.videoId,
    title: input.title,
    isPlaying: false,
    positionSec: 0,
    stateAt: at,
    stateBy: user.id,
    stateByName: name,
    controlLocked: false,
    visibility: input.visibility,
    createdAt: at,
    updatedAt: at,
    closed: false,
  }

  await store.rooms.insertOne(room)
  await store.roomMembers.insertOne({
    _id: memberId(code, user.id),
    roomId: code,
    userId: user.id,
    name,
    username: user.username,
    photoUrl: user.photo_url,
    status: "approved",
    role: "owner",
    requestedAt: at,
    joinedAt: at,
    lastSeenAt: at,
  })

  return room
}

/* ---------------------------------------------------------------- a'zolar */

/**
 * Kirish so'rovi. Uy egasi tasdiqlamaguncha a'zo "pending" bo'lib turadi.
 * Bloklangan odam qayta so'rov yubora olmaydi.
 */
export async function requestJoin(
  store: Store,
  room: RoomDoc,
  user: TelegramUser,
): Promise<RoomAccess> {
  const existing = await getMember(store, room._id, user.id)
  if (existing?.status === "blocked") return "blocked"
  if (existing?.status === "approved") return "member"

  const at = now()
  const name = displayName(user)

  if (existing) {
    // So'rov allaqachon turibdi — faqat ma'lumotni yangilaymiz, uy egasiga
    // takroriy xabar bormasin.
    await store.roomMembers.upsert(existing._id, {
      set: { name, username: user.username, photoUrl: user.photo_url, lastSeenAt: at },
    })
  } else {
    await store.roomMembers.insertOne({
      _id: memberId(room._id, user.id),
      roomId: room._id,
      userId: user.id,
      name,
      username: user.username,
      photoUrl: user.photo_url,
      status: "pending",
      role: "guest",
      requestedAt: at,
      lastSeenAt: at,
    })
    await touchRoom(store, room._id)
    await notifyOwner(room, name)
  }

  return "pending"
}

export async function approveMember(store: Store, room: RoomDoc, target: RoomMemberDoc) {
  const at = now()
  await store.roomMembers.upsert(target._id, {
    set: { status: "approved", role: "guest", joinedAt: at, lastSeenAt: at },
  })
  await touchRoom(store, room._id)
  await addSystemMessage(store, room._id, `${target.name} uyga qo'shildi`)
  await notify(
    target.userId,
    `✅ <b>${escapeHtml(room.ownerName)}</b> sizni uyiga qabul qildi.\n\n` +
      `🎬 «${escapeHtml(room.title)}»`,
    room._id,
  )
}

/** Rad etish yoki chiqarib yuborish — a'zolik yozuvi butunlay o'chadi. */
export async function dropMember(store: Store, room: RoomDoc, target: RoomMemberDoc) {
  await store.roomMembers.deleteMany([target._id])
  await touchRoom(store, room._id)
}

export async function blockMember(store: Store, room: RoomDoc, target: RoomMemberDoc) {
  await store.roomMembers.upsert(target._id, { set: { status: "blocked", role: "guest" } })
  await touchRoom(store, room._id)
}

/**
 * Blokdan chiqarish — a'zolik yozuvi butunlay o'chadi.
 *
 * Ilgari status "pending" ga qaytarilardi va uy egasida odam so'ramagan
 * "kirish so'rovi" paydo bo'lardi; o'sha odamning ekranida esa u
 * yubormagan so'rov "kutilmoqda" bo'lib turardi. Endi u shunchaki begona
 * bo'ladi va xohlasa o'zi qaytadan so'rov yuboradi.
 */
export async function unblockMember(store: Store, room: RoomDoc, target: RoomMemberDoc) {
  await store.roomMembers.deleteMany([target._id])
  await touchRoom(store, room._id)
}

/* ------------------------------------------------------------ video holati */

export interface StateInput {
  isPlaying: boolean
  positionSec: number
}

export async function setState(
  store: Store,
  room: RoomDoc,
  user: TelegramUser,
  input: StateInput,
): Promise<RoomDoc> {
  const at = now()
  const patch = {
    isPlaying: input.isPlaying,
    positionSec: Math.max(0, input.positionSec),
    stateAt: at,
    stateBy: user.id,
    stateByName: displayName(user),
    updatedAt: at,
  }
  await store.rooms.upsert(room._id, { set: patch })
  return { ...room, ...patch }
}

export async function setVideo(
  store: Store,
  room: RoomDoc,
  user: TelegramUser,
  video: { videoId: string; title: string },
): Promise<RoomDoc> {
  const at = now()
  const patch = {
    videoId: video.videoId,
    title: video.title,
    isPlaying: false,
    positionSec: 0,
    stateAt: at,
    stateBy: user.id,
    stateByName: displayName(user),
    updatedAt: at,
  }
  await store.rooms.upsert(room._id, { set: patch })
  await addSystemMessage(store, room._id, `Yangi kino qo'yildi: «${video.title}»`)
  return { ...room, ...patch }
}

export async function setControlLock(store: Store, room: RoomDoc, locked: boolean) {
  await store.rooms.upsert(room._id, { set: { controlLocked: locked, updatedAt: now() } })
  await addSystemMessage(
    store,
    room._id,
    locked ? "Boshqaruv uy egasida qoldi" : "Boshqaruv hammaga ochildi",
  )
}

export async function closeRoom(store: Store, room: RoomDoc) {
  await store.rooms.upsert(room._id, {
    set: { closed: true, isPlaying: false, updatedAt: now() },
  })
}

/** Kim boshqara oladi: qulf yopiq bo'lsa faqat uy egasi. */
export const canControl = (room: RoomDoc, userId: number) =>
  !room.controlLocked || room.ownerId === userId

/* ------------------------------------------------------------------- chat */

export async function addMessage(
  store: Store,
  room: RoomDoc,
  user: TelegramUser,
  text: string,
): Promise<RoomMessageView> {
  const at = now()
  const doc: RoomMessageDoc = {
    _id: messageId(room._id, at),
    roomId: room._id,
    userId: user.id,
    name: displayName(user),
    text: text.slice(0, MAX_MESSAGE_LENGTH),
    at,
    kind: "text",
  }

  await store.roomMessages.insertOne(doc)
  await touchRoom(store, room._id)
  await pruneMessages(store, room._id)

  return toMessageView(doc)
}

async function addSystemMessage(store: Store, roomId: string, text: string) {
  const at = now()
  await store.roomMessages.insertOne({
    _id: messageId(roomId, at),
    roomId,
    userId: 0,
    name: "",
    text,
    at,
    kind: "system",
  })
}

/**
 * Eski xabarlarni tozalaydi.
 *
 * Alohida cron yo'q — tozalash yozuv paytida, o'ntadan bir marta bajariladi.
 * Uy suhbati kichik, shuning uchun bu yetarli va hech qanday qo'shimcha
 * infratuzilma talab qilmaydi.
 */
async function pruneMessages(store: Store, roomId: string) {
  if (Math.random() > 0.1) return
  const stale = await store.roomMessages.find({ roomId, at: { $lt: now() - MESSAGE_TTL_MS } })
  if (stale.length) await store.roomMessages.deleteMany(stale.map((m) => m._id))
}

/** Vaqt bo'yicha saralanadigan id — xabarlar tartibi shundan kelib chiqadi. */
function messageId(roomId: string, at: number): string {
  return `${roomId}:${String(at).padStart(14, "0")}:${Math.random().toString(36).slice(2, 8)}`
}

const toMessageView = (doc: RoomMessageDoc): RoomMessageView => ({
  id: doc._id,
  userId: doc.userId,
  name: doc.name,
  text: doc.text,
  at: doc.at,
  kind: doc.kind,
})

/* -------------------------------------------------------------- sinxronlash */

/**
 * Uy ichidagi bitta so'rov — holat, a'zolar, so'rovlar va yangi xabarlar.
 *
 * `msgSince` — mijozdagi eng oxirgi xabar vaqti. Faqat undan keyingilari
 * qaytadi, shuning uchun javob hajmi suhbat uzunligiga bog'liq emas.
 */
export async function buildSync(
  store: Store,
  room: RoomDoc,
  user: TelegramUser,
  msgSince: number,
): Promise<RoomSync> {
  const me = await getMember(store, room._id, user.id)
  const access = accessOf(me)
  const isOwner = room.ownerId === user.id

  const base: RoomSync = {
    code: room._id,
    title: room.title,
    videoId: room.videoId,
    ownerId: room.ownerId,
    ownerName: room.ownerName,
    isOwner,
    visibility: visibilityOf(room),
    access,
    closed: room.closed,
    serverNow: now(),
  }

  if (access !== "member") return base

  // Borligimizni bildiramiz — boshqalar "hozir uyda" belgisini shundan ko'radi.
  if (me) await store.roomMembers.upsert(me._id, { set: { lastSeenAt: now() } })

  const all = await store.roomMembers.find({ roomId: room._id })
  const fresh = await store.roomMessages.find({ roomId: room._id, at: { $gt: msgSince } })

  return {
    ...base,
    state: {
      videoId: room.videoId,
      title: room.title,
      isPlaying: room.isPlaying,
      positionSec: room.positionSec,
      stateAt: room.stateAt,
      stateBy: room.stateBy,
      stateByName: room.stateByName,
      controlLocked: room.controlLocked,
    },
    members: all.filter((m) => m.status === "approved").map(toMemberView).sort(byOwnerFirst),
    pending: isOwner
      ? all
          .filter((m) => m.status === "pending")
          .map(toMemberView)
          .sort((a, b) => a.requestedAt - b.requestedAt)
      : [],
    /*
      Bloklanganlar faqat uy egasiga. Ilgari ular hech qayerga
      yuborilmasdi, ya'ni `unblock` amali API'da bor edi-yu, unga
      bosadigan joy yo'q edi — bir marta bloklangan odam abadiy tashqarida
      qolardi.
    */
    blocked: isOwner
      ? all
          .filter((m) => m.status === "blocked")
          .map(toMemberView)
          .sort((a, b) => a.requestedAt - b.requestedAt)
      : [],
    messages: fresh
      .sort((a, b) => a.at - b.at)
      .slice(-MESSAGE_LIMIT)
      .map(toMessageView),
    inviteUrl: await inviteUrl(room._id),
  }
}

const byOwnerFirst = (a: RoomMemberView, b: RoomMemberView) => {
  if (a.role !== b.role) return a.role === "owner" ? -1 : 1
  return a.requestedAt - b.requestedAt
}

function toMemberView(doc: RoomMemberDoc): RoomMemberView {
  return {
    userId: doc.userId,
    name: doc.name,
    username: doc.username,
    photoUrl: doc.photoUrl,
    role: doc.role,
    status: doc.status,
    online: now() - doc.lastSeenAt < ONLINE_MS,
    requestedAt: doc.requestedAt,
  }
}

/* ------------------------------------------------------------ uylar ro'yxati */

export async function listMyRooms(store: Store, userId: number): Promise<RoomSummary[]> {
  const mine = await store.roomMembers.find({ userId })
  if (!mine.length) return []

  const ids = mine.map((m) => m.roomId)
  const rooms = await store.rooms.find({ _id: { $in: ids } })
  // Hamma a'zoni bitta so'rov bilan olamiz — uy soniga qarab so'rov ko'paymasin.
  const members = await store.roomMembers.find({ roomId: { $in: ids } })

  const byRoom = new Map<string, RoomMemberDoc[]>()
  for (const m of members) {
    const list = byRoom.get(m.roomId) ?? []
    list.push(m)
    byRoom.set(m.roomId, list)
  }

  const at = now()

  return rooms
    .filter((room) => !room.closed)
    .map((room): RoomSummary => {
      const list = byRoom.get(room._id) ?? []
      const approved = list.filter((m) => m.status === "approved")
      const status = mine.find((m) => m.roomId === room._id)?.status ?? "pending"

      return {
        code: room._id,
        title: room.title,
        videoId: room.videoId,
        ownerId: room.ownerId,
        ownerName: room.ownerName,
        isOwner: room.ownerId === userId,
        visibility: visibilityOf(room),
        status,
        memberCount: approved.length,
        onlineCount: approved.filter((m) => at - m.lastSeenAt < ONLINE_MS).length,
        pendingCount:
          room.ownerId === userId ? list.filter((m) => m.status === "pending").length : 0,
        isPlaying: room.isPlaying,
        updatedAt: room.updatedAt,
      }
    })
    .sort((a, b) => b.updatedAt - a.updatedAt)
}


/**
 * «Ochiq uylar» — kodni bilmagan odam ham ko'radigan ro'yxat.
 *
 * O'zim allaqachon aloqador uylar chiqarib tashlanadi: ular «Mening
 * uylarim» da turadi (a'zo ham, so'rov yuborgan ham, bloklangan ham).
 * Tartib: avval odam bor uylar, keyin oxirgi harakat vaqti bo'yicha —
 * bo'sh va unutilgan uy ro'yxat boshini egallab turmasin.
 */
export async function listPublicRooms(
  store: Store,
  userId: number,
): Promise<PublicRoomSummary[]> {
  // Eski hujjatlarda `visibility` yo'q — ular ochiq hisoblanadi.
  const rooms = await store.rooms.find({ closed: false, visibility: { $ne: "private" } })
  if (!rooms.length) return []

  const ids = rooms.map((r) => r._id)
  const members = await store.roomMembers.find({ roomId: { $in: ids } })

  const mine = new Set(members.filter((m) => m.userId === userId).map((m) => m.roomId))
  const byRoom = new Map<string, RoomMemberDoc[]>()
  for (const m of members) {
    const list = byRoom.get(m.roomId) ?? []
    list.push(m)
    byRoom.set(m.roomId, list)
  }

  const at = now()

  return rooms
    .filter((room) => !mine.has(room._id))
    .map((room): PublicRoomSummary => {
      const approved = (byRoom.get(room._id) ?? []).filter((m) => m.status === "approved")
      const owner = approved.find((m) => m.userId === room.ownerId)

      return {
        code: room._id,
        title: room.title,
        videoId: room.videoId,
        ownerId: room.ownerId,
        ownerName: room.ownerName,
        ownerPhotoUrl: owner?.photoUrl,
        memberCount: approved.length,
        onlineCount: approved.filter((m) => at - m.lastSeenAt < ONLINE_MS).length,
        isPlaying: room.isPlaying,
        updatedAt: room.updatedAt,
      }
    })
    .sort((a, b) => b.onlineCount - a.onlineCount || b.updatedAt - a.updatedAt)
    .slice(0, PUBLIC_LIMIT)
}

/**
 * Uyni ochiq yoki maxfiy qilish.
 *
 * Suhbatga yozib qo'yiladi: a'zolar uy endi hammaga ko'rinayotganini
 * bilishi kerak — bu ularga ham taalluqli.
 */
export async function setVisibility(store: Store, room: RoomDoc, visibility: RoomVisibility) {
  await store.rooms.upsert(room._id, { set: { visibility, updatedAt: now() } })
  await addSystemMessage(
    store,
    room._id,
    visibility === "private"
      ? "Uy maxfiy qilindi — endi unga faqat havola orqali kiriladi"
      : "Uy ochiq ro'yxatga qo'shildi — endi uni hamma ko'radi",
  )
}
async function touchRoom(store: Store, roomId: string) {
  await store.rooms.upsert(roomId, { set: { updatedAt: now() } })
}

/* ------------------------------------------------------- taklif va xabarnoma */

/**
 * Taklif havolasi.
 *
 * `t.me/<bot>?start=room_<kod>` — do'st bosganda bot suhbati ochiladi va bot
 * unga ilovani ochadigan tugma yuboradi. To'g'ridan-to'g'ri ilova havolasini
 * yuborib bo'lmaydi: u brauzerda ochilsa Telegram imzosi bo'lmaydi va
 * foydalanuvchi tanilmaydi.
 */
export async function inviteUrl(code: string): Promise<string> {
  const username = await botUsername()
  if (username) return `https://t.me/${username}?start=room_${code}`
  // Bot sozlanmagan (lokal sinov) — hech bo'lmasa ilova havolasi qaytsin.
  return env.publicUrl ? `${env.publicUrl}/room/${code}` : `/room/${code}`
}

/**
 * Bot foydalanuvchi nomi.
 *
 * `getMe` har so'rovda chaqirilmasin — natija serverless "issiq"
 * instansiyalar orasida saqlanadi.
 *
 * Kesh **token bilan birga** saqlanadi. Ilgari u bitta qiymat edi va
 * tokenni almashtirganda eski bot nomi ilib qolardi: taklif havolasi
 * butunlay boshqa botga olib borar, uni faqat serverni qayta ishga
 * tushirish (Vercel'da — instansiya yangilanishi) tuzatardi.
 */
const cache = globalThis as unknown as {
  __lrBot?: { tokenId: string; username: string | null }
}

async function botUsername(): Promise<string | null> {
  if (!hasBotToken()) return null

  const tokenId = botTokenId()
  if (cache.__lrBot?.tokenId === tokenId) return cache.__lrBot.username

  try {
    const me = await getMe()
    cache.__lrBot = { tokenId, username: me.username ?? null }
    return cache.__lrBot.username
  } catch {
    // Vaqtinchalik nosozlik keshlanmasin — keyingi safar yana urinamiz.
    return null
  }
}

/** Uy egasiga "kirish so'rovi" xabari. */
async function notifyOwner(room: RoomDoc, guestName: string) {
  await notify(
    room.ownerId,
    `🔔 <b>${escapeHtml(guestName)}</b> uyingizga kirmoqchi.\n\n` +
      `🎬 «${escapeHtml(room.title)}»\n\n` +
      `Ilovada ✅ yoki ❌ bosing.`,
    room._id,
  )
}

/**
 * Telegram xabari. Xato bo'lsa (bot bloklangan, token yo'q) — jimgina
 * o'tib ketamiz: bildirishnoma qulaylik, so'rovni to'xtatishga arzimaydi.
 */
async function notify(userId: number, text: string, code: string) {
  if (!hasBotToken()) return

  const url = env.publicUrl ? `${env.publicUrl}/room/${code}` : ""

  try {
    await sendMessage({
      chatId: userId,
      text,
      webAppButton: url ? { text: "🍿 Uyni ochish", url } : undefined,
    })
  } catch (err) {
    console.warn("[rooms] xabar yuborilmadi:", err instanceof Error ? err.message : err)
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
