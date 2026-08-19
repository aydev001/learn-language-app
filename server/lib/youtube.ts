/**
 * YouTube videosi haqida minimal ma'lumot — sarlavha va ko'rish mumkinligi.
 *
 * Rasmiy Data API kalit talab qiladi, bizga esa faqat sarlavha kerak.
 * Shuning uchun ochiq **oEmbed** nuqtasidan foydalanamiz: kalitsiz, limitsiz.
 *
 * Yon foyda: oEmbed videoni tashqi saytga qo'yish taqiqlangan bo'lsa 401
 * qaytaradi. Ya'ni o'quvchi "ko'rinmaydigan" havola bergani uy yaratilishidan
 * oldin ma'lum bo'ladi — pleer ichida jim qora ekran chiqmaydi.
 */

export type VideoInfo =
  | { ok: true; title: string }
  | { ok: false; reason: "not_found" | "not_embeddable" | "unreachable" }

const OEMBED = "https://www.youtube.com/oembed"

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const url = `${OEMBED}?format=json&url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })

    if (res.status === 404) return { ok: false, reason: "not_found" }
    // 401 — video bor, lekin egasi tashqi saytda ko'rishni taqiqlagan.
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "not_embeddable" }
    if (!res.ok) return { ok: false, reason: "unreachable" }

    const body = (await res.json()) as { title?: string }
    const title = (body.title ?? "").trim()
    return { ok: true, title: title || "YouTube video" }
  } catch {
    // Tarmoq yiqilsa yoki YouTube javob bermasa — uy yaratilishiga to'sqinlik
    // qilmaymiz, shunchaki sarlavhasiz davom etamiz.
    return { ok: false, reason: "unreachable" }
  }
}
