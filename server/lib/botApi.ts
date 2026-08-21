import { createHash } from "node:crypto"
import { env } from "./env.js"

/**
 * Telegram Bot API bilan ishlash uchun minimal qatlam.
 *
 * Kutubxona qo'shmadik: bizga bor-yo'g'i bir nechta metod kerak, ular ham
 * oddiy POST so'rovlar. Kamroq bog'liqlik — kamroq muammo.
 */

const API = "https://api.telegram.org"

export interface TgResponse<T> {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
}

export async function callBot<T = unknown>(
  method: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!env.botToken) throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan")

  const res = await fetch(`${API}/bot${env.botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const json = (await res.json()) as TgResponse<T>
  if (!json.ok) {
    throw new Error(`Telegram ${method}: ${json.description ?? res.status}`)
  }
  return json.result as T
}

/**
 * Webhook uchun maxfiy kalit.
 *
 * Telegram uni har so'rovda `X-Telegram-Bot-Api-Secret-Token` sarlavhasida
 * qaytaradi — shu bilan so'rov haqiqatan Telegram'dan kelganini bilamiz.
 * Kalitni bot tokenidan hosil qilamiz: alohida o'zgaruvchi saqlash shart
 * emas, sozlash skripti va server bir xil qiymatni mustaqil hisoblaydi.
 */
export function webhookSecret(): string {
  return createHash("sha256").update(`${env.botToken}:webhook:v1`).digest("hex").slice(0, 48)
}

/**
 * Joriy tokenning qisqa belgisi — keshlarni tokenga bog'lash uchun.
 *
 * Tokenning o'zini saqlab yurmaymiz: kesh globalda turadi va u yerda maxfiy
 * qiymat yotishining hojati yo'q.
 */
export function botTokenId(): string {
  return createHash("sha256").update(`${env.botToken}:id:v1`).digest("hex").slice(0, 16)
}

/* ------------------------------------------------------------- metodlar */

export interface BotUser {
  id: number
  username?: string
  first_name: string
}

export const getMe = () => callBot<BotUser>("getMe")

export interface SendMessageOptions {
  chatId: number
  text: string
  /** Ilovani ochadigan tugma */
  webAppButton?: { text: string; url: string }
  parseMode?: "HTML" | "MarkdownV2"
}

export function sendMessage(opts: SendMessageOptions) {
  return callBot("sendMessage", {
    chat_id: opts.chatId,
    text: opts.text,
    parse_mode: opts.parseMode ?? "HTML",
    link_preview_options: { is_disabled: true },
    ...(opts.webAppButton && {
      reply_markup: {
        inline_keyboard: [
          [{ text: opts.webAppButton.text, web_app: { url: opts.webAppButton.url } }],
        ],
      },
    }),
  })
}

/** Chat pastidagi menyu tugmasini ilovaga bog'laydi. */
export function setMenuButton(url: string, text = "Darslar") {
  return callBot("setChatMenuButton", {
    menu_button: { type: "web_app", text, web_app: { url } },
  })
}

export function setCommands(commands: { command: string; description: string }[]) {
  return callBot("setMyCommands", { commands })
}

export function setWebhook(url: string) {
  return callBot("setWebhook", {
    url,
    secret_token: webhookSecret(),
    allowed_updates: ["message"],
    drop_pending_updates: true,
  })
}

export function deleteWebhook() {
  return callBot("deleteWebhook", { drop_pending_updates: true })
}

export interface WebhookInfo {
  url: string
  pending_update_count: number
  last_error_message?: string
  last_error_date?: number
}

export const getWebhookInfo = () => callBot<WebhookInfo>("getWebhookInfo")
