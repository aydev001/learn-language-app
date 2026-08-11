/**
 * `lesson-data.txt` ni tahlil qiladi.
 *
 * Kutilgan format:
 *
 *   LESSON 1
 *
 *   [ixtiyoriy: DUE 2026-08-12 23:00 — topshirish muddati]
 *
 *   [ixtiyoriy sarlavha — bosh harflardagi qisqa qator]
 *
 *   birinchi abzats...
 *
 *   ikkinchi abzats...
 *
 *   СЛОВА
 *
 *   1. слово — tarjima
 *   2. ...
 */

export interface RawWord {
  index: number
  ru: string
  uz: string
}

export interface RawParagraph {
  text: string
  sentences: string[]
}

export interface RawLesson {
  number: number
  /** Matnda berilgan sarlavha (masalan "ТРИ РОЗЫ"); bo'lmasligi mumkin */
  title?: string
  /**
   * `DUE` qatoridan olingan topshirish muddati, ISO ko'rinishida.
   *
   * Muddat manbada turishi kerak: aks holda uni qo'lda `lessons.data.ts` da
   * tuzatishga to'g'ri keladi, keyingi import esa o'sha faylni qayta yozib,
   * o'qituvchi qo'ygan muddatni yo'qotadi.
   */
  due?: string
  /** Abzatslar va ularning gaplari — bog'lanish shu yerda saqlanadi */
  paragraphs: RawParagraph[]
  /** Barcha gaplar ketma-ket (abzatslardan yig'ilgan) */
  sentences: string[]
  words: RawWord[]
}

const LESSON_RE = /^LESSON\s+(\d+)\s*$/i
const WORDS_HEADER_RE = /^(СЛОВА|SO'ZLAR|SOZLAR)\s*$/i
const WORD_RE = /^(\d+)\.\s*(.+?)\s*[—–-]\s*(.+)$/
/** `DUE 2026-08-12` yoki `DUE 2026-08-12 23:00` */
const DUE_RE = /^DUE\s+(\d{4}-\d{2}-\d{2})(?:[\sT](\d{2}:\d{2}))?\s*$/i

/** O'quvchilar O'zbekistonda — muddat mahalliy vaqtda tushuniladi. */
const TIME_ZONE = "+05:00"

/** Sarlavha: qisqa, nuqtasiz va faqat bosh harflardan iborat qator. */
function looksLikeTitle(line: string): boolean {
  if (line.length > 60 || /[.!?]$/.test(line)) return false
  const letters = [...line].filter((c) => /\p{L}/u.test(c))
  if (letters.length < 2) return false
  return letters.every((c) => c === c.toUpperCase())
}

/**
 * Rus matnini gaplarga ajratadi.
 *
 * Qoida: tinish belgisidan keyin bo'sh joy va bosh harf (yoki «, — + bosh harf)
 * kelsa — yangi gap. Shu tufayli "90-60-90" bo'linmaydi, dialogdagi
 * "— Кто ты? — спросил Абай." esa bir butun bo'lib qoladi (chunki tiredan
 * keyin kichik harf keladi).
 */
export function splitSentences(paragraph: string): string[] {
  const text = paragraph.replace(/\s+/g, " ").trim()
  if (!text) return []

  const out: string[] = []
  let start = 0

  for (let i = 0; i < text.length; i++) {
    if (!/[.!?…]/.test(text[i])) continue

    // Ketma-ket tinish belgilarini birga olamiz: "?!", "..."
    let end = i
    while (end + 1 < text.length && /[.!?…»"]/.test(text[end + 1])) end++

    const after = text.slice(end + 1)
    if (!/^\s/.test(after)) {
      i = end
      continue
    }

    // Bo'sh joydan keyin nima kelyapti?
    const rest = after.trimStart()
    const startsNew =
      rest.length === 0 ||
      /^[«"(]?\p{Lu}/u.test(rest) ||
      /^[—–-]\s*\p{Lu}/u.test(rest)

    if (startsNew) {
      const sentence = text.slice(start, end + 1).trim()
      if (sentence) out.push(sentence)
      start = end + 1 + (after.length - rest.length)
      i = start - 1
    } else {
      i = end
    }
  }

  const tail = text.slice(start).trim()
  if (tail) out.push(tail)

  return out
}

export function parseLessons(source: string): RawLesson[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n")

  const lessons: RawLesson[] = []
  let current: RawLesson | null = null
  let inWords = false
  let buffer: string[] = []

  const flushParagraph = () => {
    const text = buffer.join(" ").replace(/\s+/g, " ").trim()
    buffer = []
    if (!current || !text) return

    if (!current.title && current.paragraphs.length === 0 && looksLikeTitle(text)) {
      current.title = text
      return
    }
    current.paragraphs.push({ text, sentences: splitSentences(text) })
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    const lessonMatch = LESSON_RE.exec(line)
    if (lessonMatch) {
      flushParagraph()
      current = {
        number: Number(lessonMatch[1]),
        paragraphs: [],
        sentences: [],
        words: [],
      }
      lessons.push(current)
      inWords = false
      continue
    }

    if (!current) continue

    const dueMatch = DUE_RE.exec(line)
    if (dueMatch) {
      const [, day, time] = dueMatch
      current.due = time ? `${day}T${time}:00${TIME_ZONE}` : day
      continue
    }

    if (WORDS_HEADER_RE.test(line)) {
      flushParagraph()
      inWords = true
      continue
    }

    if (!line) {
      if (!inWords) flushParagraph()
      continue
    }

    if (inWords) {
      const wordMatch = WORD_RE.exec(line)
      if (wordMatch) {
        current.words.push({
          index: Number(wordMatch[1]),
          ru: wordMatch[2].trim(),
          uz: wordMatch[3].trim(),
        })
      }
      continue
    }

    buffer.push(line)
  }

  flushParagraph()

  for (const lesson of lessons) {
    lesson.sentences = lesson.paragraphs.flatMap((p) => p.sentences)
  }

  return lessons
}
