import type { PronunciationReport, WordJudgement, WordStatus } from "../../shared/types.js"
import { normalizeWord, stripStress, syllabify, stressedSyllableIndex, tokenize } from "../../shared/stress.js"
import { alignWords } from "./align.js"
import { env } from "./env.js"
import { mockReport } from "./mock.js"
import { analyzeReading, transcribe } from "./openai.js"
import { getStore } from "./db.js"
import { ANALYSIS_COST, assertWithinBudget, estimateSttCost, recordUsage } from "./usage.js"

export interface EvaluateInput {
  sentenceId: string
  /** Urg'u belgilari bilan kutilgan gap */
  sentenceRu: string
  sentenceUz: string
  file: File
  /** Brauzer o'lchagan yozuv uzunligi — STT davomiylik qaytarmasa ishlatiladi */
  clientDurationMs?: number
}

/** Ovoz yozuvini baholab, to'liq hisobot qaytaradi. */
export async function evaluateReading(input: EvaluateInput): Promise<PronunciationReport> {
  // Interfeysni sozlash rejimi — modelga umuman murojaat qilinmaydi.
  if (env.mockPronunciation) {
    await new Promise((r) => setTimeout(r, 900)) // yuklanish holatini ko'rish uchun
    return mockReport(input.sentenceId, input.sentenceRu)
  }

  const store = await getStore()
  const durationMs = input.clientDurationMs ?? 0
  await assertWithinBudget(store, estimateSttCost(durationMs) + ANALYSIS_COST)

  const stt = await transcribe(input.file)
  void recordUsage(store, { kind: "stt", costUsd: estimateSttCost(durationMs), durationMs })

  const expectedTokens = tokenize(input.sentenceRu)
  const heardTokens = tokenize(stt.text).map((t) => t.key)
  const expectedKeys = expectedTokens.map((t) => t.key)

  const ops = alignWords(expectedKeys, heardTokens)

  /* ---- mexanik hukm: obyektiv, modelsiz ---- */
  const words: WordJudgement[] = []
  let credit = 0
  let extras = 0

  for (const op of ops) {
    if (op.type === "ins") {
      extras++
      words.push({
        expected: "",
        heard: heardTokens[op.hyp!],
        status: "extra",
        syllables: [],
        correctSyllable: -1,
        hintUz: "Matnda yo'q so'z aytildi.",
      })
      continue
    }

    const token = expectedTokens[op.exp!]
    const status: WordStatus =
      op.type === "match" ? "ok" : op.type === "del" ? "missing" : "sound"

    if (op.type === "match") credit += 1
    else if (op.type === "sub") credit += op.similarity

    words.push({
      expected: token.word,
      heard: op.hyp !== null ? heardTokens[op.hyp] : null,
      status,
      syllables: syllabify(token.word),
      correctSyllable: stressedSyllableIndex(token.word),
    })
  }

  const expectedCount = expectedTokens.length || 1
  const extraPenalty = Math.min(0.25, extras * 0.05)
  const accuracy = Math.max(0, Math.min(1, credit / expectedCount - extraPenalty))

  const durationSec = stt.durationSec || durationMs / 1000
  const wpm = durationSec > 0 ? (heardTokens.length / durationSec) * 60 : 0

  /* ---- model tahlili: izoh va urg'u taxminlari ---- */
  const mechanical = words
    .filter((w) => w.status !== "ok")
    .map((w) => ({ expected: w.expected || "(ortiqcha)", heard: w.heard, status: w.status }))

  let summaryUz = ""
  let coachScript = ""
  let tips: string[] = []
  let degraded = false

  try {
    const analysis = await analyzeReading({
      expectedRu: input.sentenceRu,
      expectedUz: input.sentenceUz,
      transcript: stt.text,
      mechanical,
      accuracy,
      wpm,
    })

    void recordUsage(store, { kind: "analysis", costUsd: ANALYSIS_COST })

    summaryUz = analysis.summaryUz
    coachScript = analysis.coachScript
    tips = analysis.tips

    // Model aniqlagan xatolarni mexanik hukm ustiga qo'yamiz.
    for (const issue of analysis.issues) {
      const key = normalizeWord(issue.expected)
      const target = words.find((w) => normalizeWord(w.expected) === key)
      if (!target) continue
      target.hintUz = issue.hintUz
      // Modelga faqat "ok" ni "stress"ga o'zgartirishga ruxsat beramiz;
      // missing/extra mexanik jihatdan aniq, ularni bekor qilmaydi.
      if (target.status === "ok" && issue.status === "stress") target.status = "stress"
      else if (target.status === "sound" && issue.status === "stress") target.status = "stress"
    }
  } catch (err) {
    console.error("[pronunciation] model tahlili muvaffaqiyatsiz:", err)
    degraded = true
  }

  if (!summaryUz) summaryUz = fallbackSummary(accuracy, words)
  if (!coachScript) coachScript = fallbackCoachScript(words)
  if (!tips.length) tips = fallbackTips(words)

  return {
    sentenceId: input.sentenceId,
    transcript: stt.text,
    accuracy,
    wpm,
    durationMs: Math.round(durationSec * 1000),
    words,
    summaryUz,
    coachScript,
    tips,
    degraded,
  }
}

/* ------------------------------------------------- modelsiz zaxira matnlar */

function problemWords(words: WordJudgement[]): WordJudgement[] {
  return words.filter((w) => w.status !== "ok" && w.expected).slice(0, 3)
}

function fallbackSummary(accuracy: number, words: WordJudgement[]): string {
  const pct = Math.round(accuracy * 100)
  const bad = problemWords(words)
  if (!bad.length) return `Ajoyib! Gap ${pct}% aniqlik bilan o'qildi, barcha so'zlar tushunarli chiqdi.`
  const list = bad.map((w) => stripStress(w.expected)).join(", ")
  return `Aniqlik ${pct}%. Diqqat qiling: ${list}. Urg'uga e'tibor berib qayta o'qing.`
}

function fallbackCoachScript(words: WordJudgement[]): string {
  const bad = problemWords(words)
  if (!bad.length) return "Barakalla! Hammasi to'g'ri. Endi biroz tezroq o'qib ko'ring."

  // So'zlar butun holda aytiladi — bo'g'inlarga bo'lish nutqni sun'iy qiladi.
  const samples = bad.map((w) => `${stripStress(w.expected)}.`).join(" ")
  return `Mana bu so'zlarni takrorlang. ${samples} Endi butun gapni qaytadan o'qing.`
}

function fallbackTips(words: WordJudgement[]): string[] {
  const tips: string[] = []
  if (words.some((w) => w.status === "missing")) tips.push("Bir nechta so'z tushib qoldi — sekinroq o'qing.")
  if (words.some((w) => w.status === "extra")) tips.push("Ortiqcha so'z aytildi — matndan ko'zingizni uzmang.")
  if (!tips.length) tips.push("Urg'uli bo'g'inni qo'shni bo'g'inlardan uzunroq talaffuz qiling.")
  return tips
}
