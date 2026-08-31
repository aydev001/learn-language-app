/**
 * Kino uyi API'sining uchidan-uchiga sinovi — brauzersiz.
 *
 * Hono ilovasini to'g'ridan-to'g'ri chaqiradi va ikki foydalanuvchi
 * (uy egasi va mehmon) o'rtasidagi butun oqimni bosib chiqadi:
 * uy yaratish, so'rov, tasdiq, sinxron holat, chat va boshqaruv qulfi.
 *
 *   npm run test:rooms
 *
 * Baza ishlatilmaydi: `MONGODB_URI` bo'shatiladi, ya'ni xotiradagi zaxira
 * do'kon ishlaydi va haqiqiy ma'lumotlarga tegilmaydi.
 */
import { config } from "dotenv"

config({ quiet: true })

// Sinov ma'lumotlari haqiqiy bazaga tushmasin.
process.env.MONGODB_URI = ""
// Telegram imzosi o'rniga soxta foydalanuvchi (`X-Dev-User`).
process.env.ALLOW_DEV_USER = "1"
process.env.NODE_ENV = "development"
process.env.VERCEL_ENV = ""
// Bot xabarlari yuborilmasin.
process.env.TELEGRAM_BOT_TOKEN = ""

const { default: app } = await import("../server/app.js")

/** Sinovda ishlatiladigan video — YouTube'ning o'z namunasi. */
const VIDEO_URL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ"

const OWNER = "1"
const GUEST = "2"

let failures = 0

function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log("     ", JSON.stringify(detail))
  }
}

