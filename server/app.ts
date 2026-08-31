import { Hono, type Context } from "hono"
import { cors } from "hono/cors"
import { z } from "zod"

import type {
  LessonSummary,
  Me,
  RoomMemberAction,
  RoomStateView,
  VocabAttemptInput,
} from "../shared/types.js"
import { parseYouTubeId } from "../shared/youtube.js"
import { handleUpdate, type TelegramUpdate } from "./bot.js"
import { LESSONS, getLessonById } from "./content/lessons.js"
import { authenticateDetailed, type AuthResult } from "./lib/auth.js"
import { webhookSecret } from "./lib/botApi.js"
import { getStore, type RoomDoc, type Store } from "./lib/db.js"
import * as rooms from "./lib/rooms.js"
import { fetchVideoInfo } from "./lib/youtube.js"
import { describeUpstreamError } from "./lib/errors.js"
import { env, hasBotToken, hasMongo } from "./lib/env.js"
import { hasOpenAI } from "./lib/openai.js"
import { getTtsProvider, hasTts, speak } from "./lib/tts/index.js"
import { evaluateReading } from "./lib/pronunciation.js"
import {
  leaderboard,
  lessonProgress,
  saveReading,
  saveVocabAttempt,
  touchUser,
  userStats,
} from "./lib/repo.js"

type Vars = { auth: AuthResult; store: Store }

const app = new Hono<{ Variables: Vars }>().basePath("/api")

app.use("*", cors({ origin: "*", allowHeaders: ["Authorization", "Content-Type", "X-Dev-User"] }))

/**
 * Baza holati.
 *
 * `getStore()` ulanish uzilganda jimgina xotira rejimiga o'tadi — ilova
 * ishlayveradi, lekin **bo'sh**: hamma o'quvchining bali nol bo'lib
 * ko'rinadi va reyting bo'shab qoladi. Tashqaridan bu "ma'lumot o'chib
 * ketibdi" bo'lib ko'rinardi, aslida esa ulanish yo'q edi.
 *
 * Shuning uchun holat shu yerda ochiq turadi: `connected: false` —
 * demak ma'lumotga tegilmagan, shunchaki bazaga yetib borilmayapti.
 * Kalitlar chiqmaydi, faqat baza nomi.
 */
async function dbStatus() {
  if (!hasMongo()) return { configured: false, connected: false, name: null }
  const store = await getStore()
  return { configured: true, connected: !store.ephemeral, name: env.mongoDb }
}

app.get("/health", async (c) =>
  c.json({
    ok: true,
    db: await dbStatus(),
    // Bot tugmalari shu manzilni ochadi. Sir emas, lekin xato bo'lsa ilova
    // "sahifani yangilang" deb turaveradi — shuning uchun ko'rinib tursin.
    appUrl: env.publicUrl || null,
    // Kalitlar emas, faqat sozlanganlik holati chiqadi.
    ttsProvider: getTtsProvider()?.name ?? null,
    features: { tts: hasTts(), pronunciation: hasOpenAI() },
    auth: {
      // Deploy'dan keyin tekshirish uchun: production'da ikkalasi ham
      // to'g'ri bo'lishi shart — aks holda ilova ochiq qoladi.
      telegram: hasBotToken(),
      devUserAllowed: env.allowDevUser,
    },
  }),
)

/* ----------------------------------------------------------------- webhook */

/**
 * Telegram yangilanishlari. Bu marshrut `tma` autentifikatsiyasidan o'tmaydi —
 * so'rov Telegram serverlaridan keladi, foydalanuvchidan emas. Uning o'rniga
 * `setWebhook` da berilgan maxfiy kalit tekshiriladi.
 */
app.post("/telegram/webhook", async (c) => {
  if (c.req.header("x-telegram-bot-api-secret-token") !== webhookSecret()) {
    return c.json({ error: "forbidden", message: "Noto'g'ri kalit." }, 403)
  }

  const update = (await c.req.json().catch(() => null)) as TelegramUpdate | null
  if (!update) return c.json({ ok: true })

  // Ishni fonda qoldirib bo'lmaydi: javob qaytgach Vercel instansiyani muzlatadi
  // va `sendMessage` bajarilmay qoladi — u faqat keyingi so'rov instansiyani
  // uyg'otganda yuborilardi (o'quvchi /start javobini ilovani ochgandagina
  // ko'rardi). handleUpdate xatolarni o'zi yutadi, shuning uchun kutamiz.
  await handleUpdate(update)

  return c.json({ ok: true })
})

