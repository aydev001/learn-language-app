import type {
  LeaderboardPeriod,
  LeaderboardResponse,
  LeaderboardRow,
  LessonProgress,
  UserStats,
  VocabAttemptInput,
  VocabAttemptResult,
} from "../../shared/types.js"
import { attemptScore, maxScore } from "../../shared/scoring.js"
import type { AttemptDoc, ReadingDoc, Store, UserDoc } from "./db.js"
import type { TelegramUser } from "./auth.js"

const today = () => new Date().toISOString().slice(0, 10)
const nowIso = () => new Date().toISOString()
const randomId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

/** O'qib chiqilgan deb hisoblanadigan minimal aniqlik */
export const PASS_ACCURACY = 0.7

/* --------------------------------------------------------------- users */

export async function touchUser(store: Store, tg: TelegramUser): Promise<UserDoc> {
  const day = today()
  await store.users.upsert(tg.id, {
    set: {
      firstName: tg.first_name,
      lastName: tg.last_name,
      username: tg.username,
      photoUrl: tg.photo_url,
      lastSeenAt: nowIso(),
    },
    setOnInsert: { createdAt: nowIso() },
    // `activeDays` ni setOnInsert'da e'lon qilmaymiz: $addToSet massivni
    // o'zi yaratadi, ikkalasi bir maydonga tegsa MongoDB konflikt beradi.
    addToSet: { activeDays: day },
  })
  const user = await store.users.findOne({ _id: tg.id })
  return (
    user ?? {
      _id: tg.id,
      firstName: tg.first_name,
      createdAt: nowIso(),
      lastSeenAt: nowIso(),
      activeDays: [day],
    }
  )
}

