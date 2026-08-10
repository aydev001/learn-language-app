import type { PronunciationReport, WordJudgement, WordStatus } from "../../shared/types"
import { stripStress, syllabify, stressedSyllableIndex, tokenize } from "../../shared/stress"

/**
 * Soxta talaffuz hisoboti — `MOCK_PRONUNCIATION=1` bo'lganda ishlatiladi.
 *
 * Maqsad: tahlil ekranini (ranglar, mashq kartochkalari, murabbiy izohi)
 * bir tiyin sarflamasdan sozlash. Hisobot haqiqiysi bilan bir xil shaklda
 * bo'ladi va barcha holatlarni — to'g'ri, urg'u xatosi, tovush xatosi,
 * tushib qolgan so'z — ko'rsatadi, shunda interfeysning har bir holati
 * ko'zdan o'tkaziladi.
 */
export function mockReport(sentenceId: string, sentenceRu: string): PronunciationReport {
  const tokens = tokenize(sentenceRu)

  // Har bir uchinchi va beshinchi so'zni "xato" qilamiz — natija barqaror
  // bo'lsin deb tasodifsiz, so'z tartibiga qarab tanlaymiz.
  const words: WordJudgement[] = tokens.map((token, i) => {
    let status: WordStatus = "ok"
    if (tokens.length > 2 && i === 2) status = "stress"
    else if (tokens.length > 4 && i === 4) status = "sound"
    else if (tokens.length > 6 && i === 6) status = "missing"

    const plain = stripStress(token.word)

    return {
      expected: token.word,
      heard: status === "missing" ? null : status === "sound" ? distort(plain) : plain,
      status,
      hintUz: hintFor(status, plain),
      syllables: syllabify(token.word),
      correctSyllable: stressedSyllableIndex(token.word),
    }
  })

  const wrong = words.filter((w) => w.status !== "ok").length
  const accuracy = tokens.length ? Math.max(0, (tokens.length - wrong) / tokens.length) : 0

  const drills = words
    .filter((w) => w.status !== "ok")
    .slice(0, 2)
    .map((w) => `${w.syllables.join(", ")}. ${w.expected}.`)
    .join(" ")

  return {
    sentenceId,
    transcript: words
      .filter((w) => w.heard)
      .map((w) => w.heard)
      .join(" "),
    accuracy,
    wpm: 96,
    durationMs: 7400,
    words,
    summaryUz:
      "[MOCK] Gapni ishonchli o'qidingiz. Bir-ikki so'zda urg'u siljib ketdi — " +
      "quyida ular ustida mashq qilamiz.",
    coachScript: `[MOCK] Yaxshi o'qidingiz. Mana bu so'zlarni birga takrorlaymiz. ${drills} Endi butun gapni qaytadan o'qing.`,
    tips: [
      "[MOCK] Urg'uli bo'g'inni qo'shni bo'g'inlardan uzunroq cho'zing.",
      "[MOCK] Gap oxirida ovozingizni pasaytiring.",
    ],
    degraded: false,
  }
}

/** Tovush xatosini taqlid qiladi: oxirgi undoshni almashtiradi. */
function distort(word: string): string {
  const swaps: Record<string, string> = { з: "с", б: "п", д: "т", в: "ф", г: "к", ж: "ш" }
  const chars = [...word]
  for (let i = chars.length - 1; i >= 0; i--) {
    const swap = swaps[chars[i]]
    if (swap) {
      chars[i] = swap
      return chars.join("")
    }
  }
  return word
}

function hintFor(status: WordStatus, word: string): string | undefined {
  switch (status) {
    case "stress":
      return `[MOCK] «${word}» so'zida urg'u boshqa bo'g'inga tushdi.`
    case "sound":
      return `[MOCK] «${word}» so'zidagi undosh tovush noaniq chiqdi.`
    case "missing":
      return `[MOCK] «${word}» so'zi eshitilmadi — tushib qolgan bo'lishi mumkin.`
    default:
      return undefined
  }
}
