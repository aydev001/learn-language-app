/**
 * Muhit o'zgaruvchilari. Hech biri majburiy emas —
 * yo'q bo'lsa ilova "degraded" rejimda ishlayveradi (dev uchun qulay).
 */
export const env = {
  get botToken() {
    return process.env.TELEGRAM_BOT_TOKEN ?? ""
  },
  get openaiKey() {
    return process.env.OPENAI_API_KEY ?? ""
  },
  get mongoUri() {
    return process.env.MONGODB_URI ?? ""
  },
  get mongoDb() {
    return process.env.MONGODB_DB || "learn_russian"
  },

  /**
   * Ilovaning tashqi HTTPS manzili — bot shu havolani o'quvchiga yuboradi.
   * Vercel'da avtomatik to'ldiriladi, lokal tunnel uchun qo'lda yoziladi.
   */
  get publicUrl() {
    const manual = (process.env.PUBLIC_APP_URL ?? "").replace(/\/+$/, "")
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : ""

    // Tunnel manzillari faqat lokal ishlab chiqish uchun va bir necha soatda
    // o'ladi. Bir marta Vercel'ning o'zgaruvchilarida qolib ketgani uchun bot
    // tugmalari o'lik havolani ochib turdi ("sahifani yangilang" xatosi).
    // Vercel'da bunday manzil hech qachon to'g'ri bo'lolmaydi — o'tkazib yuboramiz.
    const tunnel = /\.(trycloudflare\.com|ngrok(-free)?\.app|ngrok\.io|loca\.lt)$/i.test(
      manual.replace(/^https?:\/\//, ""),
    )
    if (manual && !(tunnel && vercel)) return manual
    return vercel
  },
  /** Vergul bilan ajratilgan Telegram ID'lar — o'qituvchi/admin huquqi */
  get adminIds(): number[] {
    return (process.env.ADMIN_TELEGRAM_IDS ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
  },
  /** Ishlab chiqarish muhitidamizmi? */
  get isProduction() {
    return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"
  },

  /**
   * Telegram tashqarisida (brauzerda) sinash uchun soxta foydalanuvchi.
   *
   * Production'da bu qanday sozlanganidan qat'i nazar o'chiq turadi:
   * `.env` da tasodifan `1` qolib ketsa, havolani bilgan har kim
   * o'quvchilar reytingiga kirib olardi. Bunday xatoni sozlamaga
   * ishonib qo'yib bo'lmaydi.
   */
  get allowDevUser() {
    if (this.isProduction) return false
    return process.env.ALLOW_DEV_USER === "1"
  },

  /**
   * Oylik sarf chegarasi (dollarda). Oshib ketsa yangi sintez to'xtaydi,
   * keshdagi audio esa ishlayveradi. 0 — chegara yo'q.
   */
  get monthlyBudgetUsd() {
    const raw = Number(process.env.MONTHLY_BUDGET_USD)
    return Number.isFinite(raw) && raw >= 0 ? raw : 4
  },

  /**
   * 1 bo'lsa talaffuz tahlili haqiqiy modelga bormaydi — soxta, lekin
   * real ko'rinishdagi hisobot qaytaradi. Interfeysni bepul sozlash uchun.
   */
  get mockPronunciation() {
    return process.env.MOCK_PRONUNCIATION === "1"
  },

  /* --- ovoz sintezi (TTS) --- */

  /** Qaysi provayder ishlatiladi: "google" yoki "openai" */
  get ttsProvider(): "google" | "openai" {
    return process.env.TTS_PROVIDER === "openai" ? "openai" : "google"
  },
  get googleTtsKey() {
    return process.env.GOOGLE_TTS_API_KEY ?? ""
  },
  /**
   * Google ovozi. Wavenet/Neural2 — SSML qo'llab-quvvatlaydi (urg'u mashqi
   * uchun muhim). Chirp3-HD tabiiyroq, lekin SSML'siz.
   */
  get googleTtsVoice() {
    return process.env.GOOGLE_TTS_VOICE || "ru-RU-Wavenet-C"
  },

  // Model nomlari — kelajakda o'zgarsa faqat .env tahrirlanadi
  get ttsModel() {
    return process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts"
  },
  get ttsVoice() {
    return process.env.OPENAI_TTS_VOICE || "alloy"
  },
  /** whisper-1 dan ikki barobar arzon va aniqroq */
  get sttModel() {
    return process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe"
  },
  get chatModel() {
    return process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini"
  },
  /**
   * Kontent importi uchun kuchliroq model.
   *
   * Urg'u va tarjima sifati bu yerda hal qilinadi, shuning uchun arzon
   * modelga ishonib bo'lmaydi: sinovda gpt-4.1-mini 18 ta qiyin so'zdan
   * 10 tasiga to'g'ri urg'u qo'ydi, gpt-4.1 esa 18/18. Tarjimada ham
   * mini ma'noni ag'darib yuborgan ("давно-давно" -> "yaqinda").
   *
   * Import bir martalik, shuning uchun narx sezilmaydi.
   */
  get importModel() {
    return process.env.OPENAI_IMPORT_MODEL || "gpt-4.1"
  },
}

export const hasOpenAI = () => env.openaiKey.length > 0
export const hasMongo = () => env.mongoUri.length > 0
export const hasBotToken = () => env.botToken.length > 0
