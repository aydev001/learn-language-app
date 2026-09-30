import OpenAI from "openai"
import { env } from "../../server/lib/env.js"
import type { Lesson, ReadingSentence, VocabWord } from "../../shared/types.js"
import type { RawLesson } from "./parseLessons.js"
import { applyStress, buildStressDict, uncovered, wordsIn, type StressDict } from "./stressDict.js"

/**
 * Manba matnini ilova uchun to'ldiradi.
 *
 * Vazifalar ikkiga bo'lingan:
 *   1. Tarjima, misol gap, sarlavha — sifat modeli bajaradi (env.importModel).
 *      Arzon model ma'noni ag'darib yuborgan edi, shuning uchun bu yerda tejamaymiz.
 *   2. Urg'u — alohida, kuchliroq model so'z lug'atini tuzadi, belgilarni
 *      esa kod qo'yadi (`stressDict.ts`). Shu tufayli ruscha matn hech
 *      qachon o'zgarmaydi.
 */

const SENTENCE_BATCH = 8
const WORD_BATCH = 10

let client: OpenAI | null = null
function openai(): OpenAI {
  if (!env.openaiKey) throw new Error("OPENAI_API_KEY o'rnatilmagan")
  client ??= new OpenAI({ apiKey: env.openaiKey, maxRetries: 3, timeout: 120_000 })
  return client
}

async function ask<T>(system: string, user: string): Promise<T> {
  const completion = await openai().chat.completions.create({
    // Import sifat modeli: tarjimalar test javoblariga aylanadi,
    // xato tarjima o'quvchiga noto'g'ri narsa o'rgatadi.
    model: env.importModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  })
  return JSON.parse(completion.choices[0]?.message?.content ?? "{}") as T
}

/* -------------------------------------------------------------- tarjima */

async function translateSentences(sentences: string[]): Promise<string[]> {
  const out: string[] = []

  for (let i = 0; i < sentences.length; i += SENTENCE_BATCH) {
    const batch = sentences.slice(i, i + SENTENCE_BATCH)

    const result = await ask<{ items?: string[] }>(
      `Rus tilidagi gaplarni o'zbek tiliga tarjima qil.
Tabiiy, ravon o'zbekcha yoz — so'zma-so'z emas, ma'noga ko'ra.
Boshlang'ich darajadagi o'quvchi tushunadigan sodda til ishlat.

Javob FAQAT JSON: {"items":["tarjima 1","tarjima 2"]}
Kirish gaplari bilan BIR XIL sonda va tartibda bo'lsin.`,
      batch.map((s, n) => `${n + 1}. ${s}`).join("\n"),
    )

    const items = Array.isArray(result.items) ? result.items : []
    batch.forEach((_, n) => out.push(typeof items[n] === "string" ? items[n].trim() : ""))
  }

  return out
}

/* -------------------------------------------------------------- so'zlar */

interface WordDraft {
  ru: string
  uz: string
  pos?: string
  exampleRu?: string
  exampleUz?: string
}

async function draftWords(
  words: { ru: string; uz: string }[],
): Promise<WordDraft[]> {
  const out: WordDraft[] = []

  for (let i = 0; i < words.length; i += WORD_BATCH) {
    const batch = words.slice(i, i + WORD_BATCH)

    const result = await ask<{
      items?: { pos?: string; exampleRu?: string; exampleUz?: string }[]
    }>(
      `Senga ruscha so'zlar va o'zbekcha tarjimasi beriladi.
Har biri uchun:
1. So'z turkumi: "ot", "fe'l", "sifat", "ravish", "olmosh", "son", "son oldi".
2. Boshlang'ich daraja uchun QISQA misol gap (5-8 so'z), shu so'z ishlatilsin.
   Misolni o'zbekchaga ham tarjima qil.
Urg'u belgilari QO'YMA — ular keyin avtomatik qo'yiladi.

Javob FAQAT JSON:
{"items":[{"pos":"ot","exampleRu":"ruscha gap","exampleUz":"tarjimasi"}]}
Kirish so'zlari bilan BIR XIL sonda va tartibda bo'lsin.`,
      batch.map((w, n) => `${n + 1}. ${w.ru} — ${w.uz}`).join("\n"),
    )

    const items = Array.isArray(result.items) ? result.items : []

    batch.forEach((word, n) => {
      const item = items[n]
      out.push({
        ru: word.ru,
        uz: word.uz,
        pos: typeof item?.pos === "string" ? item.pos : undefined,
        exampleRu: typeof item?.exampleRu === "string" ? item.exampleRu.trim() : undefined,
        exampleUz: typeof item?.exampleUz === "string" ? item.exampleUz.trim() : undefined,
      })
    })
  }

  return out
}

/* ------------------------------------------------------------ sarlavha */

interface MetaOut {
  title: string
  titleUz: string
  topic: string
  level: Lesson["level"]
  introUz: string
}

