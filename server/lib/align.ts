/**
 * Kutilgan matn bilan Whisper eshitgan matnni so'z darajasida tekislash.
 *
 * Needleman–Wunsch: qaysi so'z to'g'ri o'qilgan, qaysi biri boshqacha
 * eshitilgan, qaysi biri tushib qolgan yoki ortiqcha aytilganini aniqlaydi.
 * Bu — modelga bermasdan oldin oladigan obyektiv signalimiz.
 */

export type OpType = "match" | "sub" | "del" | "ins"

export interface AlignOp {
  type: OpType
  /** Kutilgan so'z indeksi (del/sub/match) */
  exp: number | null
  /** Eshitilgan so'z indeksi (ins/sub/match) */
  hyp: number | null
  /** 0..1 — so'zlar qanchalik o'xshash */
  similarity: number
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const cur = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = cur.slice()
  }
  return prev[b.length]
}

/** 1 = bir xil, 0 = umuman boshqa. */
export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  return 1 - levenshtein(a, b) / max
}

const GAP = -1

export function alignWords(expected: string[], heard: string[]): AlignOp[] {
  const n = expected.length
  const m = heard.length

  // score[i][j] — expected[0..i) va heard[0..j) uchun eng yaxshi ball
  const score: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 1; i <= n; i++) score[i][0] = i * GAP
  for (let j = 1; j <= m; j++) score[0][j] = j * GAP

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      // bir xil so'z +1, umuman boshqa -1
      const sim = similarity(expected[i - 1], heard[j - 1])
      score[i][j] = Math.max(
        score[i - 1][j - 1] + (sim * 2 - 1),
        score[i - 1][j] + GAP,
        score[i][j - 1] + GAP,
      )
    }
  }

  const ops: AlignOp[] = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sim = similarity(expected[i - 1], heard[j - 1])
      if (score[i][j] === score[i - 1][j - 1] + (sim * 2 - 1)) {
        ops.push({ type: sim >= 0.999 ? "match" : "sub", exp: i - 1, hyp: j - 1, similarity: sim })
        i--
        j--
        continue
      }
    }
    if (i > 0 && score[i][j] === score[i - 1][j] + GAP) {
      ops.push({ type: "del", exp: i - 1, hyp: null, similarity: 0 })
      i--
      continue
    }
    ops.push({ type: "ins", exp: null, hyp: j - 1, similarity: 0 })
    j--
  }

  return ops.reverse()
}
