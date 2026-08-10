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

/** Muddatgacha qolgan kunlar — kartochkalarda ko'rsatiladi. */
export function formatDue(iso: string): { text: string; tone: "ok" | "soon" | "late" } {
  const days = Math.round(
    (startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / 86_400_000,
  )

  if (days < 0) return { text: `Muddati ${-days} kun oldin tugadi`, tone: "late" }
  if (days === 0) return { text: "Bugun topshiriladi", tone: "soon" }
  if (days === 1) return { text: "Ertaga topshiriladi", tone: "soon" }
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