/* ------------------------------------------------------------ autentifikatsiya */

const PUBLIC_PATHS = new Set(["/api/health", "/api/telegram/webhook"])

app.use("*", async (c, next) => {
  if (PUBLIC_PATHS.has(c.req.path)) return next()

  const { auth, reason } = authenticateDetailed(c.req.raw)
  if (!auth) {
    // Sabab o'quvchiga ko'rsatilmaydi, lekin jurnalga tushadi: "initData
    // kelmadi" bilan "imzo mos emas" ni ajratmasdan turib 401 ni tashxislab
    // bo'lmaydi, Mini App ichida esa na konsol, na tarmoq paneli bor.
    console.warn(`[auth] rad etildi: ${reason ?? "sabab noma'lum"}`)

    return c.json(
      {
        error: "unauthorized",
        message:
          "Bu ilova Telegram bot ichida ishlaydi. Iltimos, botdagi tugma orqali oching.",
      },
      401,
    )
  }

  c.set("auth", auth)
  c.set("store", await getStore())
  await next()
})

/* ------------------------------------------------------------------ /api/me */

app.get("/me", async (c) => {
  const { user, isAdmin } = c.get("auth")
  const store = c.get("store")
  const doc = await touchUser(store, user)

  const me: Me = {
    id: doc._id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    username: doc.username,
    photoUrl: doc.photoUrl,
    isAdmin,
    stats: await userStats(store, doc),
  }
  return c.json(me)
})

/* ------------------------------------------------------------- /api/lessons */

app.get("/lessons", async (c) => {
  const { user } = c.get("auth")
  const store = c.get("store")

  const summaries: LessonSummary[] = await Promise.all(
    [...LESSONS]
      .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
      .map(async (lesson) => ({
        id: lesson.id,
        title: lesson.title,
        titleUz: lesson.titleUz,
        level: lesson.level,
        topic: lesson.topic,
        assignedAt: lesson.assignedAt,
        dueAt: lesson.dueAt,
        sentenceCount: lesson.reading.sentences.length,
        wordCount: lesson.vocabulary.length,
        progress: await lessonProgress(store, user.id, lesson.id, {
          sentences: lesson.reading.sentences.length,
          words: lesson.vocabulary.length,
        }),
      })),
  )

  return c.json(summaries)
})

app.get("/lessons/:id", async (c) => {
  const lesson = getLessonById(c.req.param("id"))
  if (!lesson) return c.json({ error: "not_found", message: "Bunday dars topilmadi." }, 404)

  const { user } = c.get("auth")
  const progress = await lessonProgress(c.get("store"), user.id, lesson.id, {
    sentences: lesson.reading.sentences.length,
    words: lesson.vocabulary.length,
  })

  return c.json({ lesson, progress })
})

/* ----------------------------------------------------------------- /api/tts */

const ttsSchema = z.object({
  text: z.string().min(1).max(1200),
  /** Bir martalik matn — keshlanmaydi. Odatda kerak emas. */
  personal: z.boolean().optional(),
})

app.post("/tts", async (c) => {
  if (!hasTts()) {
    return c.json(
      {
        error: "tts_unavailable",
        message: "Ovoz xizmati sozlanmagan (GOOGLE_TTS_API_KEY yoki OPENAI_API_KEY yo'q).",
      },
      503,
    )
  }

  const parsed = ttsSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Matn noto'g'ri yuborildi." }, 400)
  }

  const { text, personal = false } = parsed.data
  const { audio, cached } = await speak(text, { cacheable: !personal })

  return c.body(new Uint8Array(audio), 200, {
    "Content-Type": "audio/mpeg",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(audio.byteLength),
    "X-Tts-Cached": cached ? "1" : "0",
  })
})

