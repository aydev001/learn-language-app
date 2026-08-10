import OpenAI from "openai"
import { env } from "../../server/lib/env.js"
import { countVowels, graphemes, isStressedGrapheme, stripStress } from "../../shared/stress.js"

/**
 * Urg'u lug'ati.
 *
 * Nega gap emas, so'z darajasida:
 *   - Butun gapga urg'u qo'yishni so'raganda model matnni qayta yozib
 *     yuboradi yoki ba'zi so'zlarni tashlab ketadi.
 *   - So'z darajasida vazifa oddiy va tekshirish ham oson.
 *   - Bir xil so'z matnda necha marta uchrasa ham bir marta so'raladi.
 *
 * Model faqat lug'at tuzadi; belgilarni matnga **kod** qo'yadi. Shu tufayli
 * matn hech qachon o'zgarmaydi va bironta so'z e'tibordan chetda qolmaydi.
 *
 * Model tanlovi muhim: sinovda gpt-4.1-mini 18 ta qiyin so'zdan 10 tasini
 * to'g'ri topdi, gpt-4.1 esa 18/18. Shuning uchun bu yerda kuchliroq model
 * ishlatiladi — import bir martalik, narxi arzimas.
 */

const BATCH = 40

let client: OpenAI | null = null
function openai(): OpenAI {
  if (!env.openaiKey) throw new Error("OPENAI_API_KEY o'rnatilmagan")
  client ??= new OpenAI({ apiKey: env.openaiKey, maxRetries: 3, timeout: 120_000 })
  return client
}

const SYSTEM = `Sen rus tili fonetikasi bo'yicha mutaxassissan.
Har bir ruscha so'zga urg'u belgisini qo'y: Unicode U+0301 (combining acute),
urg'uli unlidan KEYIN.

Qoidalar:
- Harflarni o'zgartirma, faqat belgi qo'sh. "она" -> "она́"
- Bir bo'g'inli so'zga belgi qo'yma: "дом", "час", "кто"
- «ё» har doim urg'uli — unga belgi qo'yilmaydi: "ребёнок", "пойдёт"
- So'z shaklini saqla: berilgan shaklda qanday bo'lsa, shundayligicha
  qaytar (masalan "дискотеку" -> "дискоте́ку", boshlang'ich shaklga o'tkazma)

Javob FAQAT JSON:
{"items":[{"in":"kirish so'zi","out":"urg'u belgisi bilan"}]}
Kirishdagi har bir so'z uchun bitta element bo'lsin.`

export type StressDict = Map<string, string>

/**
 * Model urg'uni ba'zan tayyor "aksentli" harf bilan yozadi: kirill «а» +
 * U+0301 o'rniga lotin «á» (U+00E1). Ko'zga bir xil ko'rinadi, lekin bu
 * boshqa harf — so'z buziladi.
 *
 * Shubhali harflarni kirill varianti + urg'u belgisiga almashtiramiz, so'ng
 * natija asl so'zga mos kelishini tekshiramiz. Mos kelmasa — rad etamiz,
 * ya'ni taxmin xato bo'lsa hech narsa buzilmaydi.
 */
const PRECOMPOSED: Record<string, string> = {
  "á": "а", // á
  "Á": "А",
  "é": "е", // é
  "É": "Е",
  "í": "и", // í
  "Í": "И",
  "ó": "о", // ó
  "Ó": "О",
  "ú": "у", // ú
  "Ú": "У",
  "ý": "ы", // ý
  "Ý": "Ы",
}

const STRESS_MARK = "́"

/** Model javobini tozalaydi; asl so'zga mos kelmasa `null`. */
function repairMarked(marked: string, key: string): string | null {
  const candidates = [
    marked,
    // Tayyor aksentli harflarni kirill + belgiga yoyamiz
    [...marked].map((ch) => (PRECOMPOSED[ch] ? PRECOMPOSED[ch] + STRESS_MARK : ch)).join(""),
  ]

  for (const candidate of candidates) {
    if (dictKey(candidate) !== key) continue
    if (!graphemes(candidate).some(isStressedGrapheme)) continue
    return candidate
  }
  return null
}

