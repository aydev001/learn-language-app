import type { VocabMode, WordResult } from "./types.js"

/**
 * Ball hisoblash. Frontend o'yin davomida jonli ball ko'rsatadi,
 * server esa yakuniy ballni QAYTA hisoblaydi — mijozga ishonmaymiz.
 */

/** Har bir savolga beriladigan vaqt (soniya). */
export const QUESTION_SECONDS: Record<VocabMode, number> = {
  cards: 0,
  /** So'z tarjimasi — qisqa savol, tez javob */
  sprint: 10,
  /** Gap tarjimasi — o'qish uchun ko'proq vaqt kerak */
  sentence: 20,
}

export const questionLimitMs = (mode: VocabMode) => QUESTION_SECONDS[mode] * 1000

export const BASE_POINTS = 100
export const MAX_SPEED_BONUS = 60
export const PERFECT_BONUS = 200

/**
 * Tezlik bonusi vaqt chegarasining shuncha qismida tugaydi.
 *
 * Chegaraga bog'lab qo'yildi: gap tarjimasida 20 soniya beriladi, agar
 * bonus qat'iy 6 soniyada tugasa hech kim ololmasdi. Endi ikkala rejimda
 * ham "tez javob berdim" degani bir xil ma'noni bildiradi.
 */
export const SPEED_BONUS_FRACTION = 0.6

export function wordPoints(result: WordResult, mode: VocabMode): number {
  if (!result.correct) return 0

  const cutoff = questionLimitMs(mode) * SPEED_BONUS_FRACTION
  const bonus = cutoff > 0 ? Math.round(MAX_SPEED_BONUS * Math.max(0, 1 - result.ms / cutoff)) : 0

  return BASE_POINTS + bonus
}

export function attemptScore(results: WordResult[], mode: VocabMode): number {
  const base = results.reduce((sum, r) => sum + wordPoints(r, mode), 0)
  const perfect = results.length > 0 && results.every((r) => r.correct)
  return base + (perfect ? PERFECT_BONUS : 0)
}

/** Shu ko'p savolli mashqda nazariy maksimal ball — foizni ko'rsatish uchun. */
export function maxScore(questionCount: number): number {
  return questionCount * (BASE_POINTS + MAX_SPEED_BONUS) + PERFECT_BONUS
}
