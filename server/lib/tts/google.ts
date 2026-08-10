import { env } from "../env"
import { stripStress } from "../../../shared/stress"
import type { TtsProvider } from "./types"

const ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"

/**
 * Google Cloud Text-to-Speech.
 *
 * Autentifikatsiya oddiy API kalit orqali — service account JSON kerak emas.
 * Narx belgi bo'yicha hisoblanadi va oyiga 1M belgi bepul, shuning uchun
 * bizning qisqa matnlarimiz uchun amalda tekin.
 */
class GoogleTts implements TtsProvider {
  readonly name = "google"

  isConfigured() {
    return env.googleTtsKey.length > 0
  }

  async speak(text: string): Promise<Buffer> {
    if (!this.isConfigured()) throw new Error("GOOGLE_TTS_API_KEY o'rnatilmagan")

    const voice = env.googleTtsVoice

    const body = {
      // Urg'u belgisi (U+0301) olib tashlanadi — Google uni harf deb
      // o'qib yuborishi mumkin. To'g'ri urg'uni o'z lug'atidan qo'yadi.
      input: { text: stripStress(text) },
      voice: { languageCode: languageCodeOf(voice), name: voice },
      audioConfig: {
        audioEncoding: "MP3",
        // Tabiiy tezlik — sun'iy sekinlashtirish urg'u naqshini buzadi.
        speakingRate: 1,
        pitch: 0,
      },
    }

    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(env.googleTtsKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      throw new Error(`Google TTS xatosi ${res.status}: ${detail.slice(0, 300)}`)
    }

    const json = (await res.json()) as { audioContent?: string }
    if (!json.audioContent) throw new Error("Google TTS bo'sh javob qaytardi")

    return Buffer.from(json.audioContent, "base64")
  }
}

/** "ru-RU-Wavenet-C" -> "ru-RU" */
function languageCodeOf(voice: string): string {
  const parts = voice.split("-")
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : "ru-RU"
}

export const googleTts = new GoogleTts()
