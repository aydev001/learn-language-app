import { Hono } from "hono"
import { cors } from "hono/cors"
import { z } from "zod"

import type { LessonSummary, Me, VocabAttemptInput } from "../shared/types.js"
import { handleUpdate, type TelegramUpdate } from "./bot.js"
import { LESSONS, getLessonById } from "./content/lessons.js"
import { authenticateDetailed, type AuthResult } from "./lib/auth.js"
import { webhookSecret } from "./lib/botApi.js"
import { getStore, type Store } from "./lib/db.js"
import { describeUpstreamError } from "./lib/errors.js"
import { env, hasBotToken } from "./lib/env.js"
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

app.get("/health", (c) =>
  c.json({
    ok: true,
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
    return c.json(
      {
        error: "unauthorized",
        // Sabab matnga qo'shiladi: 401 ni tashxislashning boshqa yo'li yo'q —
        // Mini App ichida na konsol, na tarmoq paneli bor.
        message:
          "Bu ilova Telegram bot ichida ishlaydi. Iltimos, botdagi tugma orqali oching." +
          (reason ? ` [${reason}]` : ""),
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