/* ------------------------------------------------------- /api/pronunciation */

app.post("/pronunciation", async (c) => {
  if (!hasOpenAI()) {
    return c.json(
      {
        error: "stt_unavailable",
        message: "Talaffuz tahlili sozlanmagan (OPENAI_API_KEY yo'q).",
      },
      503,
    )
  }

  const form = await c.req.formData().catch(() => null)
  const audio = form?.get("audio")
  const lessonId = String(form?.get("lessonId") ?? "")
  const sentenceId = String(form?.get("sentenceId") ?? "")
  const clientDurationMs = Number(form?.get("durationMs") ?? 0) || undefined

  if (!(audio instanceof File) || audio.size === 0) {
    return c.json({ error: "bad_request", message: "Ovoz fayli yuborilmadi." }, 400)
  }
  if (audio.size > 8 * 1024 * 1024) {
    return c.json({ error: "too_large", message: "Yozuv juda uzun. Qisqaroq o'qing." }, 413)
  }

  const lesson = getLessonById(lessonId)
  const sentence = lesson?.reading.sentences.find((s) => s.id === sentenceId)
  if (!lesson || !sentence) {
    return c.json({ error: "not_found", message: "Gap topilmadi." }, 404)
  }

  const report = await evaluateReading({
    sentenceId,
    sentenceRu: sentence.ru,
    sentenceUz: sentence.uz,
    file: audio,
    clientDurationMs,
  })

  const { user } = c.get("auth")
  await saveReading(c.get("store"), {
    userId: user.id,
    lessonId,
    sentenceId,
    accuracy: report.accuracy,
    wpm: report.wpm,
    transcript: report.transcript,
  })

  return c.json(report)
})

/* -------------------------------------------------------- /api/vocab/attempt */

const attemptSchema = z.object({
  lessonId: z.string().min(1),
  mode: z.enum(["cards", "sprint", "sentence"]),
  correct: z.number().int().min(0),
  total: z.number().int().min(1).max(200),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000),
  wordResults: z
    .array(
      z.object({
        wordId: z.string().min(1),
        correct: z.boolean(),
        ms: z.number().int().min(0).max(10 * 60 * 1000),
      }),
    )
    .min(1)
    .max(200),
})

app.post("/vocab/attempt", async (c) => {
  const parsed = attemptSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Natija noto'g'ri yuborildi." }, 400)
  }

  const lesson = getLessonById(parsed.data.lessonId)
  if (!lesson) return c.json({ error: "not_found", message: "Dars topilmadi." }, 404)

  // Faqat shu darsdagi so'zlar hisobga olinadi.
  const validIds = new Set(lesson.vocabulary.map((w) => w.id))
  const input: VocabAttemptInput = {
    ...parsed.data,
    wordResults: parsed.data.wordResults.filter((r) => validIds.has(r.wordId)),
  }
  if (!input.wordResults.length) {
    return c.json({ error: "bad_request", message: "Hech qanday so'z natijasi yo'q." }, 400)
  }

  const { user } = c.get("auth")
  const store = c.get("store")
  await touchUser(store, user)

  return c.json(await saveVocabAttempt(store, user.id, input))
})

/* --------------------------------------------------------- /api/leaderboard */

app.get("/leaderboard", async (c) => {
  const { user } = c.get("auth")
  const lessonId = c.req.query("lessonId") || null
  const period = c.req.query("period") === "week" ? "week" : "all"

  return c.json(await leaderboard(c.get("store"), { lessonId, period, meId: user.id }))
})

/* --------------------------------------------------------------- /api/rooms
 *
 * "Kino uyi" — do'stlar bilan birga YouTube ko'rish. Real vaqt WebSocket'siz:
 * holat MongoDB'da turadi, mijoz `sync` ni qisqa oraliqda so'rab turadi.
 * Sabablari `server/lib/rooms.ts` boshida yozilgan.
 */

type RoomContext = Context<{ Variables: Vars }>

const forbidden = (c: RoomContext, message: string) =>
  c.json({ error: "forbidden", message }, 403)

const roomNotFound = (c: RoomContext) =>
  c.json({ error: "not_found", message: "Bunday uy topilmadi yoki yopilgan." }, 404)

