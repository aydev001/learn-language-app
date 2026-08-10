/**
 * Dars audiosini oldindan tayyorlab keshga soladi.
 *
 * Nega kerak: dizaynni sozlash, interfeysni sinash, sahifani o'nlab marta
 * qayta yuklash — bularning har biri ovoz so'raydi. Bir marta tayyorlab
 * qo'yilsa, keyingi hamma narsa keshdan chiqadi va pul ketmaydi.
 *
 * Skript idempotent: ikkinchi marta ishga tushirsangiz hech narsa
 * sintez qilinmaydi, faqat "keshda bor" deb hisoblaydi.
 *
 *   npm run prewarm                    -- rejani va narxni ko'rsatadi
 *   npm run prewarm -- --yes           -- haqiqatan tayyorlaydi
 *   npm run prewarm -- --yes --core    -- faqat gaplar va so'zlar (arzonroq)
 *   npm run prewarm -- --lesson l1-semya
 */
import { config } from "dotenv"
import { collectClips, type Clip } from "../server/content/clips.js"
import { getStore } from "../server/lib/db.js"
import { getTtsProvider, speak } from "../server/lib/tts/index.js"
import { estimateTtsCost, monthUsage } from "../server/lib/usage.js"

config()

/* ------------------------------------------------------- so'rov chegarasi */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const isRateLimit = (message: string) =>
  /rate.?limit|429|too many requests/i.test(message)

type Outcome = { ok: true; cached: boolean } | { ok: false; message: string }

/**
 * OpenAI so'rovlar chegarasi to'ldiriladigan chelak: bo'shasa, daqiqada
 * bir necha so'rov qayta tiklanadi. Ko'p klipni birdan tayyorlaganda chelak
 * bo'shab qoladi — shunda xato deb hisoblamasdan, kutib turib qayta urinamiz.
 */
async function synthesizeWithBackoff(clip: Clip, attempts = 5): Promise<Outcome> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const { cached } = await speak(clip.text)
      return { ok: true, cached }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      if (!isRateLimit(message) || attempt === attempts) {
        return { ok: false, message }
      }

      // 15s, 30s, 45s, 60s — chelak to'lishini kutamiz.
      await sleep(Math.min(60_000, 15_000 * attempt))
    }
  }

  return { ok: false, message: "urinishlar tugadi" }
}

/* ----------------------------------------------------------------- ishga */

async function main() {
  const args = process.argv.slice(2)
  const confirmed = args.includes("--yes")
  const core = args.includes("--core")
  const lessonIds = args
    .filter((a) => a.startsWith("--lesson="))
    .map((a) => a.slice("--lesson=".length))

  const provider = getTtsProvider()
  if (!provider) {
    console.error("✗ Ovoz xizmati sozlanmagan. .env da OPENAI_API_KEY yoki GOOGLE_TTS_API_KEY kerak.")
    process.exit(1)
  }

  const store = await getStore()
  if (store.ephemeral) {
    console.error(
      "✗ MongoDB ulanmagan. Kesh faqat xotirada bo'ladi va bu jarayon tugashi\n" +
        "  bilan yo'qoladi — tayyorlashning ma'nosi qolmaydi. .env da MONGODB_URI ni to'ldiring.",
    )
    process.exit(1)
  }

  const clips = collectClips({ lessonIds, core })

  /* --- reja --- */

  const byKind = new Map<string, number>()
  let estimate = 0
  for (const clip of clips) {
    byKind.set(clip.kind, (byKind.get(clip.kind) ?? 0) + 1)
    estimate += estimateTtsCost(clip.text)
  }

  console.log(`\nProvayder : ${provider.name}`)
  console.log(`Darslar   : ${lessonIds.length ? lessonIds.join(", ") : "hammasi"}`)
  console.log(`Rejim     : ${core ? "core (alohida so'zlarsiz)" : "to'liq"}`)
  console.log(`\nKliplar   : ${clips.length} ta`)
  for (const [kind, count] of byKind) console.log(`  ${kind.padEnd(11)} ${count}`)
  console.log(`\nTaxminiy narx (agar hammasi yangi bo'lsa): $${estimate.toFixed(3)}`)

  const before = await monthUsage(store)
  console.log(`Shu oygi sarf: $${before.costUsd.toFixed(3)}`)

  if (!confirmed) {
    console.log(`\nHech narsa qilinmadi. Tayyorlash uchun:\n  npm run prewarm -- --yes\n`)
    process.exit(0)
  }

  /* --- tayyorlash --- */

  const concurrency = Number(args.find((a) => a.startsWith("--jobs="))?.slice(7)) || 4
  console.log(`\nTayyorlanmoqda (${concurrency} ta parallel)…\n`)

  let synthesized = 0
  let cached = 0
  let failed = 0
  let done = 0
  let stop = false

  // Oddiy navbat: har bir ishchi ro'yxatdan keyingi klipni oladi.
  let next = 0
  const worker = async () => {
    while (!stop) {
      const i = next++
      if (i >= clips.length) return

      const clip = clips[i]
      const preview = clip.text.slice(0, 46).replace(/\s+/g, " ")

      const outcome = await synthesizeWithBackoff(clip)

      done++
      const position = `[${String(done).padStart(3)}/${clips.length}]`

      if (outcome.ok) {
        if (outcome.cached) cached++
        else synthesized++
        console.log(`${position} ${outcome.cached ? "· keshda" : "+ yangi "} ${preview}`)
      } else {
        failed++
        console.error(`${position} ✗ xato   ${preview}`)
        console.error(`           ${outcome.message}`)

        // Mablag' tugagan bo'lsa davom etishning ma'nosi yo'q.
        if (/byudjet|budget|credit|quota/i.test(outcome.message)) {
          stop = true
          console.error("\nMablag' chegarasiga yetildi — to'xtatildi.")
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))

  const after = await monthUsage(store)

  console.log(`\n${"─".repeat(52)}`)
  console.log(`Yangi sintez : ${synthesized}`)
  console.log(`Keshda bor   : ${cached}`)
  if (failed) console.log(`Xato         : ${failed}`)
  console.log(`Sarflandi    : $${(after.costUsd - before.costUsd).toFixed(3)}`)
  console.log(`Oylik jami   : $${after.costUsd.toFixed(3)}`)
  console.log(
    `\nEndi bu matnlar cheksiz marta bepul eshitiladi.\n` +
      `Kontentni o'zgartirsangiz skriptni qayta ishga tushiring.\n`,
  )

  process.exit(0)
}

main().catch((err) => {
  console.error("\n✗ Kutilmagan xato:", err)
  process.exit(1)
})
