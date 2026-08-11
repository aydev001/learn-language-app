import { handle } from "hono/vercel"
import app from "../server/app.js"

/**
 * Vercel'dagi yagona kirish nuqtasi — barcha /api/* so'rovlari shu yerga tushadi.
 * Whisper + model tahlili bir necha soniya olishi mumkin.
 *
 * Fayl nomi ilgari `[[...route]].ts` edi, lekin Vercel uni catch-all deb emas,
 * oddiy bitta segmentli dinamik marshrut deb qabul qilgan: /api/health ishlagan,
 * /api/telegram/webhook esa platformaning o'zidan 404 olgan (shuning uchun bot
 * javob bermasdi). Endi marshrutlash vercel.json dagi aniq rewrite orqali:
 *
 *   { "source": "/api/(.*)", "destination": "/api" }
 */
export const config = {
  runtime: "nodejs",
  maxDuration: 60,
}

/**
 * `handle(app)` — web handler, ya'ni `(Request) => Response`.
 *
 * Uni `export default` qilib bo'lmaydi: Vercel'ning Node launcher'i avval
 * `fetch`/`GET`/`POST`... nomli eksportlarni qidiradi, topmasa default
 * eksportni Node uslubidagi `(req, res)` handler deb chaqiradi. U holda
 * qaytgan `Response` hech qayerga yozilmaydi, `res.end()` bo'lmaydi va
 * so'rov FUNCTION_INVOCATION_TIMEOUT bilan tugaydi (lokalda bilinmaydi —
 * u yerda @hono/vite-dev-server app'ni to'g'ridan-to'g'ri chaqiradi).
 *
 * Launcher default eksportni "ochib" ko'rgani uchun (`mod.default`), nomli
 * eksportlar default bilan birga ishlamaydi — shuning uchun default o'zi
 * `fetch` saqlagan obyekt bo'ladi. Nomli eksportlar esa default'ni ochmaydigan
 * boshqa yo'llar uchun zaxira.
 */
const handler = handle(app)

export const GET = handler
export const HEAD = handler
export const OPTIONS = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler

export default { fetch: handler }
