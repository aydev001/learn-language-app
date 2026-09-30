/** Frontend va server o'rtasidagi umumiy shartnoma (API contract). */

/* ------------------------------------------------------------------ kontent */

export interface VocabWord {
  id: string
  /** Urg'u belgisi bilan: "молоко́" */
  ru: string
  uz: string
  /** So'z turkumi: "ot", "fe'l", "sifat" ... */
  pos?: string
  example?: { ru: string; uz: string }
}

export interface ReadingSentence {
  id: string
  /** Urg'u belgisi bilan yozilgan rus tilidagi gap */
  ru: string
  uz: string
}

export interface Lesson {
  id: string
  title: string
  titleUz: string
  /** O'quv oyi (1, 2, ...) — ro'yxatda darslar shu bo'yicha guruhlanadi */
  month: number
  level: "A1" | "A2" | "B1" | "B2"
  topic: string
  /** ISO sana — vazifa berilgan kun */
  assignedAt: string
  /** ISO sana — topshirish muddati */
  dueAt: string
  reading: {
    introUz: string
    /**
     * Abzatslar — to'liq matnni ketma-ket eshitish uchun.
     * Gaplar bilan bir xil matn, faqat boshqacha bo'laklangan.
     */
    paragraphs: string[]
    /** Urg'u mashqi uchun — barcha gaplar ketma-ket */
    sentences: ReadingSentence[]
  }
  vocabulary: VocabWord[]
}

/** Urg'u mashqi shuncha gapdan iborat bo'laklarga bo'linadi. */
export const CHUNK_SIZE = 8

export interface ReadingChunk {
  index: number
  sentences: ReadingSentence[]
  /** Nechta gap o'qib bo'lingan */
  done: number
}

/** Gaplarni bo'laklarga ajratadi. Frontend ham, server ham shuni ishlatadi. */
export function chunkSentences(
  sentences: ReadingSentence[],
  doneIds: Iterable<string> = [],
): ReadingChunk[] {
  const done = new Set(doneIds)
  const chunks: ReadingChunk[] = []

  for (let i = 0; i < sentences.length; i += CHUNK_SIZE) {
    const slice = sentences.slice(i, i + CHUNK_SIZE)
    chunks.push({
      index: chunks.length,
      sentences: slice,
      done: slice.filter((s) => done.has(s.id)).length,
    })
  }

  return chunks
}

export interface LessonSummary {
  id: string
  title: string
  titleUz: string
  month: number
  level: Lesson["level"]
  topic: string
  assignedAt: string
  dueAt: string
  sentenceCount: number
  wordCount: number
  progress: LessonProgress
}

/* ----------------------------------------------------------------- progress */

export interface LessonProgress {
  /** O'qib chiqilgan gaplar id'lari */
  sentencesDone: string[]
  /** Gap bo'yicha eng yaxshi aniqlik (0..1) */
  bestAccuracy: Record<string, number>
  /** Sprint o'ynalgan bo'lsa — eng yaxshi ball */
  vocabBestScore: number
  vocabPlays: number
  /** 0..1 — umumiy bajarilish */
  completion: number
}

/* --------------------------------------------------------------------- user */

export interface Me {
  id: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  isAdmin: boolean
  stats: UserStats
}

export interface UserStats {
  totalScore: number
  sprintsPlayed: number
  readingsDone: number
  wordsMastered: number
  bestAccuracy: number
  /** Ketma-ket kunlar */
  streak: number
}

/* ---------------------------------------------------------------- o'qish/TTS */

export type WordStatus = "ok" | "stress" | "sound" | "missing" | "extra"

export interface WordJudgement {
  /** Kutilgan so'z, urg'u belgisi bilan */
  expected: string
  /** Whisper eshitgan so'z (bo'lmasa null) */
  heard: string | null
  status: WordStatus
  /** O'zbekcha qisqa izoh — faqat xato so'zlarda */
  hintUz?: string
  /** Bo'g'inlar — urg'u mashqi uchun */
  syllables: string[]
  /** To'g'ri urg'uli bo'g'in indeksi (-1 = noma'lum) */
  correctSyllable: number
}

