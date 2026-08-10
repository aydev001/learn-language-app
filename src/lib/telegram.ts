/**
 * Telegram Mini App bilan ishlash qatlami.
 *
 * Ilova brauzerda ham ochilishi mumkin (ishlab chiqish paytida) — shuning uchun
 * har bir chaqiruv `tg` mavjudligini tekshiradi va bo'lmasa jimgina o'tib ketadi.
 */

export const tg: TelegramWebApp | undefined =
  typeof window !== "undefined" ? window.Telegram?.WebApp : undefined

/** Haqiqiy Telegram muhitidamizmi? */
export const isTelegram = Boolean(tg?.initData)

/** Serverga yuboriladigan imzolangan satr. */
export function getInitData(): string {
  return tg?.initData ?? ""
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user
}

/** Telegram mavzusiga qarab `.dark` klassini o'rnatadi. */
function applyColorScheme() {
  const dark = tg ? tg.colorScheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
  document.documentElement.classList.toggle("dark", dark)
}

/**
 * Ilova ishga tushganda bir marta chaqiriladi.
 * Yig'ma oyna, mavzu, orqaga surish himoyasi — hammasi shu yerda.
 */
export function initTelegram() {
  applyColorScheme()

  if (!tg) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", applyColorScheme)
    return
  }

  tg.ready()
  tg.expand()

  // Quyidagilar Telegram'ning yangiroq versiyalarida bor — yo'q bo'lsa e'tibormay o'tamiz.
  callIfSupported(tg, "disableVerticalSwipes")
  callIfSupported(tg, "enableClosingConfirmation")

  tg.onEvent("themeChanged", applyColorScheme)
}

function callIfSupported(app: TelegramWebApp, method: string) {
  const fn = (app as unknown as Record<string, unknown>)[method]
  if (typeof fn === "function") {
    try {
      ;(fn as () => void).call(app)
    } catch {
      /* eski mijoz — muhim emas */
    }
  }
}

/* --------------------------------------------------------------- haptics */

type Impact = "light" | "medium" | "heavy" | "rigid" | "soft"

export const haptic = {
  impact(style: Impact = "light") {
    try {
      tg?.HapticFeedback?.impactOccurred(style)
    } catch {
      /* qo'llab-quvvatlanmaydi */
    }
  },
  success() {
    try {
      tg?.HapticFeedback?.notificationOccurred("success")
    } catch {
      /* qo'llab-quvvatlanmaydi */
    }
  },
  error() {
    try {
      tg?.HapticFeedback?.notificationOccurred("error")
    } catch {
      /* qo'llab-quvvatlanmaydi */
    }
  },
  select() {
    try {
      tg?.HapticFeedback?.selectionChanged()
    } catch {
      /* qo'llab-quvvatlanmaydi */
    }
  },
}

/* ---------------------------------------------------------- orqaga tugmasi */

/** Telegram'ning tizim "orqaga" tugmasini boshqaradi. */
export function setBackButton(handler: (() => void) | null) {
  const back = tg?.BackButton
  if (!back) return () => {}

  if (!handler) {
    back.hide()
    return () => {}
  }

  back.onClick(handler)
  back.show()

  return () => {
    back.offClick(handler)
    back.hide()
  }
}
