import type { Lesson } from "../../shared/types"
import generated from "./lessons.json"

/**
 * Darslar.
 *
 * Manba — `lessons.json`, uni `npm run import` skripti `lesson-data.txt` dan
 * yaratadi (urg'u belgilari, tarjimalar va misollarni model to'ldiradi).
 *
 * JSON'ni qo'lda tahrirlash mumkin va kerak ham: urg'u xato qo'yilgan bo'lsa
 * shu yerda tuzatiladi. Tekshirish uchun `stress-review.txt` ga qarang.
 *
 * Urg'u U+0301 (combining acute) bilan, urg'uli unlidan keyin yoziladi:
 *   молоко́  →  м о л о к о + U+0301
 * Bo'g'inlarga ajratish va urg'u mashqlari shu belgidan avtomatik hisoblanadi.
 * «ё» har doim urg'uli, unga belgi qo'yilmaydi.
 */
export const LESSONS: Lesson[] = generated as Lesson[]

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}
