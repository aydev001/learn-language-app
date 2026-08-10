import OpenAI from "openai"
import { env, hasOpenAI } from "./env"

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!hasOpenAI()) throw new Error("OPENAI_API_KEY o'rnatilmagan")
  client ??= new OpenAI({ apiKey: env.openaiKey, maxRetries: 2, timeout: 60_000 })
  return client
}

/* ----------------------------------------------------------------- STT */

export interface Transcription {
  text: string
  /** Model qaytargan davomiylik; qo'llab-quvvatlanmasa 0 */
  durationSec: number
}

/**
 * Nutqni matnga aylantiradi.
 *
 * `gpt-4o-mini-transcribe` — whisper-1 dan ikki barobar arzon ($0.003 va
 * $0.006 daqiqasiga) va aniqroq. So'z-vaqt belgilari yo'q, lekin ular bizga
 * kerak emas: yozuv uzunligini brauzerdan olamiz.
 */
export async function transcribe(file: File): Promise<Transcription> {
  const model = env.sttModel
  const verbose = model.startsWith("whisper")

  const result = (await getClient().audio.transcriptions.create({
    file,
    model,
    language: "ru",
    // verbose_json faqat whisper-1 da bor; yangi modellar json qaytaradi.
    response_format: verbose ? "verbose_json" : "json",
    // Modelga urg'u belgili yozuvni kutmasligini aytamiz — u oddiy imloda qaytarsin
    prompt: "Разборчивая русская речь ученика, читающего текст вслух.",
  } as Parameters<OpenAI["audio"]["transcriptions"]["create"]>[0])) as unknown as {
    text?: string
    duration?: number
  }

  return {
    text: result.text ?? "",
    durationSec: result.duration ?? 0,
  }
}

/* -------------------------------------------------------------- tahlil */

export interface AnalysisIssue {
  expected: string
  status: "stress" | "sound" | "missing" | "extra"
  hintUz: string
}

export interface Analysis {
  summaryUz: string
  coachScript: string
  tips: string[]
  issues: AnalysisIssue[]
}

export interface AnalysisInput {
  /** Urg'u belgilari bilan kutilgan gap */
  expectedRu: string
  /** O'zbekcha tarjimasi — kontekst uchun */
  expectedUz: string
  transcript: string
  /** Mexanik solishtiruv natijasi */
  mechanical: { expected: string; heard: string | null; status: string }[]
  accuracy: number
  wpm: number
}

const SYSTEM = `Sen — o'zbek tilida so'zlashuvchi boshlang'ich darajadagi o'quvchiga rus tilini o'rgatuvchi tajribali repetitorsan.
O'quvchi rus tilidagi gapni ovoz chiqarib o'qidi. Senga beriladi:
 - kutilgan gap (urg'u belgilari bilan),
 - nutqni matnga aylantirish (STT) natijasi,
 - so'zma-so'z avtomatik solishtiruv.

VAZIFA: xatolarni aniqlab, o'zbek tilida qisqa va rag'batlantiruvchi tahlil ber.

MUHIM CHEKLOV — halol bo'l:
 - STT natijasi urg'uni ko'rsatmaydi. Urg'u xatosi haqida FAQAT bilvosita dalil bo'lganda yoz:
   masalan so'z boshqa so'zga aylanib eshitilgan yoki unli tovush reduksiyasi tufayli imlo o'zgargan.
 - Dalil bo'lmasa, "stress" statusini o'ylab topma. Shubhali so'zni oddiygina mashq uchun tavsiya qil.
 - Bir so'z butunlay boshqacha eshitilgan bo'lsa — "sound".

JAVOB FORMATI: faqat JSON obyekt, boshqa hech narsa:
{
  "summaryUz": "1-2 jumla, ekranda ko'rinadi. Avval maqtov, keyin asosiy xato.",
  "coachScript": "TTS ovoz bilan o'qiladigan matn. O'zbekcha izoh + ruscha namuna so'zlar ruscha yozuvda. 45 so'zdan oshmasin. MUHIM: ruscha so'zlarni butun holda yoz (молоко), bo'g'inlarga ajratma va tire qo'yma — ular tabiiy tezlikda o'qiladi.",
  "tips": ["qisqa maslahat", "yana bittasi"],
  "issues": [
    { "expected": "kutilgan so'z urg'u bilan", "status": "stress|sound|missing|extra", "hintUz": "nima noto'g'ri va qanday aytish kerak — bir jumla" }
  ]
}
"issues" ichida eng muhim 4 tagacha so'z bo'lsin. Xato bo'lmasa — bo'sh massiv.`

export async function analyzeReading(input: AnalysisInput): Promise<Analysis> {
  const userMessage = [
    `Kutilgan gap (urg'u bilan): ${input.expectedRu}`,
    `O'zbekcha ma'nosi: ${input.expectedUz}`,
    `STT eshitgani: ${input.transcript || "(bo'sh)"}`,
    `Aniqlik: ${Math.round(input.accuracy * 100)}%`,
    `Tezlik: ${Math.round(input.wpm)} so'z/daqiqa`,
    "",
    "So'zma-so'z solishtiruv:",
    ...input.mechanical.map(
      (m) => `  ${m.expected} → ${m.heard ?? "(eshitilmadi)"} [${m.status}]`,
    ),
  ].join("\n")

  const completion = await getClient().chat.completions.create({
    model: env.chatModel,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userMessage },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? "{}"
  return normalizeAnalysis(JSON.parse(raw) as Partial<Analysis>)
}

function normalizeAnalysis(parsed: Partial<Analysis>): Analysis {
  const allowed = new Set(["stress", "sound", "missing", "extra"])
  return {
    summaryUz: typeof parsed.summaryUz === "string" ? parsed.summaryUz : "",
    coachScript: typeof parsed.coachScript === "string" ? parsed.coachScript : "",
    tips: Array.isArray(parsed.tips) ? parsed.tips.filter((t) => typeof t === "string").slice(0, 4) : [],
    issues: Array.isArray(parsed.issues)
      ? parsed.issues
          .filter(
            (i): i is AnalysisIssue =>
              !!i && typeof i.expected === "string" && allowed.has(i.status as string),
          )
          .slice(0, 4)
      : [],
  }
}

export { hasOpenAI }