async function buildMeta(lesson: RawLesson): Promise<MetaOut> {
  const excerpt = lesson.paragraphs
    .map((p) => p.text)
    .join(" ")
    .slice(0, 900)

  const result = await ask<Partial<MetaOut>>(
    `Sen rus tili darsligi muharririsan. Senga matn beriladi.
FAQAT JSON qaytar:
{
  "title": "ruscha qisqa sarlavha, 2-4 so'z, urg'u belgilarisiz",
  "titleUz": "o'zbekcha sarlavha",
  "topic": "mavzu, 1-2 o'zbekcha so'z (masalan: Kundalik hayot, Ertak, Xarid)",
  "level": "A1 yoki A2 yoki B1 yoki B2 — matn murakkabligiga qarab",
  "introUz": "o'quvchiga 1-2 jumlalik o'zbekcha ko'rsatma, matnni ovoz chiqarib o'qishga undaydi"
}`,
    lesson.title ? `Sarlavha: ${lesson.title}\n\nMatn: ${excerpt}` : `Matn: ${excerpt}`,
  )

  const levels: Lesson["level"][] = ["A1", "A2", "B1", "B2"]

  return {
    title: lesson.title || result.title?.trim() || `Текст ${lesson.number}`,
    titleUz: result.titleUz?.trim() || `${lesson.number}-dars`,
    topic: result.topic?.trim() || "Umumiy",
    level: levels.includes(result.level as Lesson["level"]) ? (result.level as Lesson["level"]) : "A2",
    introUz:
      result.introUz?.trim() ||
      "Matnni ovoz chiqarib o'qing. Urg'uga e'tibor bering — rus tilida u so'z ma'nosini o'zgartiradi.",
  }
}

/* -------------------------------------------------------------- asosiy */

const isoDay = (offsetDays = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/** Bir dars boshqasidan shuncha kun oldin berilgan deb hisoblanadi. */
const DAYS_BETWEEN_LESSONS = 7

export interface EnrichResult {
  lesson: Lesson
  dict: StressDict
  /** Lug'at qamramagan so'zlar — urg'usiz qolgan */
  uncovered: string[]
}

export interface EnrichHooks {
  onStep?: (label: string) => void
  onStressProgress?: (done: number, total: number) => void
}

export interface EnrichOptions {
  /**
   * Dars nechanchi hafta oldin berilgan.
   *
   * Fayldagi oxirgi dars — bugungi vazifa (0), undan oldingilari orqaga
   * suriladi. Aks holda hamma darsning sanasi bir xil bo'lib qoladi va
   * ilova qaysi biri joriy ekanini ayta olmaydi.
   */
  weeksAgo?: number
  hooks?: EnrichHooks
}

export async function enrichLesson(
  raw: RawLesson,
  { weeksAgo = 0, hooks = {} }: EnrichOptions = {},
): Promise<EnrichResult> {
  hooks.onStep?.("tarjima va misollar")

  const [meta, translations, drafts] = await Promise.all([
    buildMeta(raw),
    translateSentences(raw.sentences),
    draftWords(raw.words),
  ])

  /* --- urg'u lug'ati: barcha ruscha matndan --- */

  hooks.onStep?.("urg'u lug'ati")

  const vocabulary: string[] = []
  for (const s of raw.sentences) vocabulary.push(...wordsIn(s))
  for (const d of drafts) {
    vocabulary.push(...wordsIn(d.ru))
    if (d.exampleRu) vocabulary.push(...wordsIn(d.exampleRu))
  }

  const dict = await buildStressDict(vocabulary, hooks.onStressProgress)

  /* --- belgilarni kod qo'yadi --- */

  const sentences: ReadingSentence[] = raw.sentences.map((ru, i) => ({
    id: `s${i + 1}`,
    ru: applyStress(ru, dict),
    uz: translations[i] ?? "",
  }))

  const words: VocabWord[] = drafts.map((d, i) => ({
    id: `w${i + 1}`,
    ru: applyStress(d.ru, dict),
    uz: d.uz,
    pos: d.pos,
    example:
      d.exampleRu && d.exampleUz
        ? { ru: applyStress(d.exampleRu, dict), uz: d.exampleUz }
        : undefined,
  }))

  /* --- abzatslarni urg'uli gaplardan qayta yig'amiz --- */

  let cursor = 0
  const paragraphs = raw.paragraphs.map((p) => {
    const slice = sentences.slice(cursor, cursor + p.sentences.length)
    cursor += p.sentences.length
    return slice.length ? slice.map((s) => s.ru).join(" ") : applyStress(p.text, dict)
  })

  const lesson: Lesson = {
    id: `lesson-${String(raw.number).padStart(2, "0")}`,
    title: applyStress(meta.title, dict),
    titleUz: meta.titleUz,
    month: raw.month ?? 1,
    level: meta.level,
    topic: meta.topic,
    assignedAt: isoDay(-weeksAgo * DAYS_BETWEEN_LESSONS),
    // Manbadagi `DUE` qatori ustun — o'qituvchi muddatni o'zi belgilaganda
    // haftalik hisob ishlatilmaydi.
    dueAt: raw.due ?? isoDay((1 - weeksAgo) * DAYS_BETWEEN_LESSONS),
    reading: { introUz: meta.introUz, paragraphs, sentences },
    vocabulary: words,
  }

  const missing = new Set<string>()
  for (const s of sentences) for (const w of uncovered(s.ru, dict)) missing.add(w)
  for (const w of words) {
    for (const u of uncovered(w.ru, dict)) missing.add(u)
    if (w.example) for (const u of uncovered(w.example.ru, dict)) missing.add(u)
  }

  return { lesson, dict, uncovered: [...missing].sort() }
}
