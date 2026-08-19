/**
 * YouTube IFrame Player API bilan ishlash.
 *
 * Video bizda saqlanmaydi va yuklanmaydi — YouTube'ning rasmiy pleeri
 * iframe ichida ochiladi, biz esa unga faqat "o'ynat / to'xtat / shu joyga
 * o't" deb buyruq beramiz. Shuning uchun huquqiy xavf ham, trafik xarajati
 * ham yo'q.
 *
 * API global `window.YT` orqali keladi va bir marta yuklanadi.
 */

/** `loadVideoById` / `cueVideoById` ning aniq boshlanish nuqtali shakli. */
export interface YTLoadArgs {
  videoId: string
  startSeconds?: number
}

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  /**
   * Videoni yuklab, darhol o'ynatadi.
   *
   * `startSeconds` bilan chaqirilgani `seekTo` dan ishonchliroq: hali
   * boshlanmagan videoda `seekTo` ko'pincha 0-soniyada qolib ketardi.
   */
  loadVideoById(args: YTLoadArgs): void
  /** Yuklaydi, lekin o'ynatmaydi. */
  cueVideoById(args: YTLoadArgs): void
  setVolume(volume: number): void
  getVolume(): number
  mute(): void
  unMute(): void
  isMuted(): boolean
  destroy(): void
}

export interface YTStateEvent {
  data: number
  target: YTPlayer
}

export interface YTErrorEvent {
  data: number
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId?: string
      host?: string
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: YTStateEvent) => void
        onError?: (event: YTErrorEvent) => void
      }
    },
  ) => YTPlayer
  PlayerState: {
    UNSTARTED: number
    ENDED: number
    PLAYING: number
    PAUSED: number
    BUFFERING: number
    CUED: number
  }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

/** Pleer holatlari — `getPlayerState()` shu sonlarni qaytaradi. */
export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

/**
 * Videoni ko'rsatib bo'lmaydigan holatlar.
 * 101 va 150 — egasi tashqi saytda ko'rishni taqiqlagan (bir xil xato, ikki kod).
 */
export function describeYouTubeError(code: number): string {
  switch (code) {
    case 2:
      return "Havola noto'g'ri — video manzilini tekshiring."
    case 5:
      return "Bu qurilmadagi pleer videoni ocholmadi."
    case 100:
      return "Video topilmadi: o'chirilgan yoki yopiq."
    case 101:
    case 150:
      return "Video egasi uni boshqa ilovalarda ko'rishni taqiqlagan. Boshqa havola tanlang."
    default:
      return "Videoni ochib bo'lmadi. Boshqa havola bilan urinib ko'ring."
  }
}

let loader: Promise<YTNamespace> | null = null

/** IFrame API skriptini bir marta yuklaydi. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (loader) return loader

  loader = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error("YouTube API yuklandi, lekin pleer topilmadi"))
    }

    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    script.onerror = () => {
      loader = null
      reject(new Error("YouTube pleerini yuklab bo'lmadi — internetni tekshiring"))
    }
    document.head.appendChild(script)
  })

  return loader
}

/** 3725 → "1:02:05", 125 → "2:05" */
export function formatVideoTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const mm = h ? String(m).padStart(2, "0") : String(m)
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`
}