export interface PronunciationReport {
  sentenceId: string
  /** Whisper qaytargan matn */
  transcript: string
  /** 0..1 — so'z darajasidagi aniqlik */
  accuracy: number
  /** Daqiqasiga so'z */
  wpm: number
  durationMs: number
  words: WordJudgement[]
  /** Ekranda ko'rinadigan o'zbekcha xulosa */
  summaryUz: string
  /** Ovoz bilan aytiladigan matn (o'zbekcha izoh + ruscha namunalar) */
  coachScript: string
  tips: string[]
  /** Model tahlili o'chirilgan bo'lsa (kalit yo'q) — faqat mexanik solishtiruv */
  degraded: boolean
}

/* ----------------------------------------------------------------- lug'at */

export type VocabMode = "cards" | "sprint" | "sentence"

export interface WordResult {
  wordId: string
  correct: boolean
  ms: number
}

export interface VocabAttemptInput {
  lessonId: string
  mode: VocabMode
  correct: number
  total: number
  durationMs: number
  wordResults: WordResult[]
}

export interface VocabAttemptResult {
  score: number
  personalBest: boolean
  previousBest: number
  rank: number
  totalPlayers: number
}

/* ------------------------------------------------------------- reyting */

export type LeaderboardPeriod = "week" | "all"

export interface LeaderboardRow {
  rank: number
  userId: number
  name: string
  /** Telegram username, @ belgisisiz. Foydalanuvchi qo'ymagan bo'lishi mumkin. */
  username?: string
  photoUrl?: string
  score: number
  accuracy: number
  bestTimeMs: number
  plays: number
  isMe: boolean
}

/** Reyting ustidagi umumiy ko'rsatkichlar. */
export interface LeaderboardTotals {
  /** Ro'yxatdagi o'quvchilar — hali o'ynamaganlar ham sanaladi */
  players: number
  /** Jami o'ynalgan testlar */
  plays: number
  /** Jami to'plangan ball */
  score: number
  /** O'rtacha aniqlik, 0..1 */
  accuracy: number
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod
  lessonId: string | null
  rows: LeaderboardRow[]
  me: LeaderboardRow | null
  totals: LeaderboardTotals
}

/* ------------------------------------------------------------------- xato */

export interface ApiError {
  error: string
  message: string
}

/* ------------------------------------------------------------------- kino uyi
 *
 * "Uy" (room) — do'stlar birga kino ko'radigan yopiq xona. Video YouTube'da
 * qoladi, bizda faqat uning id'si va o'ynash holati saqlanadi.
 */

export type RoomMemberStatus = "pending" | "approved" | "blocked"

/**
 * Uyning ko'rinishi.
 *
 * `public` — uy «Ochiq uylar» ro'yxatida hammaga ko'rinadi va kodni
 * bilmagan odam ham kirish so'rovini yubora oladi. `private` — uy hech
 * qayerda ko'rinmaydi, unga faqat taklif havolasi (ya'ni kod) orqali
 * boriladi.
 *
 * Ikkala holatda ham ichkariga kirish uchun uy egasining ruxsati kerak:
 * ko'rinish faqat «kim so'rov yubora oladi»ni hal qiladi, «kim kiradi»ni
 * emas.
 */
export type RoomVisibility = "public" | "private"

/** Foydalanuvchining shu uyga munosabati. */
export type RoomAccess =
  /** hali so'rov yubormagan */
  | "none"
  /** so'rov yuborilgan, uy egasi tasdiqlamagan */
  | "pending"
  /** uy egasi rad etgan */
  | "blocked"
  /** to'liq a'zo (uy egasining o'zi ham) */
  | "member"

export interface RoomMemberView {
  userId: number
  name: string
  username?: string
  photoUrl?: string
  role: "owner" | "guest"
  status: RoomMemberStatus
  /** Oxirgi 20 soniyada sync so'ragan bo'lsa — hozir uyda */
  online: boolean
  /** Ovozli suhbatga qo'shilgan (mikrofoni yoqilgan) */
  voice: boolean
  /** Ovozli suhbatda, lekin mikrofonini vaqtincha o'chirgan */
  voiceMuted: boolean
  requestedAt: number
}

