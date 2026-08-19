/**
 * YouTube havolasi bilan ishlash — mijoz ham, server ham shu yerdan foydalanadi.
 *
 * Videoning o'zi bizda saqlanmaydi: bazada faqat 11 belgilik `videoId` turadi,
 * qolgani YouTube'ning o'zida qoladi.
 */

/** YouTube video id — har doim 11 ta belgi. */
const ID_RE = /^[\w-]{11}$/

/**
 * Havoladan video id ajratadi. Qo'llab-quvvatlanadigan shakllar:
 *
 *   https://www.youtube.com/watch?v=ID&t=42
 *   https://youtu.be/ID?t=42
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   https://www.youtube.com/live/ID
 *   ID                                  (o'quvchi faqat id nusxalagan bo'lsa)
 *
 * Havola noto'g'ri bo'lsa `null`.
 */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  if (ID_RE.test(raw)) return raw

  let url: URL
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "")
  const parts = url.pathname.split("/").filter(Boolean)

  if (host === "youtu.be") return check(parts[0])

  if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") return check(url.searchParams.get("v"))
    if (["embed", "shorts", "live", "v"].includes(parts[0])) return check(parts[1])
    // youtube.com/?v=ID
    if (!parts.length) return check(url.searchParams.get("v"))
  }

  return null
}

function check(value: string | null | undefined): string | null {
  return value && ID_RE.test(value) ? value : null
}

/**
 * Havoladagi boshlanish vaqti (`?t=90`, `?t=1m30s`, `#t=90`) — sekundda.
 * Yo'q bo'lsa 0.
 */
export function parseStartSeconds(input: string): number {
  const match = /[?&#]t=([^&#]+)/.exec(input)
  if (!match) return 0

  const value = match[1]
  if (/^\d+$/.test(value)) return Number(value)

  const parts = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value)
  if (!parts) return 0

  const [, h = "0", m = "0", s = "0"] = parts
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

export const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`
export const youtubeThumbUrl = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
