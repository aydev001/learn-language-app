/**
 * Tashqi xizmat xatolarini foydalanuvchi tushunadigan xabarga aylantiradi.
 *
 * OpenAI/Google xatolari texnik tilda keladi ("insufficient_quota"), ekranda
 * esa o'quvchi nima bo'lganini bilishi kerak — hech bo'lmasa "hozir ishlamayapti"
 * darajasida. Sozlash muammolari (kalit, to'lov) esa loglarda aniq ko'rinsin.
 */

export interface FriendlyError {
  status: 402 | 401 | 429 | 503
  body: { error: string; message: string }
}

interface UpstreamShape {
  status?: number
  code?: string | null
  message?: string
}

export function describeUpstreamError(err: unknown): FriendlyError | null {
  if (!err || typeof err !== "object") return null

  const e = err as UpstreamShape
  const code = typeof e.code === "string" ? e.code : ""
  const message = typeof e.message === "string" ? e.message : ""
  const status = typeof e.status === "number" ? e.status : 0

  // --- o'zimiz qo'ygan oylik chegara ---
  if (code === "budget_exceeded") {
    return {
      status: 402,
      body: {
        error: "budget_exceeded",
        message:
          "Bu oyda ovoz xizmati uchun ajratilgan mablag' tugadi. " +
          "Oldindan tayyorlangan matnlar ishlayveradi.",
      },
    }
  }

  // --- hisobda mablag' tugagan ---
  if (code === "insufficient_quota" || code === "credit_balance_exhausted") {
    return {
      status: 402,
      body: {
        error: "no_credits",
        message:
          "Ovoz xizmati hisobida mablag' tugagan. O'qituvchiga murojaat qiling — " +
          "OpenAI billing sahifasidan to'ldirish kerak.",
      },
    }
  }

  // --- kalit noto'g'ri yoki o'chirilgan ---
  if (code === "invalid_api_key" || status === 401) {
    return {
      status: 401,
      body: {
        error: "bad_api_key",
        message: "Ovoz xizmati kaliti noto'g'ri sozlangan. O'qituvchiga xabar bering.",
      },
    }
  }

  // --- so'rovlar chegarasi ---
  if (status === 429) {
    return {
      status: 429,
      body: {
        error: "rate_limited",
        message: "Hozir so'rovlar juda ko'p. Bir necha soniyadan keyin urinib ko'ring.",
      },
    }
  }

  // --- Google TTS REST javobi (bizning google.ts shunday xato tashlaydi) ---
  const googleStatus = /^Google TTS xatosi (\d{3})/.exec(message)?.[1]
  if (googleStatus) {
    const forbidden = googleStatus === "403"
    return {
      status: 503,
      body: {
        error: "tts_upstream",
        message: forbidden
          ? "Google ovoz xizmati rad etdi — API kaliti yoki 'Cloud Text-to-Speech API' " +
            "yoqilmagan bo'lishi mumkin."
          : "Ovoz xizmati vaqtincha javob bermayapti. Birozdan so'ng urinib ko'ring.",
      },
    }
  }

  // --- sozlanmagan ---
  if (/o'rnatilmagan|sozlanmagan/.test(message)) {
    return {
      status: 503,
      body: { error: "not_configured", message: "Ovoz xizmati sozlanmagan." },
    }
  }

  return null
}
