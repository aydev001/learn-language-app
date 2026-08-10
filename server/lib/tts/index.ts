import { createHash } from "node:crypto"
import { env } from "../env"
import { getStore } from "../db"
import { assertWithinBudget, estimateTtsCost, recordUsage } from "../usage"
import { googleTts } from "./google"
import { openaiTts } from "./openai"
import type { TtsProvider } from "./types"

export type { TtsProvider } from "./types"

/**
 * Sozlangan provayderni qaytaradi.
 *
 * `.env` da tanlangani kalitsiz qolsa, ikkinchisiga o'tamiz — ilova
 * bitta kalit yetishmagani uchun ovozsiz qolmasin.
 */
export function getTtsProvider(): TtsProvider | null {
  const preferred = env.ttsProvider === "openai" ? openaiTts : googleTts
  if (preferred.isConfigured()) return preferred

  const fallback = preferred === googleTts ? openaiTts : googleTts
  return fallback.isConfigured() ? fallback : null
}

export function hasTts(): boolean {
  return getTtsProvider() !== null
}

/* ------------------------------------------------------------------- kesh */

/**
 * Dars matnlari hamma o'quvchi uchun bir xil, shuning uchun bir marta
 * sintez qilingan audio qayta ishlatiladi.
 *
 * Ikki qavat:
 *  1. jarayon xotirasi — eng tez, lekin server o'chsa yo'qoladi;
 *  2. MongoDB — serverless "cold start"dan keyin ham saqlanadi.
 *
 * Aynan ikkinchi qavat xarajatni keskin tushiradi: bir dars audiosi
 * umri davomida bir marta to'lanadi.
 */

const MEMORY_LIMIT = 200

const memory: Map<string, Buffer> = ((globalThis as { __lrTts?: Map<string, Buffer> }).__lrTts ??=
  new Map())

interface TtsCacheDoc {
  _id: string
  provider: string
  voice: string
  /** base64 mp3 */
  audio: string
  bytes: number
  createdAt: string
}

/**
 * Matnni yagona shaklga keltiradi.
 *
 * Kirill harflari ikki xil kodlanishi mumkin: "й" bitta belgi (U+0439) yoki
 * "и" + qisqalik belgisi (U+0438 U+0306). Ekranda farqi yo'q, lekin bайт
 * darajasida boshqa — kesh ularni ikki xil matn deb hisoblab, bir xil
 * jumlaga ikki marta pul to'lardi. NFC bu farqni yo'q qiladi.
 *
 * Ortiqcha bo'shliqlar ham shu yerda tozalanadi.
 */
export function normalizeForTts(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim()
}

function cacheKey(provider: TtsProvider, text: string): string {
  const voice = provider.name === "google" ? env.googleTtsVoice : `${env.ttsModel}:${env.ttsVoice}`
  // "n" — tabiiy tezlik. Ilgari bu yerda tezlik rejimi turgan; endi bitta
  // rejim qolgan bo'lsa-da, belgini saqlab qoldik — shunda avval to'langan
  // audio keshda yaroqli bo'lib qolaveradi.
  return createHash("sha1").update(`${provider.name}|${voice}|n|${text}`).digest("hex")
}

/**
 * Matnning kesh kaliti — `speak()` ichkarida nimani qidirishini tashqaridan
 * bilish uchun. `cache:prune` shu orqali "kerakli" kalitlar to'plamini yig'adi.
 */
export function cacheKeyFor(text: string): string | null {
  const provider = getTtsProvider()
  return provider ? cacheKey(provider, normalizeForTts(text)) : null
}

function rememberInMemory(key: string, audio: Buffer) {
  if (memory.size >= MEMORY_LIMIT) {
    const oldest = memory.keys().next().value
    if (oldest !== undefined) memory.delete(oldest)
  }
  memory.set(key, audio)
}

/**
 * Matnni ovozga aylantiradi — imkoni bo'lsa keshdan.
 *
 * Sukut bo'yicha hamma narsa keshlanadi, murabbiy izohlari ham: ular
 * o'quvchilarda tez-tez takrorlanadi ("Barakalla, hammasi to'g'ri"),
 * demak kesh to'g'ridan-to'g'ri pul tejaydi. Bir mp3 ≈ 30 KB.
 *
 * `cacheable: false` — bir martalik, hech qachon takrorlanmaydigan matnlar uchun.
 */
export async function speak(
  rawText: string,
  opts: { cacheable?: boolean } = {},
): Promise<{ audio: Buffer; cached: boolean }> {
  const provider = getTtsProvider()
  if (!provider) throw new Error("Ovoz xizmati sozlanmagan")

  // Kalit ham, sintez ham bir xil shakldagi matndan foydalanadi.
  const text = normalizeForTts(rawText)
  const cacheable = opts.cacheable ?? true
  const key = cacheKey(provider, text)

  if (cacheable) {
    const hit = memory.get(key)
    if (hit) return { audio: hit, cached: true }
  }

  const store = cacheable ? await getStore() : null

  if (store && !store.ephemeral) {
    try {
      const doc = await store.ttsCache.findOne({ _id: key })
      if (doc?.audio) {
        const audio = Buffer.from(doc.audio, "base64")
        rememberInMemory(key, audio)
        return { audio, cached: true }
      }
    } catch (err) {
      // Kesh ishlamasa ham ovoz chiqishi kerak.
      console.error("[tts] keshni o'qib bo'lmadi:", err)
    }
  }

  // Shu yerdan pastda pul ketadi — kesh'dan chiqqanlar bu yergacha kelmaydi.
  const cost = estimateTtsCost(text)
  const budgetStore = store ?? (await getStore())
  await assertWithinBudget(budgetStore, cost)

  const audio = await provider.speak(text)

  void recordUsage(budgetStore, { kind: "tts", costUsd: cost, chars: text.length })

  if (cacheable) {
    rememberInMemory(key, audio)

    if (store && !store.ephemeral) {
      // Yozilishini kutmaymiz — javob tezroq ketsin.
      void store.ttsCache
        .upsert(key, {
          set: {
            provider: provider.name,
            voice: provider.name === "google" ? env.googleTtsVoice : env.ttsVoice,
            audio: audio.toString("base64"),
            bytes: audio.byteLength,
          },
          setOnInsert: { createdAt: new Date().toISOString() },
        })
        .catch((err) => console.error("[tts] keshga yozib bo'lmadi:", err))
    }
  }

  return { audio, cached: false }
}

export type { TtsCacheDoc }