async function call<T>(
  method: string,
  path: string,
  user: string,
  body?: unknown,
): Promise<{ status: number; body: T }> {
  const res = await app.request(`/api${path}`, {
    method,
    headers: {
      "X-Dev-User": user,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    // Xato javobi HTML bo'lishi mumkin — o'shanda matnning o'zini ko'rsatamiz.
    parsed = text
  }
  return { status: res.status, body: parsed as T }
}

const get = <T,>(path: string, user: string) => call<T>("GET", path, user)
const post = <T,>(path: string, user: string, body?: unknown) =>
  call<T>("POST", path, user, body ?? {})

async function main() {
  console.log("\nKino uyi — API sinovi\n")

  /* --- 1. uy yaratish --- */

  const created = await post<{ code: string; inviteUrl: string }>("/rooms", OWNER, {
    url: VIDEO_URL,
  })
  check("uy yaratildi", created.status === 200 && Boolean(created.body.code), created.body)

  const code = created.body.code
  if (!code) {
    console.log("\nUy yaratilmadi — davom etib bo'lmaydi.\n")
    process.exit(1)
  }
  console.log(`     kod: ${code}`)

  const badUrl = await post<{ message: string }>("/rooms", OWNER, { url: "shunchaki matn" })
  check("noto'g'ri havola rad etildi", badUrl.status === 400, badUrl.body)

  /* --- 2. mehmon hali a'zo emas --- */

  const guestFirst = await get<{ access: string; state?: unknown }>(
    `/rooms/${code}/sync`,
    GUEST,
  )
  check(
    "mehmon uyni ko'radi, lekin ichkariga kira olmaydi",
    guestFirst.body.access === "none" && guestFirst.body.state === undefined,
    guestFirst.body,
  )

  const sneak = await post(`/rooms/${code}/messages`, GUEST, { text: "salom" })
  check("a'zo bo'lmagan odam yoza olmaydi", sneak.status === 403, sneak.body)

  /* --- 3. so'rov va tasdiq --- */

  const join = await post<{ access: string }>(`/rooms/${code}/join`, GUEST)
  check("kirish so'rovi yuborildi", join.body.access === "pending", join.body)

  const ownerSees = await get<{ pending: { userId: number }[] }>(`/rooms/${code}/sync`, OWNER)
  check(
    "uy egasi so'rovni ko'rdi",
    ownerSees.body.pending?.some((p) => p.userId === 2),
    ownerSees.body.pending,
  )

  const guestPending = await get<{ access: string }>(`/rooms/${code}/sync`, GUEST)
  check("mehmon «kutilmoqda» holatida", guestPending.body.access === "pending")

  const approve = await post(`/rooms/${code}/members/2`, OWNER, { action: "approve" })
  check("tasdiqlandi", approve.status === 200, approve.body)

  const guestIn = await get<{ access: string; members: unknown[]; state: { videoId: string } }>(
    `/rooms/${code}/sync`,
    GUEST,
  )
  check(
    "mehmon uyga kirdi va videoni ko'ryapti",
    guestIn.body.access === "member" &&
      guestIn.body.members.length === 2 &&
      guestIn.body.state.videoId === "aqz-KE-bpKQ",
    guestIn.body,
  )

  /* --- 4. video sinxroni --- */

  const play = await post<{ state: { isPlaying: boolean; positionSec: number; stateAt: number } }>(
    `/rooms/${code}/state`,
    OWNER,
    { isPlaying: true, positionSec: 42 },
  )
  check("uy egasi videoni yoqdi", play.body.state?.isPlaying === true, play.body)

  const guestState = await get<{ state: { isPlaying: boolean; positionSec: number } }>(
    `/rooms/${code}/sync`,
    GUEST,
  )
  check(
    "mehmonga holat yetib bordi (42-soniya, o'ynayapti)",
    guestState.body.state.isPlaying && guestState.body.state.positionSec === 42,
    guestState.body.state,
  )

  const guestPause = await post<{ state: { isPlaying: boolean } }>(
    `/rooms/${code}/state`,
    GUEST,
    { isPlaying: false, positionSec: 55 },
  )
  check("qulf ochiq — mehmon ham to'xtata oladi", guestPause.body.state?.isPlaying === false)

  /* --- 5. boshqaruv qulfi --- */

  await post(`/rooms/${code}/control`, OWNER, { locked: true })
  const blocked = await post(`/rooms/${code}/state`, GUEST, { isPlaying: true, positionSec: 60 })
  check("qulf yopiq — mehmonga ruxsat yo'q", blocked.status === 403, blocked.body)

  const lockOwner = await post(`/rooms/${code}/state`, OWNER, { isPlaying: true, positionSec: 60 })
  check("qulf yopiq — uy egasi boshqaraveradi", lockOwner.status === 200)

  const guestLock = await post(`/rooms/${code}/control`, GUEST, { locked: false })
  check("mehmon qulfni o'zgartira olmaydi", guestLock.status === 403)

  await post(`/rooms/${code}/control`, OWNER, { locked: false })

  /* --- 6. chat --- */

  const before = Date.now()
  const sent = await post<{ message: { text: string; at: number } }>(
    `/rooms/${code}/messages`,
    GUEST,
    { text: "Bu kino zo'r ekan!" },
  )
  check("mehmon xabar yozdi", sent.body.message?.text === "Bu kino zo'r ekan!", sent.body)

  const inbox = await get<{ messages: { text: string }[] }>(
    `/rooms/${code}/sync?msgSince=${before - 1}`,
    OWNER,
  )
  check(
    "xabar uy egasiga yetdi",
    inbox.body.messages?.some((m) => m.text === "Bu kino zo'r ekan!"),
    inbox.body.messages,
  )

  const future = await get<{ messages: unknown[] }>(
    `/rooms/${code}/sync?msgSince=${Date.now() + 1000}`,
    OWNER,
  )
  check("kursordan keyin eski xabarlar qaytmaydi", future.body.messages?.length === 0)

  const empty = await post(`/rooms/${code}/messages`, OWNER, { text: "   " })
  check("bo'sh xabar rad etildi", empty.status === 400)

  /* --- 6b. ovozli suhbat --- */

  /*
    Ovozning o'zi bu yerdan o'tmaydi — brauzerlar to'g'ridan-to'g'ri
    ulanadi. Server ikki ishni bajaradi: kim mikrofonini yoqqanini
    ko'rsatadi va tanishtiruv xatlarini (SDP) yetkazadi. Ikkalasi ham
    oddiy `sync` javobida ketadi.
  */

  const voiceOn = await get<{ members: { userId: number; voice: boolean }[] }>(
    `/rooms/${code}/sync?voice=1`,
    OWNER,
  )
  check(
    "mikrofon yoqilgani o'zida ko'rinadi",
    voiceOn.body.members?.find((m) => m.userId === 1)?.voice === true,
    voiceOn.body.members,
  )

  await get(`/rooms/${code}/sync?voice=1&muted=1`, GUEST)
  const seesVoice = await get<{
    members: { userId: number; voice: boolean; voiceMuted: boolean }[]
  }>(`/rooms/${code}/sync?voice=1`, OWNER)
  const guestVoice = seesVoice.body.members?.find((m) => m.userId === 2)
  check(
    "do'stning mikrofoni va uning o'chirilgani ko'rinadi",
    guestVoice?.voice === true && guestVoice?.voiceMuted === true,
    guestVoice,
  )

  const sdp = JSON.stringify({ type: "offer", sdp: "v=0\r\n" })
  const sigAt = Date.now()
  const offer = await post(`/rooms/${code}/signal`, OWNER, { to: 2, kind: "offer", payload: sdp })
  check("signal yuborildi", offer.status === 200, offer.body)

  const guestSignals = await get<{ signals: { from: number; kind: string; payload: string }[] }>(
    `/rooms/${code}/sync?voice=1&sigSince=${sigAt - 1}`,
    GUEST,
  )
  check(
    "signal faqat o'ziga atalgan odamga yetdi",
    guestSignals.body.signals?.length === 1 &&
      guestSignals.body.signals[0].from === 1 &&
      guestSignals.body.signals[0].payload === sdp,
    guestSignals.body.signals,
  )

  const ownerSignals = await get<{ signals: unknown[] }>(
    `/rooms/${code}/sync?voice=1&sigSince=${sigAt - 1}`,
    OWNER,
  )
  check(
    "yuboruvchining o'ziga qaytmaydi",
    ownerSignals.body.signals?.length === 0,
    ownerSignals.body.signals,
  )

  const afterCursor = await get<{ signals: unknown[] }>(
    `/rooms/${code}/sync?voice=1&sigSince=${Date.now() + 1000}`,
    GUEST,
  )
  check("kursordan keyin eski signallar qaytmaydi", afterCursor.body.signals?.length === 0)

  const outsiderSignal = await post(`/rooms/${code}/signal`, "3", {
    to: 1,
    kind: "offer",
    payload: sdp,
  })
  check("begona signal yubora olmaydi", outsiderSignal.status === 403, outsiderSignal.body)

  const strayTarget = await post(`/rooms/${code}/signal`, OWNER, {
    to: 999,
    kind: "offer",
    payload: sdp,
  })
  check("a'zo bo'lmagan odamga signal ketmaydi", strayTarget.status === 404, strayTarget.body)

  const voiceOff = await get<{ members: { userId: number; voice: boolean }[] }>(
    `/rooms/${code}/sync`,
    GUEST,
  )
  check(
    "mikrofon o'chirilsa belgi darhol so'nadi",
    voiceOff.body.members?.find((m) => m.userId === 2)?.voice === false,
    voiceOff.body.members,
  )

  /* --- 7. ro'yxat --- */

  const list = await get<{ code: string; memberCount: number; isOwner: boolean }[]>(
    "/rooms",
    OWNER,
  )
  const row = list.body.find((r) => r.code === code)
  check("uy ro'yxatda ko'rinadi", row?.isOwner === true && row?.memberCount === 2, list.body)

  /* --- 8. kinoni almashtirish --- */

  const guestSwap = await post(`/rooms/${code}/video`, GUEST, { url: VIDEO_URL })
  check("mehmon kinoni almashtira olmaydi", guestSwap.status === 403)

  const swap = await post<{ state: { videoId: string } }>(`/rooms/${code}/video`, OWNER, {
    url: "https://youtu.be/dQw4w9WgXcQ?t=30",
  })
  check("uy egasi kinoni almashtirdi", swap.body.state?.videoId === "dQw4w9WgXcQ", swap.body)

  /* --- 9. chiqarish va yopish --- */

  const kick = await post(`/rooms/${code}/members/2`, OWNER, { action: "block" })
  check("mehmon bloklandi", kick.status === 200)

  const afterBlock = await get<{ access: string }>(`/rooms/${code}/sync`, GUEST)
  check("bloklangan odam ichkariga kira olmaydi", afterBlock.body.access === "blocked")

  const rejoin = await post<{ access: string }>(`/rooms/${code}/join`, GUEST)
  check("bloklangan odam qayta so'rov yubora olmaydi", rejoin.body.access === "blocked")

  const blockedSeen = await get<{ blocked?: { userId: number }[] }>(`/rooms/${code}/sync`, OWNER)
  check(
    "bloklangan odam uy egasiga ko'rinadi",
    (blockedSeen.body.blocked ?? []).some((m) => m.userId === 2),
    blockedSeen.body.blocked,
  )

  const guestSees = await get<{ blocked?: unknown[] }>(`/rooms/${code}/sync`, GUEST)
  check("bloklanganlar ro'yxati boshqaga ko'rinmaydi", guestSees.body.blocked === undefined)

  const unblock = await post(`/rooms/${code}/members/2`, OWNER, { action: "unblock" })
  check("blokdan chiqarildi", unblock.status === 200)

  const afterUnblock = await get<{ access: string; blocked?: unknown[] }>(
    `/rooms/${code}/sync`,
    OWNER,
  )
  check(
    "blokdan chiqarilgan odam ro'yxatdan tushdi",
    (afterUnblock.body.blocked ?? []).length === 0,
    afterUnblock.body.blocked,
  )

  const guestAfter = await get<{ access: string }>(`/rooms/${code}/sync`, GUEST)
  check(
    "u endi begona — so'ramagan so'rovi ko'rinmaydi",
    guestAfter.body.access === "none",
    guestAfter.body,
  )

  const rejoinOk = await post<{ access: string }>(`/rooms/${code}/join`, GUEST)
  check("qaytadan so'rov yubora oladi", rejoinOk.body.access === "pending", rejoinOk.body)


  /* --- 9. uy ko'rinishi --- */

  const THIRD = "3"

  const openList = await get<{ code: string }[]>("/rooms/public", THIRD)
  check(
    "ochiq uy begonaga ko'rinadi",
    openList.status === 200 && openList.body.some((r) => r.code === code),
    openList.body,
  )

  const ownerList = await get<{ code: string }[]>("/rooms/public", OWNER)
  check(
    "o'z uying ochiq ro'yxatda takrorlanmaydi",
    !ownerList.body.some((r) => r.code === code),
    ownerList.body,
  )

  const secret = await post<{ code: string }>("/rooms", OWNER, {
    url: VIDEO_URL,
    visibility: "private",
  })
  const secretCode = secret.body.code
  check("maxfiy uy yaratildi", secret.status === 200 && Boolean(secretCode))

  const afterSecret = await get<{ code: string }[]>("/rooms/public", THIRD)
  check(
    "maxfiy uy ro'yxatda ko'rinmaydi",
    !afterSecret.body.some((r) => r.code === secretCode),
    afterSecret.body,
  )

  const secretSync = await get<{ access: string; visibility: string }>(
    `/rooms/${secretCode}/sync`,
    THIRD,
  )
  check(
    "maxfiy uyga havola (kod) orqali borish mumkin",
    secretSync.status === 200 && secretSync.body.visibility === "private",
    secretSync.body,
  )

  const guestHide = await post(`/rooms/${secretCode}/visibility`, THIRD, {
    visibility: "public",
  })
  check("begona ko'rinishni o'zgartira olmaydi", guestHide.status === 403)

  await post(`/rooms/${secretCode}/visibility`, OWNER, { visibility: "public" })
  const opened = await get<{ code: string }[]>("/rooms/public", THIRD)
  check(
    "ochilgan uy ro'yxatga tushdi",
    opened.body.some((r) => r.code === secretCode),
    opened.body,
  )

  await post(`/rooms/${secretCode}/close`, OWNER)
  const missing = await get(`/rooms/yoqbunday/sync`, OWNER)
  check("mavjud bo'lmagan uy — 404", missing.status === 404)

  const close = await post(`/rooms/${code}/close`, OWNER)
  check("uy yopildi", close.status === 200)

  const afterClose = await get<{ closed: boolean }>(`/rooms/${code}/sync`, OWNER)
  check("yopilgan uy shunday belgilanadi", afterClose.body.closed === true)

  /* --- xulosa --- */

  console.log(
    failures === 0
      ? "\n✓ Hammasi joyida.\n"
      : `\n✗ ${failures} ta tekshiruv o'tmadi.\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error("\n✗", err)
  process.exit(1)
})
