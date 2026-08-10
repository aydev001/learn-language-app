import { handle } from "hono/vercel"
import app from "../server/app"

/**
 * Vercel'dagi yagona kirish nuqtasi — barcha /api/* so'rovlari shu yerga tushadi.
 * Whisper + model tahlili bir necha soniya olishi mumkin.
 */
export const config = {
  runtime: "nodejs",
  maxDuration: 60,
}

export default handle(app)
