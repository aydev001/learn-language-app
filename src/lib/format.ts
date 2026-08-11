const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
]

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** "10-avgust" */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}-${MONTHS[d.getMonth()]}`
}

/**
 * Muddat lahzasi.
 *
 * Muddat ikki xil yozilishi mumkin: faqat sana ("2026-08-17") yoki soat bilan
 * ("2026-08-12T23:00:00+05:00"). Faqat sana bo'lsa — o'sha kunning oxirigacha,
 * aks holda o'quvchi ertalab soat 5 da "muddati o'tdi" degan yozuvni ko'rardi
 * (sanasiz ISO satr UTC yarim tun deb o'qiladi).
 */
function dueInstant(iso: string): Date {
  if (/T\d/.test(iso)) return new Date(iso)
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}

/** Muddatda aniq soat ko'rsatilganmi */
const hasTime = (iso: string) => /T\d/.test(iso)

/** Muddat o'tganmi — bugungi vazifa hali dolzarbmi, shuni hal qiladi. */
export function isPastDue(iso: string): boolean {
  return dueInstant(iso).getTime() < Date.now()
}

/** Muddatgacha qolgan vaqt — kartochkalarda ko'rsatiladi. */
export function formatDue(iso: string): { text: string; tone: "ok" | "soon" | "late" } {
  const due = dueInstant(iso)
  const days = Math.round(
    (startOfDay(due).getTime() - startOfDay(new Date()).getTime()) / 86_400_000,
  )

  if (isPastDue(iso)) {
    return {
      text: days === 0 ? "Muddati bugun tugadi" : `Muddati ${-days} kun oldin tugadi`,
      tone: "late",
    }
  }

  const at = hasTime(iso)
    ? ` soat ${due.getHours()}:${String(due.getMinutes()).padStart(2, "0")} da`
    : ""

  if (days === 0) return { text: `Bugun${at} topshiriladi`, tone: "soon" }
  if (days === 1) return { text: `Ertaga${at} topshiriladi`, tone: "soon" }
  return { text: `${days} kun qoldi`, tone: "ok" }
}

/** 1234 → "1,2 s" */
export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`
}

/** 95_400 → "1:35" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function pluralUz(count: number, word: string): string {
  return `${count} ${word}`
}

/** Massivni tasodifiy tartibda qaytaradi (Fisher–Yates). */
export function shuffle<T>(items: readonly T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Boshqa variantlardan `count` ta tasodifiy chalg'ituvchi javob tanlaydi. */
export function pickDistractors<T>(pool: readonly T[], exclude: T, count: number): T[] {
  return shuffle(pool.filter((item) => item !== exclude)).slice(0, count)
}
