/**
 * Telegram Mini App SDK tiplari — biz ishlatadigan qismi.
 *
 * SDK `index.html` dagi <script> orqali yuklanadi, npm paket sifatida emas,
 * shuning uchun global e'lonni o'zimiz beramiz. Yangi imkoniyat kerak bo'lsa
 * shu faylga qo'shing: https://core.telegram.org/bots/webapps
 */
export {}

declare global {
  interface TelegramWebAppUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    is_premium?: boolean
    photo_url?: string
  }

  interface TelegramHapticFeedback {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void
    notificationOccurred(type: "error" | "success" | "warning"): void
    selectionChanged(): void
  }

  interface TelegramBackButton {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }

  interface TelegramWebApp {
    /** Imzolangan initData satri — serverda tekshiriladi */
    initData: string
    initDataUnsafe: {
      user?: TelegramWebAppUser
      auth_date?: number
      hash?: string
      start_param?: string
    }
    version: string
    platform: string
    colorScheme: "light" | "dark"
    themeParams: Record<string, string | undefined>
    isExpanded: boolean
    viewportHeight: number
    viewportStableHeight: number

    BackButton: TelegramBackButton
    HapticFeedback: TelegramHapticFeedback

    ready(): void
    expand(): void
    close(): void
    onEvent(eventType: string, callback: () => void): void
    offEvent(eventType: string, callback: () => void): void

    /* Quyidagilar faqat yangiroq mijozlarda bor — chaqirishdan oldin tekshiring */
    disableVerticalSwipes?: () => void
    enableClosingConfirmation?: () => void
    setHeaderColor?: (color: string) => void
    setBackgroundColor?: (color: string) => void
  }

  interface Window {
    Telegram?: { WebApp: TelegramWebApp }
  }
}
