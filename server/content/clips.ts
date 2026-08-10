import { LESSONS } from "./lessons"
import { stripStress, tokenize } from "../../shared/stress"

/**
 * Dars kontentiga kerak bo'ladigan barcha ovoz kliplari.
 *
 * Bu — yagona manba: `prewarm` shu ro'yxatni tayyorlaydi, `cache:prune` esa
 * shu ro'yxatda yo'q hamma narsani o'chiradi. Ikkalasi bir joydan o'qigani
 * uchun tozalash hech qachon kerakli audioni o'chirib yubormaydi.
 */

export type ClipKind = "abzats" | "gap" | "so'z" | "misol" | "so'z-alohida"

export interface Clip {
  text: string
  kind: ClipKind
}

export interface CollectOptions {
  /** Faqat shu darslar. Bo'sh bo'lsa — hammasi. */
  lessonIds?: string[]
  /** Matndagi alohida so'zlarni tashlab ketish (arzonroq to'plam). */
  core?: boolean
}

export function collectClips({ lessonIds = [], core = false }: CollectOptions = {}): Clip[] {
  const clips: Clip[] = []
  const seen = new Set<string>()

  const add = (text: string, kind: ClipKind) => {
    if (!text.trim() || seen.has(text)) return
    seen.add(text)
    clips.push({ text, kind })
  }

  for (const lesson of LESSONS) {
    if (lessonIds.length && !lessonIds.includes(lesson.id)) continue

    // To'liq matnni tinglash abzatslar bo'yicha boradi.
    for (const paragraph of lesson.reading.paragraphs) add(paragraph, "abzats")

    for (const sentence of lesson.reading.sentences) {
      add(sentence.ru, "gap")

      // O'quvchi matndagi istalgan so'zni bosib alohida eshitishi mumkin.
      if (!core) {
        for (const token of tokenize(sentence.ru)) {
          add(stripStress(token.word), "so'z-alohida")
        }
      }
    }

    for (const word of lesson.vocabulary) {
      add(word.ru, "so'z")
      if (word.example) add(word.example.ru, "misol")
    }
  }

  return clips
}
