import { createHmac, timingSafeEqual } from "node:crypto"
import { env, hasBotToken } from "./env.js"

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  is_premium?: boolean
}

export interface AuthResult {
  user: TelegramUser
  isAdmin: boolean
  /** Imzo tekshirilmagan (dev rejim) */
  dev: boolean
}

/** initData 24 soatdan eski bo'lsa rad etamiz (qayta o'ynatish hujumiga qarshi). */
const MAX_AGE_SECONDS = 24 * 60 * 60

/**
 * Telegram Mini App `initData` satrini tekshiradi.
 * Algoritm: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 *   secret = HMAC_SHA256(key = "WebAppData", msg = bot_token)
 *   hash   = HMAC_SHA256(key = secret,      msg = data_check_string)
 */
export function verifyInitData(initDataRaw: string): TelegramUser | null {
  const result = inspectInitData(initDataRaw)
  return "user" in result ? result.user : null
}

/**
 * `verifyInitData` bilan bir xil, lekin muvaffaqiyatsizlik sababini ham aytadi.
 *
 * Sabab 401 javobiga qo'shiladi: aks holda "initData umuman kelmadi" (mijoz
 * tomoni) bilan "imzo mos kelmadi" (token boshqa) bir xil ko'rinadi va
 * qaysi tomonni tuzatish kerakligini bilib bo'lmaydi.
 */
export function inspectInitData(
  initDataRaw: string,
): { user: TelegramUser } | { reason: string } {
  if (!hasBotToken()) return { reason: "serverda bot token yo'q" }
  if (!initDataRaw) return { reason: "initData bo'sh — Telegram uni bermagan" }

  const params = new URLSearchParams(initDataRaw)
  const keys = [...params.keys()].filter((k) => k !== "hash").sort()
  const hash = params.get("hash")
  if (!hash) return { reason: `hash yo'q (maydonlar: ${keys.join(",") || "yo'q"})` }
  params.delete("hash")

  /**
   * HMAC `hash` dan boshqa hamma maydon ustidan hisoblanadi — `signature` ham
   * qatnashadi. Uni faqat uchinchi tomonning Ed25519 tekshiruvi chiqarib
   * tashlaydi, bot esa tashlamaydi. Ilgari biz uni ham olib tashlardik, shuning
   * uchun Bot API 8.0 mijozlaridan kelgan har bir initData rad etilardi.
   *
   * Ikkala shaklni ham sinaymiz: ikkalasini qalbakilashtirish uchun ham bot
   * tokeni kerak, ya'ni xavfsizlik pasaymaydi, lekin Telegram qoidani yana
   * o'zgartirsa ilova to'xtab qolmaydi.
   */
  const secret = createHmac("sha256", "WebAppData").update(env.botToken).digest()
  const fields = [...params.entries()]
  const variants = [fields, fields.filter(([k]) => k !== "signature")]

  if (!variants.some((v) => hashMatches(secret, v, hash))) {
    return { reason: `imzo mos emas (maydonlar: ${keys.join(",")})` }
  }

  const authDate = Number(params.get("auth_date") ?? 0)
  const ageSeconds = Math.round(Date.now() / 1000 - authDate)
  if (!authDate) return { reason: "auth_date yo'q" }
  if (ageSeconds > MAX_AGE_SECONDS) {
    return { reason: `initData eskirgan (${Math.round(ageSeconds / 3600)} soat)` }
  }

  const userJson = params.get("user")
  if (!userJson) return { reason: "user maydoni yo'q" }

  try {
    const user = JSON.parse(userJson) as TelegramUser
    if (typeof user?.id !== "number") return { reason: "user.id son emas" }
    return { user }
  } catch {
    return { reason: "user JSON o'qilmadi" }
  }
}

/** `key=value` juftliklaridan data-check-string yasab, HMAC'ni solishtiradi. */
function hashMatches(secret: Buffer, fields: [string, string][], received: string): boolean {
  const dataCheckString = fields
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n")

  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex")
  const a = Buffer.from(computed, "hex")
  const b = Buffer.from(received, "hex")
  return a.length === b.length && timingSafeEqual(a, b)
}

const DEV_USER: TelegramUser = {
  id: 1,
  first_name: "Dev",
  last_name: "Foydalanuvchi",
  username: "dev",
  language_code: "uz",
}

/**
 * So'rovdan foydalanuvchini aniqlaydi.
 * Header: `Authorization: tma <initDataRaw>`
 */
export function authenticate(request: Request): AuthResult | null {
  return authenticateDetailed(request).auth
}

/** `authenticate` bilan bir xil, lekin rad etish sababini ham qaytaradi. */
export function authenticateDetailed(request: Request): {
  auth: AuthResult | null
  reason?: string
} {
  const header = request.headers.get("authorization") ?? ""
  const raw = header.startsWith("tma ") ? header.slice(4) : ""

  const result = inspectInitData(raw)
  if ("user" in result) {
    const { user } = result
    return { auth: { user, isAdmin: env.adminIds.includes(user.id), dev: false } }
  }

  const reason = header ? result.reason : "Authorization sarlavhasi yuborilmadi"

  if (env.allowDevUser) {
    // Brauzerda bir nechta "foydalanuvchi"ni sinash uchun: ?devUser=5
    const url = new URL(request.url)
    const devId = Number(url.searchParams.get("devUser") ?? request.headers.get("x-dev-user") ?? 1)
    const id = Number.isFinite(devId) && devId > 0 ? devId : 1
    return {
      auth: {
        user: { ...DEV_USER, id, first_name: id === 1 ? "Dev" : `Dev ${id}` },
        isAdmin: true,
        dev: true,
      },
    }
  }

  return { auth: null, reason }
}
