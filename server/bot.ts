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
  `🍿 <b>Birga kino ko'rish</b> — do'stingizni "uy"ingizga taklif qilib, ` +
  `YouTube'dagi kinoni bir vaqtda ko'rasiz va yozishib turasiz.\n\n` +
  `Boshlash uchun pastdagi tugmani bosing 👇`

/**
 * Taklif havolasi (`t.me/bot?start=room_...`) bosilganda ko'rinadigan xabar.
 *
 * Do'stga to'g'ridan-to'g'ri ilova havolasini yuborib bo'lmaydi: u brauzerda
 * ochilsa Telegram imzosi bo'lmaydi va odam tanilmaydi. Shuning uchun havola
 * botga olib keladi, bot esa ilovani ochadigan tugma beradi.
 */
const ROOM_INVITE =
  `🍿 <b>Sizni birga kino ko'rishga taklif qilishdi!</b>\n\n` +
  `Tugmani bosing — uy egasiga kirish so'rovi boradi. U tasdiqlashi bilan ` +
  `kino ikkalangizda bir vaqtda ketadi va yozishib turishingiz mumkin.`

const HELP =
  `<b>Qanday ishlaydi?</b>\n\n` +
  `1. Tugmani bosib ilovani oching\n` +
  `2. Bugungi vazifani tanlang\n` +
  `3. Matnni ovoz chiqarib o'qing — mikrofonga ruxsat bering\n` +
  `4. So'zlarni tezlik testida mustahkamlang\n\n` +
  `<b>Birga kino ko'rish</b>\n\n` +
  `1. Ilovadagi «Kino» bo'limiga kiring\n` +
  `2. YouTube havolasini qo'yib, uy yarating\n` +
  `3. Taklif havolasini do'stingizga yuboring\n` +
  `4. U so'rov yuboradi, siz tasdiqlaysiz — kino ikkalangizda birga ketadi\n\n` +
  `Muammo bo'lsa o'qituvchingizga murojaat qiling.`

/** Kiruvchi yangilanishni qayta ishlaydi. Javob qaytarmaydi — xatolarni yutadi. */
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message
  if (!message?.text || message.chat.type !== "private") return

  const chatId = message.chat.id
  const name = message.from?.first_name ?? "o'quvchi"
  const text = message.text.trim()
  const command = text.split(/[\s@]/)[0].toLowerCase()
  // `/start room_abc123` — kino uyiga taklif havolasi orqali kelgan odam.
  const payload = text.slice(command.length).trim()

  const url = appUrl()
  const button = url ? { text: "📚 Darslarni ochish", url } : undefined

  try {
    switch (command) {
      case "/start": {
        const roomCode = /^room_([a-z0-9]{4,12})$/i.exec(payload)?.[1]?.toLowerCase()
        if (roomCode) {
          await sendMessage({
            chatId,
            text: ROOM_INVITE,
            webAppButton: url
              ? { text: "🍿 Uyga kirish", url: `${url}/room/${roomCode}` }
              : undefined,
          })
          break
        }

        await sendMessage({ chatId, text: WELCOME(name), webAppButton: button })
        break
      }

      case "/kino":
        await sendMessage({
          chatId,
          text:
            `🍿 <b>Birga kino ko'rish</b>\n\n` +
            `Uy yarating, YouTube havolasini qo'ying va do'stingizni taklif qiling. ` +
            `Kino ikkalangizda bir vaqtda ketadi.`,
          webAppButton: url ? { text: "🍿 Kino bo'limi", url: `${url}/rooms` } : undefined,
        })
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
