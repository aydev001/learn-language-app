import OpenAI from "openai"
import { env } from "../env"
import type { TtsProvider } from "./types"

/**
 * Modelga uslub ko'rsatmasi.
 *
 * Tezlikni pasaytirmaymiz: o'quvchi so'zni haqiqiy nutqda qanday yangrasa
 * shunday eshitishi kerak. Modeldan faqat aniq artikulyatsiya va urg'uni
 * tabiiy ravishda ajratib aytishni so'raymiz.
 */
const TEACHER_INSTRUCTIONS =
  "You are a calm, friendly Russian teacher speaking to an Uzbek beginner. " +
  "Speak at a natural, conversational pace — do not slow down or over-enunciate. " +
  "Keep the stressed syllable of each word naturally prominent, as a native speaker would."

/**
 * OpenAI TTS.
 *
 * Narx audio davomiyligi bo'yicha (~$0.015/daqiqa) — Google'dan qimmatroq,
 * lekin ovozi tabiiyroq.
 */
class OpenAiTts implements TtsProvider {
  readonly name = "openai"
  private client: OpenAI | null = null

  isConfigured() {
    return env.openaiKey.length > 0
  }

  async speak(text: string): Promise<Buffer> {
    if (!this.isConfigured()) throw new Error("OPENAI_API_KEY o'rnatilmagan")

    this.client ??= new OpenAI({ apiKey: env.openaiKey, maxRetries: 2, timeout: 60_000 })

    const response = await this.client.audio.speech.create({
      model: env.ttsModel,
      voice: env.ttsVoice,
      input: text,
      instructions: TEACHER_INSTRUCTIONS,
      response_format: "mp3",
    } as Parameters<OpenAI["audio"]["speech"]["create"]>[0])

    return Buffer.from(await response.arrayBuffer())
  }
}

export const openaiTts = new OpenAiTts()
