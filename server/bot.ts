import { sendMessage } from "./lib/botApi.js"
import { env } from "./lib/env.js"

/**
 * Bot mantiqi — juda ixcham.
 *
 * Bot faqat bitta ish qiladi: o'quvchini ilovaga kiritadi. Butun ta'lim
 * jarayoni Mini App ichida bo'lgani uchun bu yerda murakkab dialog kerak emas.
 */

interface TelegramMessage {
  message_id: number
  from?: { id: number; first_name: string; username?: string }
  chat: { id: number; type: string }
  text?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

/** Mini App manzili — webhook o'rnatilganda saqlanadi. */
function appUrl(): string {
  return env.publicUrl
}

const WELCOME = (name: string) =>
  `Assalomu alaykum, <b>${escapeHtml(name)}</b>! 👋\n\n` +
  `Bu yerda rus tilidagi uy vazifangizni bajarasiz:\n\n` +
  `🎤 <b>O'qish va urg'u</b> — matnni ovoz chiqarib o'qiysiz, ilova urg'ularingizni ` +
  `tahlil qilib, xatolarni ovoz bilan tushuntiradi.\n\n` +
  `🃏 <b>So'zlarni yodlash</b> — kartochkalar, tezlik testi va gapda ishlatish mashqlari. ` +
  `To'plagan ballaringiz umumiy reytingga tushadi.\n\n` +
  `Boshlash uchun pastdagi tugmani bosing 👇`

const HELP =
  `<b>Qanday ishlaydi?</b>\n\n` +
  `1. Tugmani bosib ilovani oching\n` +
  `2. Bugungi vazifani tanlang\n` +
  `3. Matnni ovoz chiqarib o'qing — mikrofonga ruxsat bering\n` +
  `4. So'zlarni tezlik testida mustahkamlang\n\n` +
  `Muammo bo'lsa o'qituvchingizga murojaat qiling.`

/** Kiruvchi yangilanishni qayta ishlaydi. Javob qaytarmaydi — xatolarni yutadi. */
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message
  if (!message?.text || message.chat.type !== "private") return

  const chatId = message.chat.id
  const name = message.from?.first_name ?? "o'quvchi"
  const command = message.text.trim().split(/[\s@]/)[0].toLowerCase()

  const url = appUrl()
  const button = url ? { text: "📚 Darslarni ochish", url } : undefined

  try {
    switch (command) {
      case "/start":
        await sendMessage({ chatId, text: WELCOME(name), webAppButton: button })
        break

      case "/help":
        await sendMessage({ chatId, text: HELP, webAppButton: button })
        break

      default:
        await sendMessage({
          chatId,
          text: "Darslarni ochish uchun /start buyrug'ini yuboring.",
          webAppButton: button,
        })
    }
  } catch (err) {
    // Foydalanuvchi botni bloklagan bo'lishi mumkin — bu xato emas.
    console.error("[bot] javob yuborilmadi:", err instanceof Error ? err.message : err)
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