/**
 * Havolani tekshirib, video id va sarlavhasini qaytaradi.
 *
 * YouTube javob bermasa uy yaratilishiga to'sqinlik qilmaymiz — sarlavhasiz
 * davom etamiz. Lekin video o'chirilgan yoki tashqi saytda ko'rish taqiqlangan
 * bo'lsa darhol aytamiz: aks holda o'quvchi qora ekran oldida qolardi.
 */
async function resolveVideo(
  raw: string,
): Promise<{ ok: true; videoId: string; title: string } | { ok: false; message: string }> {
  const videoId = parseYouTubeId(raw)
  if (!videoId) {
    return {
      ok: false,
      message: "Bu YouTube havolasiga o'xshamaydi. Masalan: youtube.com/watch?v=... yoki youtu.be/...",
    }
  }

  const info = await fetchVideoInfo(videoId)
  if (info.ok) return { ok: true, videoId, title: info.title }

  if (info.reason === "not_found") {
    return { ok: false, message: "Bunday video topilmadi — o'chirilgan yoki yopiq bo'lishi mumkin." }
  }
  if (info.reason === "not_embeddable") {
    return {
      ok: false,
      message:
        "Bu videoni boshqa ilovada ko'rish taqiqlangan (egasi shunday sozlagan). Boshqa havola tanlang.",
    }
  }

  // Tarmoq nosozligi — sarlavhasiz davom etamiz.
  return { ok: true, videoId, title: "YouTube video" }
}

/** Marshrut kodidan uyni topadi. */
async function roomOf(c: RoomContext): Promise<RoomDoc | null> {
  const code = (c.req.param("code") ?? "").trim().toLowerCase()
  if (!/^[a-z0-9]{4,12}$/.test(code)) return null
  return rooms.getRoom(c.get("store"), code)
}

app.get("/rooms", async (c) => {
  const { user } = c.get("auth")
  return c.json(await rooms.listMyRooms(c.get("store"), user.id))
})

/**
 * Ochiq uylar — kodni bilmagan odam ham ko'radigan ro'yxat.
 *
 * `/rooms/:code/...` marshrutlaridan oldin turadi, lekin to'qnashmaydi:
 * ularda `/rooms` dan keyin ikkita bo'lak bor, bu yerda esa bitta.
 */
app.get("/rooms/public", async (c) => {
  const { user } = c.get("auth")
  return c.json(await rooms.listPublicRooms(c.get("store"), user.id))
})

const visibilitySchema = z.enum(["public", "private"])

const createRoomSchema = z.object({
  url: z.string().min(1).max(500),
  /** Berilmasa uy ochiq bo'ladi — sukut bo'yicha uylar hammaga ko'rinadi. */
  visibility: visibilitySchema.optional(),
})

app.post("/rooms", async (c) => {
  const parsed = createRoomSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Havola yuborilmadi." }, 400)
  }

  const video = await resolveVideo(parsed.data.url)
  if (!video.ok) return c.json({ error: "bad_video", message: video.message }, 400)

  const { user } = c.get("auth")
  const store = c.get("store")
  await touchUser(store, user)

  const room = await rooms.createRoom(store, user, {
    videoId: video.videoId,
    title: video.title,
    visibility: parsed.data.visibility ?? "public",
  })
  return c.json({ code: room._id, inviteUrl: await rooms.inviteUrl(room._id) })
})

app.post("/rooms/:code/visibility", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  if (room.ownerId !== user.id) return forbidden(c, "Buni faqat uy egasi o'zgartira oladi.")

  const parsed = z
    .object({ visibility: visibilitySchema })
    .safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Qiymat noto'g'ri." }, 400)
  }

  await rooms.setVisibility(c.get("store"), room, parsed.data.visibility)
  return c.json({ ok: true })
})

