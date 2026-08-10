/**
 * Rus tilidagi urg'u (ударение) va bo'g'in bilan ishlash utilitalari.
 *
 * Kontentda urg'u U+0301 (combining acute accent) belgisi bilan yoziladi:
 *   "молоко́"  ->  о + U+0301
 * Shu tufayli dars matnini oddiy qilib yozish mumkin, qolganini kod hisoblaydi.
 *
 * Bu fayl toza (pure) — hech qanday DOM/Node API'siga bog'liq emas,
 * shuning uchun frontend ham, server ham bir xil natijani oladi.
 */

export const STRESS_MARK = "́"

const VOWELS = "аеёиоуыэюя"
const SONORANTS = "рлмнй"
const SOFT_SIGNS = "ьъ"

/** Combining diacritic'larni (U+0300–U+036F) bazaviy harfga biriktirib bo'ladi. */
const COMBINING = /[̀-ͯ]/

/** Urg'u belgisini olib tashlaydi: "молоко́" -> "молоко" */
export function stripStress(text: string): string {
  return text.replace(/[̀-ͯ]/g, "")
}

export function hasStress(text: string): boolean {
  return text.includes(STRESS_MARK)
}

/**
 * Urg'u haqidagi barcha ishorani yashiradi: belgi olib tashlanadi va
 * «ё» → «е» ga aylanadi (rus matnlarida odatda shunday yoziladi).
 *
 * Urg'u mashqida shu ko'rinish beriladi — aks holda «ё» javobni oshkor qiladi.
 */
export function hideStress(text: string): string {
  return stripStress(text).replace(/ё/g, "е").replace(/Ё/g, "Е")
}

export function isVowel(ch: string): boolean {
  return VOWELS.includes(stripStress(ch).toLowerCase())
}

/**
 * Harfni o'ziga tegishli diakritikalar bilan bitta "grafema" qilib guruhlaydi.
 * "мо́ре" -> ["м", "о́", "р", "е"]
 */
export function graphemes(word: string): string[] {
  const out: string[] = []
  for (const ch of word) {
    if (COMBINING.test(ch) && out.length > 0) out[out.length - 1] += ch
    else out.push(ch)
  }
  return out
}

/**
 * So'zni bo'g'inlarga ajratadi (rus maktab qoidalari bo'yicha soddalashtirilgan).
 *
 * Qoidalar:
 *  - bo'g'inlar soni = unlilar soni;
 *  - ikki unli orasida bitta undosh bo'lsa — u keyingi bo'g'inga ketadi (мо-ло-ко);
 *  - bir nechta undosh bo'lsa — birinchisi sonor (р л м н й) bo'lsa oldingi
 *    bo'g'inni yopadi (мар-ка), aks holda hammasi keyingi bo'g'inga ketadi (се-стра);
 *  - ь va ъ har doim oldingi bo'g'in bilan qoladi (маль-чик).
 */
export function syllabify(word: string): string[] {
  const chars = graphemes(word)
  const vowelAt: number[] = []
  chars.forEach((c, i) => {
    if (isVowel(c)) vowelAt.push(i)
  })

  if (vowelAt.length <= 1) return [word]

  const syllables: string[] = []
  let start = 0

  for (let v = 0; v < vowelAt.length - 1; v++) {
    const cur = vowelAt[v]
    const next = vowelAt[v + 1]
    const clusterLen = next - cur - 1

    let cut: number
    if (clusterLen <= 1) {
      cut = cur + 1
    } else {
      const first = stripStress(chars[cur + 1]).toLowerCase()
      cut = SONORANTS.includes(first) ? cur + 2 : cur + 1
    }

    // ь / ъ hech qachon bo'g'inni boshlamaydi
    while (cut < next && SOFT_SIGNS.includes(stripStress(chars[cut]).toLowerCase())) cut++

    syllables.push(chars.slice(start, cut).join(""))
    start = cut
  }

  syllables.push(chars.slice(start).join(""))
  return syllables.filter(Boolean)
}

/**
 * Grafema urg'uli hisoblanadimi?
 *
 * Ikki holat urg'uni bildiradi:
 *  - U+0301 belgisi qo'yilgan;
 *  - harf «ё» — rus tilida u har doim urg'uli, shuning uchun unga
 *    belgi qo'yilmaydi (кон­tent ham shunday yoziladi).
 */
export function isStressedGrapheme(grapheme: string): boolean {
  return grapheme.includes(STRESS_MARK) || grapheme.toLowerCase().startsWith("ё")
}

/** So'zda urg'u aniqmi (belgi qo'yilgan yoki «ё» bor)? */
export function hasKnownStress(word: string): boolean {
  return graphemes(word).some(isStressedGrapheme)
}

/** Urg'uli bo'g'in indeksi. Aniqlab bo'lmasa -1. */
export function stressedSyllableIndex(word: string): number {
  const syls = syllabify(word)
  const idx = syls.findIndex((s) => graphemes(s).some(isStressedGrapheme))
  if (idx >= 0) return idx
  // Bitta unlili so'zda urg'u belgilanmasa ham urg'u o'sha yerda.
  if (syls.length === 1 && countVowels(word) === 1) return 0
  return -1
}

export function countVowels(word: string): number {
  return graphemes(word).filter(isVowel).length
}

/**
 * Solishtirish uchun normal shakl: kichik harf, urg'usiz, ё→е, tinish belgilarisiz.
 * STT natijasini kutilgan matn bilan taqqoslashda ishlatiladi.
 */
export function normalizeWord(word: string): string {
  return stripStress(word)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}-]/gu, "")
}

export interface Token {
  /** Asl ko'rinishi, urg'u belgisi bilan: "молоко́," */
  raw: string
  /** Faqat so'z qismi, urg'u bilan: "молоко́" */
  word: string
  /** Solishtirish uchun: "молоко" */
  key: string
  /** So'zdan keyingi tinish belgisi: "," */
  trailing: string
  /** Matndagi tartib raqami (faqat so'zlar orasida) */
  index: number
}

const WORD_RE = /[\p{L}\p{N}̀-ͯ-]+/gu

/** Matnni so'zlarga ajratadi, tinish belgilarini saqlab qoladi. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(WORD_RE)
  let lastEnd = 0
  const raws: { word: string; start: number; end: number }[] = []

  while ((match = re.exec(text)) !== null) {
    raws.push({ word: match[0], start: match.index, end: match.index + match[0].length })
  }

  raws.forEach((r, i) => {
    const nextStart = i + 1 < raws.length ? raws[i + 1].start : text.length
    const trailing = text.slice(r.end, nextStart)
    tokens.push({
      raw: text.slice(r.start, nextStart),
      word: r.word,
      key: normalizeWord(r.word),
      trailing,
      index: i,
    })
    lastEnd = nextStart
  })

  void lastEnd
  return tokens.filter((t) => t.key.length > 0)
}

/** Ekranda ko'rsatish uchun: "мо-ло-ко́" */
export function syllableDisplay(word: string): string {
  return syllabify(word).join("-")
}

/** So'z ichidagi urg'uli unlining grafema indeksi, aniqlanmasa -1. */
export function stressedVowelIndex(word: string): number {
  return graphemes(word).findIndex(isStressedGrapheme)
}
