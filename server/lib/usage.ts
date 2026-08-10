import type { Store } from "./db"
import { env } from "./env"

/**
 * Sarf hisobi va byudjet chegarasi.
 *
 * Maqsad — balansni tasodifan tugatib qo'ymaslik. Kesh'dan chiqqan audio
 * bu yerga umuman kelmaydi: u tekin, demak byudjetga ta'sir qilmaydi.
 *
 * Raqamlar taxminiy: OpenAI aniq token sonini har javobda qaytarmaydi,
 * shuning uchun matn uzunligidan hisoblaymiz. Xato ±20% atrofida bo'ladi —
 * chegara uchun bu yetarli.
 */

/* ------------------------------------------------------------- narx modeli */

/** Rus nutqi normal tezlikda taxminan shuncha belgi/soniya */
const CHARS_PER_SECOND = 14

const PRICE = {
  /** OpenAI TTS — audio daqiqasiga */
  openaiTtsPerMinute: 0.015,
  /** Google Wavenet/Standard — 1M belgiga */
  googleWavenetPerMillion: 4,
  /** Google Neural2 — 1M belgiga */
  googleNeural2PerMillion: 16,
  /** Google Chirp3-HD — 1M belgiga */
  googleChirpPerMillion: 30,
  /** gpt-4o-mini-transcribe — daqiqasiga */
  sttPerMinute: 0.003,
  /** Bitta tahlil chaqiruvi (≈450 kirish + 250 chiqish token) */
  analysisPerCall: 0.0006,
} as const

export function estimateTtsCost(text: string): number {
  const chars = text.length

  if (env.ttsProvider === "google") {
    const voice = env.googleTtsVoice
    const perMillion = /chirp/i.test(voice)
      ? PRICE.googleChirpPerMillion
      : /neural2/i.test(voice)
        ? PRICE.googleNeural2PerMillion
        : PRICE.googleWavenetPerMillion
    return (chars / 1_000_000) * perMillion
  }

  // OpenAI — audio davomiyligi bo'yicha.
  return (chars / CHARS_PER_SECOND / 60) * PRICE.openaiTtsPerMinute
}

export function estimateSttCost(durationMs: number): number {
  return (durationMs / 60_000) * PRICE.sttPerMinute
}

export const ANALYSIS_COST = PRICE.analysisPerCall

/* ----------------------------------------------------------------- hisob */

export interface UsageDoc {
  /** "2026-08" */
  _id: string
  ttsChars: number
  ttsCalls: number
  sttMs: number
  sttCalls: number
  analysisCalls: number
  costUsd: number
  updatedAt: string
}

const currentMonth = () => new Date().toISOString().slice(0, 7)

export type UsageKind = "tts" | "stt" | "analysis"

export interface UsageEvent {
  kind: UsageKind
  costUsd: number
  chars?: number
  durationMs?: number
}

/** Sarfni yozib qo'yadi. Xato bo'lsa ham asosiy oqimni to'xtatmaydi. */
export async function recordUsage(store: Store, event: UsageEvent): Promise<void> {
  const inc: Record<string, number> = { costUsd: event.costUsd }

  if (event.kind === "tts") {
    inc.ttsCalls = 1
    inc.ttsChars = event.chars ?? 0
  } else if (event.kind === "stt") {
    inc.sttCalls = 1
    inc.sttMs = event.durationMs ?? 0
  } else {
    inc.analysisCalls = 1
  }

  try {
    await store.usage.upsert(currentMonth(), {
      set: { updatedAt: new Date().toISOString() },
      inc: inc as Partial<Record<keyof UsageDoc, number>>,
    })
  } catch (err) {
    console.error("[usage] yozib bo'lmadi:", err)
  }
}

export async function monthUsage(store: Store): Promise<UsageDoc> {
  const doc = await store.usage.findOne({ _id: currentMonth() }).catch(() => null)

  // Hujjatda faqat ishlatilgan hisoblagichlar bo'ladi ($inc mavjud
  // maydonlarnigina yaratadi) — qolganlarini nol bilan to'ldiramiz.
  return {
    _id: currentMonth(),
    ttsChars: 0,
    ttsCalls: 0,
    sttMs: 0,
    sttCalls: 0,
    analysisCalls: 0,
    costUsd: 0,
    updatedAt: new Date().toISOString(),
    ...doc,
  }
}

/* -------------------------------------------------------------- chegara */

export class BudgetExceededError extends Error {
  readonly code = "budget_exceeded"
  readonly spent: number
  readonly limit: number

  constructor(spent: number, limit: number) {
    super(
      `Oylik byudjet tugadi: $${spent.toFixed(2)} / $${limit.toFixed(2)}. ` +
        `MONTHLY_BUDGET_USD ni oshiring yoki keyingi oyni kuting.`,
    )
    this.name = "BudgetExceededError"
    this.spent = spent
    this.limit = limit
  }
}

/**
 * Yangi sarfdan oldin chegarani tekshiradi.
 * Kesh'dan chiqadigan javoblar bu yerga kelmasligi kerak — ular tekin.
 */
export async function assertWithinBudget(store: Store, upcomingCost: number): Promise<void> {
  const limit = env.monthlyBudgetUsd
  if (limit <= 0) return // 0 yoki manfiy — chegara o'chirilgan

  const { costUsd } = await monthUsage(store)
  if (costUsd + upcomingCost > limit) {
    throw new BudgetExceededError(costUsd, limit)
  }
}