/** Lug'at kaliti: kichik harflar, urg'usiz, «ё» saqlanadi. */
export const dictKey = (word: string) => stripStress(word).toLowerCase()

/** Urg'u kerakmi? Bir bo'g'inli va «ё» li so'zlarga kerak emas. */
export function needsStress(word: string): boolean {
  if (countVowels(word) < 2) return false
  return !graphemes(word).some(isStressedGrapheme)
}

/**
 * Matndagi ruscha so'zlarni ajratib oladi.
 *
 * Defis bilan yozilganlar ("кто-то", "давно-давно") ikki so'zga bo'linadi —
 * rus tilida ularning har bir qismi o'z urg'usiga ega bo'lishi mumkin va
 * `applyStress` ham xuddi shunday bo'ladi. Ikki joyda bir xil qoida.
 */
export function wordsIn(text: string): string[] {
  return text.match(/[\p{L}̀-ͯ]+/gu) ?? []
}

/**
 * Berilgan so'zlar uchun urg'u lug'atini tuzadi.
 * `onProgress` — har bo'lakdan keyin chaqiriladi.
 */
export async function buildStressDict(
  words: Iterable<string>,
  onProgress?: (done: number, total: number) => void,
): Promise<StressDict> {
  // Takrorlanmaydigan, urg'u kerak bo'ladiganlari
  const unique = [...new Set([...words].map(dictKey))]
    .filter((w) => w.length > 1 && needsStress(w))
    .sort()

  const dict: StressDict = new Map()

  await fillBatches(unique, dict, BATCH, onProgress)

  /**
   * Model ba'zan javobga hamma so'zni qo'shmaydi (uzun ro'yxatda bittasini
   * tashlab ketadi). Qolganlarini kichikroq bo'laklarda qayta so'raymiz —
   * odatda ikkinchi urinishda hammasi to'ladi.
   */
  for (let round = 0; round < 2; round++) {
    const missing = unique.filter((w) => !dict.has(w))
    if (!missing.length) break
    await fillBatches(missing, dict, 10)
  }

  return dict
}

async function fillBatches(
  words: string[],
  dict: StressDict,
  batchSize: number,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)

    const completion = await openai().chat.completions.create({
      model: env.importModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: batch.map((w, n) => `${n + 1}. ${w}`).join("\n") },
      ],
    })

    const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
      items?: { in?: string; out?: string }[]
    }

    for (const item of parsed.items ?? []) {
      if (typeof item?.in !== "string" || typeof item?.out !== "string") continue

      const key = dictKey(item.in)
      const marked = repairMarked(item.out.trim(), key)
      if (marked) dict.set(key, marked)
    }

    onProgress?.(Math.min(i + batchSize, words.length), words.length)
  }
}

/* --------------------------------------------------------------- qo'llash */

/** Urg'uli unlining grafema indeksi. */
function stressedIndex(marked: string): number {
  return graphemes(marked).findIndex((g) => g.includes("́"))
}

/**
 * Lug'atdagi urg'uni so'zga ko'chiradi, asl harf registrini saqlaydi.
 * "Она" + "она́" -> "Она́"
 */
function applyToWord(word: string, marked: string): string {
  const index = stressedIndex(marked)
  if (index < 0) return word

  const parts = graphemes(word)
  if (index >= parts.length) return word

  parts[index] = parts[index] + "́"
  return parts.join("")
}

/** Matndagi barcha so'zlarga lug'atdan urg'u qo'yadi. */
export function applyStress(text: string, dict: StressDict): string {
  return text.replace(/[\p{L}̀-ͯ]+/gu, (word) => {
    if (!needsStress(word)) return word
    const marked = dict.get(dictKey(word))
    return marked ? applyToWord(word, marked) : word
  })
}

/** Lug'at qamrab olmagan so'zlar — hisobot uchun. */
export function uncovered(text: string, dict: StressDict): string[] {
  return wordsIn(text).filter((w) => needsStress(w) && !dict.has(dictKey(w)))
}
