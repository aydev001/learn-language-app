import { createHmac, timingSafeEqual } from "node:crypto"
import { env, hasBotToken } from "./env"

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
  if (!hasBotToken() || !initDataRaw) return null

  const params = new URLSearchParams(initDataRaw)
  const hash = params.get("hash")
  if (!hash) return null
  params.delete("hash")
  params.delete("signature") // Telegram'ning yangi Ed25519 imzosi — HMAC hisobiga kirmaydi

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n")

  const secret = createHmac("sha256", "WebAppData").update(env.botToken).digest()
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex")

  const a = Buffer.from(computed, "hex")
  const b = Buffer.from(hash, "hex")
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  const authDate = Number(params.get("auth_date") ?? 0)
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null

  const userJson = params.get("user")
  if (!userJson) return null

  try {
    const user = JSON.parse(userJson) as TelegramUser
    return typeof user?.id === "number" ? user : null
  } catch {
    return null
  }
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
  const header = request.headers.get("authorization") ?? ""
  const raw = header.startsWith("tma ") ? header.slice(4) : ""

  const user = verifyInitData(raw)
  if (user) {
    return { user, isAdmin: env.adminIds.includes(user.id), dev: false }
  }

  if (env.allowDevUser) {
    // Brauzerda bir nechta "foydalanuvchi"ni sinash uchun: ?devUser=5
    const url = new URL(request.url)
    const devId = Number(url.searchParams.get("devUser") ?? request.headers.get("x-dev-user") ?? 1)
    const id = Number.isFinite(devId) && devId > 0 ? devId : 1
    return {
      user: { ...DEV_USER, id, first_name: id === 1 ? "Dev" : `Dev ${id}` },
      isAdmin: true,
      dev: true,
    }
  }

  return null
}