/** Bugundan (yoki kechadan) boshlab ketma-ket faol kunlar soni. */
export function computeStreak(activeDays: string[]): number {
  if (!activeDays.length) return 0
  const days = new Set(activeDays)
  const cursor = new Date()

  // Bugun hali kirmagan bo'lsa, streak kechadan hisoblanadi.
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export async function userStats(store: Store, user: UserDoc): Promise<UserStats> {
  const [attempts, readings, words] = await Promise.all([
    store.attempts.find({ userId: user._id }),
    store.readings.find({ userId: user._id }),
    store.wordStats.find({ userId: user._id }),
  ])

  // Har bir dars bo'yicha eng yaxshi natija yig'iladi — takroriy o'ynash ball to'plamaydi.
  const bestPerLesson = new Map<string, number>()
  for (const a of attempts) {
    bestPerLesson.set(a.lessonId, Math.max(bestPerLesson.get(a.lessonId) ?? 0, a.score))
  }

  return {
    totalScore: [...bestPerLesson.values()].reduce((s, v) => s + v, 0),
    sprintsPlayed: attempts.length,
    readingsDone: new Set(readings.filter((r) => r.accuracy >= PASS_ACCURACY).map((r) => `${r.lessonId}:${r.sentenceId}`))
      .size,
    wordsMastered: words.filter((w) => w.seen >= 3 && w.correct / w.seen >= 0.8).length,
    bestAccuracy: readings.reduce((m, r) => Math.max(m, r.accuracy), 0),
    streak: computeStreak(user.activeDays ?? []),
  }
}

/* ------------------------------------------------------------ progress */

export async function lessonProgress(
  store: Store,
  userId: number,
  lessonId: string,
  totals: { sentences: number; words: number },
): Promise<LessonProgress> {
  const [readings, attempts] = await Promise.all([
    store.readings.find({ userId, lessonId }),
    store.attempts.find({ userId, lessonId }),
  ])

  const bestAccuracy: Record<string, number> = {}
  for (const r of readings) {
    bestAccuracy[r.sentenceId] = Math.max(bestAccuracy[r.sentenceId] ?? 0, r.accuracy)
  }

  const sentencesDone = Object.entries(bestAccuracy)
    .filter(([, acc]) => acc >= PASS_ACCURACY)
    .map(([id]) => id)

  const vocabBestScore = attempts.reduce((m, a) => Math.max(m, a.score), 0)
  const readingPart = totals.sentences ? sentencesDone.length / totals.sentences : 0
  const vocabPart = totals.words ? Math.min(1, vocabBestScore / maxScore(totals.words)) : 0

  return {
    sentencesDone,
    bestAccuracy,
    vocabBestScore,
    vocabPlays: attempts.length,
    completion: Math.round((readingPart * 0.6 + vocabPart * 0.4) * 100) / 100,
  }
}

/* ------------------------------------------------------------- yozuvlar */

export async function saveReading(
  store: Store,
  doc: Omit<ReadingDoc, "_id" | "createdAt">,
): Promise<void> {
  await store.readings.insertOne({ ...doc, _id: randomId(), createdAt: nowIso() })
}

export async function saveVocabAttempt(
  store: Store,
  userId: number,
  input: VocabAttemptInput,
): Promise<VocabAttemptResult> {
  const previous = await store.attempts.find({ userId, lessonId: input.lessonId })
  const previousBest = previous.reduce((m, a) => Math.max(m, a.score), 0)

  // Ballni serverda qayta hisoblaymiz.
  const score = attemptScore(input.wordResults, input.mode)

  const doc: AttemptDoc = {
    _id: randomId(),
    userId,
    lessonId: input.lessonId,
    mode: input.mode,
    correct: input.correct,
    total: input.total,
    durationMs: input.durationMs,
    score,
    createdAt: nowIso(),
  }
  await store.attempts.insertOne(doc)

  // So'z bo'yicha statistika — kelajakdagi takrorlash uchun
  await Promise.all(
    input.wordResults.map((r) =>
      store.wordStats.upsert(`${userId}:${input.lessonId}:${r.wordId}`, {
        set: { userId, lessonId: input.lessonId, wordId: r.wordId, lastAt: nowIso() },
        // $inc hisoblagichni nolda o'zi boshlaydi — setOnInsert bilan
        // takrorlansa MongoDB konflikt xatosini beradi.
        inc: { seen: 1, correct: r.correct ? 1 : 0, totalMs: r.ms },
      }),
    ),
  )

  const board = await leaderboard(store, { lessonId: input.lessonId, period: "all", meId: userId })

  return {
    score,
    personalBest: score > previousBest,
    previousBest,
    rank: board.me?.rank ?? board.rows.length + 1,
    totalPlayers: board.rows.length,
  }
}

/* ------------------------------------------------------------- reyting */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function leaderboard(
  store: Store,
  opts: { lessonId: string | null; period: LeaderboardPeriod; meId: number },
): Promise<LeaderboardResponse> {
  const filter: Record<string, unknown> = {}
  if (opts.lessonId) filter.lessonId = opts.lessonId
  if (opts.period === "week") {
    filter.createdAt = { $gte: new Date(Date.now() - WEEK_MS).toISOString() }
  }

  const attempts = await store.attempts.find(filter)

  interface Agg {
    userId: number
    score: number
    bestTimeMs: number
    correct: number
    total: number
    plays: number
  }
  const byUser = new Map<number, Agg>()

  for (const a of attempts) {
    const agg = byUser.get(a.userId) ?? {
      userId: a.userId,
      score: 0,
      bestTimeMs: Number.POSITIVE_INFINITY,
      correct: 0,
      total: 0,
      plays: 0,
    }
    // Bitta dars bo'yicha eng yaxshi ball hisobga olinadi
    if (opts.lessonId) agg.score = Math.max(agg.score, a.score)
    else agg.score += a.score

    agg.plays++
    agg.correct += a.correct
    agg.total += a.total
    if (a.correct === a.total && a.total > 0) agg.bestTimeMs = Math.min(agg.bestTimeMs, a.durationMs)
    byUser.set(a.userId, agg)
  }

  /**
   * Ro'yxatga barcha o'quvchilar kiradi — hali test o'ynamaganlar ham 0 ball
   * bilan pastda turadi. Ilgari faqat o'ynaganlar chiqardi, shuning uchun
   * yangi o'quvchi o'zini ro'yxatdan umuman topa olmasdi.
   */
  const users = await store.users.find({})
  const nameOf = new Map(
    users.map((u) => [u._id, [u.firstName, u.lastName].filter(Boolean).join(" ") || "O'quvchi"]),
  )
  const photoOf = new Map(users.map((u) => [u._id, u.photoUrl]))
  const usernameOf = new Map(users.map((u) => [u._id, u.username]))

  const known = new Set(users.map((u) => u._id))
  const all: Agg[] = users.map(
    (u) =>
      byUser.get(u._id) ?? {
        userId: u._id,
        score: 0,
        bestTimeMs: Number.POSITIVE_INFINITY,
        correct: 0,
        total: 0,
        plays: 0,
      },
  )
  // Hujjati o'chirilgan, lekin urinishlari qolgan o'quvchi ham tushib qolmasin.
  for (const [id, agg] of byUser) if (!known.has(id)) all.push(agg)

  // Infinity larni ayirsak NaN chiqadi va saralash buziladi — hech qachon
  // mukammal natija ko'rsatmaganlar ko'pchilik bo'lgani uchun bu muhim.
  const bestTime = (a: Agg) => (Number.isFinite(a.bestTimeMs) ? a.bestTimeMs : Number.MAX_SAFE_INTEGER)

  const rows: LeaderboardRow[] = all
    .sort(
      (a, b) =>
        b.score - a.score ||
        bestTime(a) - bestTime(b) ||
        b.plays - a.plays ||
        (nameOf.get(a.userId) ?? "").localeCompare(nameOf.get(b.userId) ?? ""),
    )
    .map((agg, i) => ({
      rank: i + 1,
      userId: agg.userId,
      name: nameOf.get(agg.userId) ?? "O'quvchi",
      username: usernameOf.get(agg.userId),
      photoUrl: photoOf.get(agg.userId),
      score: agg.score,
      accuracy: agg.total ? agg.correct / agg.total : 0,
      bestTimeMs: Number.isFinite(agg.bestTimeMs) ? agg.bestTimeMs : 0,
      plays: agg.plays,
      isMe: agg.userId === opts.meId,
    }))

  const answered = [...byUser.values()].reduce((s, a) => s + a.total, 0)
  const right = [...byUser.values()].reduce((s, a) => s + a.correct, 0)

  return {
    period: opts.period,
    lessonId: opts.lessonId,
    rows,
    me: rows.find((r) => r.isMe) ?? null,
    totals: {
      players: rows.length,
      plays: rows.reduce((s, r) => s + r.plays, 0),
      score: rows.reduce((s, r) => s + r.score, 0),
      accuracy: answered ? right / answered : 0,
    },
  }
}
