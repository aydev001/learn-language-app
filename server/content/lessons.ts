import type { Lesson } from "../../shared/types.js"
import { LESSON_DATA } from "./lessons.data.js"

/**
 * Darslar.
 *
 * Manba — `lessons.data.ts`, uni `npm run import` skripti
 * `lesson-data.txt` dan yaratadi (urg'u belgilari, tarjimalar va
 * misollarni model to'ldiradi).
 *
 * Urg'u xato qo'yilgan bo'lsa o'sha faylda tuzatiladi; tekshirish uchun
 * `stress-review.txt` ga qarang.
 *
 * Urg'u U+0301 (combining acute) bilan, urg'uli unlidan keyin yoziladi:
 *   молоко́  →  м о л о к о + U+0301
 * Bo'g'inlarga ajratish va urg'u mashqlari shu belgidan avtomatik hisoblanadi.
 * «ё» har doim urg'uli, unga belgi qo'yilmaydi.
 */
export const LESSONS: Lesson[] = LESSON_DATA

/**
 * Dars berilgan kuni kelganmi (Toshkent vaqti bilan). Oldindan qo'shilgan
 * darslar o'z kunigacha ro'yxatda ko'rinmaydi — aks holda ertangi dars
 * bugungi vazifa o'rnini egallab olardi.
 */
export function isAssigned(lesson: Lesson, now = new Date()): boolean {
  const today = new Date(now.getTime() + 5 * 3_600_000).toISOString().slice(0, 10)
  return lesson.assignedAt.slice(0, 10) <= today
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}