/**
 * Videoning umumiy holati.
 *
 * `positionSec` — `stateAt` lahzasidagi joylashuv. Hozirgi joyni mijoz o'zi
 * hisoblaydi: o'ynayotgan bo'lsa `positionSec + (hozir - stateAt)`. Shuning
 * uchun server har javobda o'z soatini (`serverNow`) ham yuboradi.
 */
export interface RoomStateView {
  videoId: string
  title: string
  isPlaying: boolean
  positionSec: number
  /** server vaqti, ms */
  stateAt: number
  /** oxirgi marta kim o'zgartirdi */
  stateBy: number
  stateByName: string
  /** true — faqat uy egasi boshqara oladi */
  controlLocked: boolean
}

export interface RoomMessageView {
  id: string
  userId: number
  name: string
  text: string
  at: number
  /** "system" — ilova o'zi yozgan xabar (kim qo'shildi, video almashdi...) */
  kind: "text" | "system"
}

/** Uylar ro'yxatidagi bitta qator. */
export interface RoomSummary {
  code: string
  title: string
  videoId: string
  ownerId: number
  ownerName: string
  isOwner: boolean
  visibility: RoomVisibility
  status: RoomMemberStatus
  memberCount: number
  onlineCount: number
  /** faqat uy egasiga: kutib turgan so'rovlar soni */
  pendingCount: number
  isPlaying: boolean
  updatedAt: number
}


/**
 * «Ochiq uylar» ro'yxatidagi qator.
 *
 * Bu ro'yxatni hali a'zo bo'lmagan odam ko'radi, shuning uchun unda uy
 * ichidagi hech narsa yo'q — faqat kino, egasi va nechta odam borligi.
 */
export interface PublicRoomSummary {
  code: string
  title: string
  videoId: string
  ownerId: number
  ownerName: string
  ownerPhotoUrl?: string
  memberCount: number
  onlineCount: number
  isPlaying: boolean
  updatedAt: number
}
/* ------------------------------------------------------- ovozli suhbat
 *
 * Ovoz serverdan o'tmaydi: brauzerlar bir-biriga to'g'ridan-to'g'ri
 * ulanadi (WebRTC). Serverning ishi — tanishtirish uchun ikki xat
 * ("men shunday ulanaman") almashtirish. Ular ham xuddi chat kabi
 * `sync` javobida keladi, ya'ni yangi ulanish turi kerak emas.
 */

/**
 * Signal turi.
 *
 * `offer` va `answer` — ulanish taklifi va javobi (SDP). `bye` — «men
 * chiqdim, ulanishni yoping». Nomzodlar (ICE) alohida yuborilmaydi:
 * ular yig'ilib bo'lgach SDP ichida bir yo'la ketadi — polling'da har
 * bir nomzodni alohida yuborish sekin bo'lardi.
 */
export type RoomSignalKind = "offer" | "answer" | "bye"

export interface RoomSignalView {
  id: string
  from: number
  fromName: string
  kind: RoomSignalKind
  /** SDP (JSON satr). `bye` da bo'sh. */
  payload: string
  at: number
}

/** Brauzer NAT ortidan o'zini topishi uchun kerak bo'ladigan serverlar. */
export interface IceConfig {
  iceServers: { urls: string | string[]; username?: string; credential?: string }[]
}

/** Uy ichidagi polling javobi — bir so'rovda hamma narsa keladi. */
export interface RoomSync {
  code: string
  title: string
  videoId: string
  ownerId: number
  ownerName: string
  isOwner: boolean
  visibility: RoomVisibility
  access: RoomAccess
  closed: boolean
  /** server soati (ms) — mijoz o'z soati bilan farqni shundan topadi */
  serverNow: number

  /* quyidagilar faqat access === "member" bo'lganda keladi */
  state?: RoomStateView
  members?: RoomMemberView[]
  /** faqat uy egasiga */
  pending?: RoomMemberView[]
  /** bloklanganlar — faqat uy egasiga */
  blocked?: RoomMemberView[]
  /** so'ralgan lahzadan keyingi yangi xabarlar */
  messages?: RoomMessageView[]
  /** menga atalgan, hali o'qilmagan ovozli suhbat signallari */
  signals?: RoomSignalView[]
  /** do'stga yuboriladigan taklif havolasi */
  inviteUrl?: string
}

export type RoomMemberAction = "approve" | "reject" | "kick" | "block" | "unblock"