app.get("/rooms/:code/sync", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")

  /*
    Mikrofon holati ham shu so'rovda keladi (`voice`, `muted`): u baribir
    sekundiga bir marta yuboriladi, ya'ni ovozli suhbat uchun alohida
    "tirikman" so'rovi qo'shish shart emas.
  */
  return c.json(
    await rooms.buildSync(c.get("store"), room, user, {
      msgSince: Number(c.req.query("msgSince") ?? 0) || 0,
      sigSince: Number(c.req.query("sigSince") ?? 0) || 0,
      voice: c.req.query("voice") === "1",
      voiceMuted: c.req.query("muted") === "1",
    }),
  )
})

app.post("/rooms/:code/join", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)
  if (room.closed) return forbidden(c, "Bu uy yopilgan.")

  const { user } = c.get("auth")
  const store = c.get("store")
  await touchUser(store, user)

  return c.json({ access: await rooms.requestJoin(store, room, user) })
})

const stateSchema = z.object({
  isPlaying: z.boolean(),
  positionSec: z.number().min(0).max(24 * 60 * 60),
})

app.post("/rooms/:code/state", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  const store = c.get("store")

  const member = await rooms.getMember(store, room._id, user.id)
  if (rooms.accessOf(member) !== "member") return forbidden(c, "Siz bu uyning a'zosi emassiz.")
  if (!rooms.canControl(room, user.id)) {
    return forbidden(c, "Hozir videoni faqat uy egasi boshqaradi.")
  }

  const parsed = stateSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Holat noto'g'ri yuborildi." }, 400)
  }

  const updated = await rooms.setState(store, room, user, parsed.data)
  return c.json({ state: stateView(updated) })
})

app.post("/rooms/:code/video", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  if (room.ownerId !== user.id) return forbidden(c, "Kinoni faqat uy egasi almashtira oladi.")

  const parsed = createRoomSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Havola yuborilmadi." }, 400)
  }

  const video = await resolveVideo(parsed.data.url)
  if (!video.ok) return c.json({ error: "bad_video", message: video.message }, 400)

  const updated = await rooms.setVideo(c.get("store"), room, user, video)
  return c.json({ state: stateView(updated) })
})

app.post("/rooms/:code/control", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  if (room.ownerId !== user.id) return forbidden(c, "Buni faqat uy egasi o'zgartira oladi.")

  const parsed = z
    .object({ locked: z.boolean() })
    .safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: "bad_request", message: "Noto'g'ri so'rov." }, 400)

  await rooms.setControlLock(c.get("store"), room, parsed.data.locked)
  return c.json({ ok: true })
})

const messageSchema = z.object({
  text: z.string().trim().min(1).max(rooms.MAX_MESSAGE_LENGTH),
})

app.post("/rooms/:code/messages", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  const store = c.get("store")

  const member = await rooms.getMember(store, room._id, user.id)
  if (rooms.accessOf(member) !== "member") return forbidden(c, "Siz bu uyning a'zosi emassiz.")

  const parsed = messageSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Xabar bo'sh yoki juda uzun." }, 400)
  }

  return c.json({ message: await rooms.addMessage(store, room, user, parsed.data.text) })
})

/* ---------------------------------------------------------- ovozli suhbat
 *
 * Ovoz serverdan o'tmaydi: brauzerlar bir-biriga to'g'ridan-to'g'ri
 * ulanadi (WebRTC). Serverning ishi — ikkita tanishtiruv xatini
 * (`offer` / `answer`) yetkazish va chiqib ketganini aytish (`bye`).
 * Ular ham `sync` javobida keladi, ya'ni yangi ulanish turi kerak emas.
 */

const signalSchema = z.object({
  to: z.number().int(),
  kind: z.enum(["offer", "answer", "bye"]),
  payload: z.string().max(rooms.MAX_SIGNAL_LENGTH),
})

app.post("/rooms/:code/signal", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  const store = c.get("store")

  const me = await rooms.getMember(store, room._id, user.id)
  if (rooms.accessOf(me) !== "member") return forbidden(c, "Siz bu uyning a'zosi emassiz.")

  const parsed = signalSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json({ error: "bad_request", message: "Signal noto'g'ri yuborildi." }, 400)
  }

  // Signal faqat shu uyning a'zosiga boradi: begonaga ovozli ulanish
  // taklifi ketmasin.
  const target = await rooms.getMember(store, room._id, parsed.data.to)
  if (rooms.accessOf(target) !== "member") {
    return c.json({ error: "not_found", message: "Bunday a'zo yo'q." }, 404)
  }

  await rooms.addSignal(store, room._id, user, parsed.data.to, parsed.data.kind, parsed.data.payload)
  return c.json({ ok: true })
})

/**
 * NAT ortidan chiqish serverlari.
 *
 * Alohida so'rov: ro'yxat kamdan-kam o'zgaradi, `sync` javobiga esa
 * sekundiga bir marta qo'shilib yurishi ortiqcha. TURN maxfiy so'zi
 * mijoz kodiga tikilmaydi — u shu yerda, serverda turadi.
 */
app.get("/rtc/ice", (c) => {
  const turn = env.turn
  return c.json({
    iceServers: [
      { urls: env.stunUrls },
      ...(turn ? [{ urls: turn.urls, username: turn.username, credential: turn.credential }] : []),
    ],
  })
})

const memberActionSchema = z.object({
  action: z.enum(["approve", "reject", "kick", "block", "unblock"]),
})

app.post("/rooms/:code/members/:userId", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  const store = c.get("store")
  if (room.ownerId !== user.id) return forbidden(c, "A'zolarni faqat uy egasi boshqaradi.")

  const targetId = Number(c.req.param("userId"))
  if (!Number.isFinite(targetId)) {
    return c.json({ error: "bad_request", message: "Foydalanuvchi ko'rsatilmadi." }, 400)
  }
  if (targetId === room.ownerId) {
    return forbidden(c, "Uy egasini uydan chiqarib bo'lmaydi.")
  }

  const parsed = memberActionSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: "bad_request", message: "Noto'g'ri amal." }, 400)

  const target = await rooms.getMember(store, room._id, targetId)
  if (!target) return c.json({ error: "not_found", message: "Bunday a'zo yo'q." }, 404)

  const action: RoomMemberAction = parsed.data.action
  if (action === "approve") await rooms.approveMember(store, room, target)
  else if (action === "block") await rooms.blockMember(store, room, target)
  else if (action === "unblock") await rooms.unblockMember(store, room, target)
  else await rooms.dropMember(store, room, target)

  return c.json({ ok: true })
})

app.post("/rooms/:code/leave", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  const store = c.get("store")

  // Uy egasi "chiqib ketsa" uy yopiladi — egasiz uy hech kimga kerak emas.
  if (room.ownerId === user.id) {
    await rooms.closeRoom(store, room)
    return c.json({ ok: true, closed: true })
  }

  const member = await rooms.getMember(store, room._id, user.id)
  if (member) await rooms.dropMember(store, room, member)
  return c.json({ ok: true, closed: false })
})

app.post("/rooms/:code/close", async (c) => {
  const room = await roomOf(c)
  if (!room) return roomNotFound(c)

  const { user } = c.get("auth")
  if (room.ownerId !== user.id) return forbidden(c, "Uyni faqat egasi yopa oladi.")

  await rooms.closeRoom(c.get("store"), room)
  return c.json({ ok: true })
})

const stateView = (room: RoomDoc): RoomStateView => ({
  videoId: room.videoId,
  title: room.title,
  isPlaying: room.isPlaying,
  positionSec: room.positionSec,
  stateAt: room.stateAt,
  stateBy: room.stateBy,
  stateByName: room.stateByName,
  controlLocked: room.controlLocked,
})

/* ------------------------------------------------------------------- xatolar */

app.notFound((c) => c.json({ error: "not_found", message: "Bunday manzil yo'q." }, 404))

app.onError((err, c) => {
  // Tashqi xizmat muammosi bo'lsa — sababini aniq aytamiz.
  const friendly = describeUpstreamError(err)
  if (friendly) {
    console.error(`[api] ${friendly.body.error}:`, err instanceof Error ? err.message : err)
    return c.json(friendly.body, friendly.status)
  }

  console.error("[api]", err)
  return c.json(
    { error: "internal", message: "Serverda xatolik yuz berdi. Birozdan so'ng urinib ko'ring." },
    500,
  )
})

export default app
