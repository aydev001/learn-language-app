/**
 * Keshdan keraksiz audioni o'chiradi.
 *
 * "Keraksiz" — hozirgi dars kontentiga mos kelmaydigan har qanday yozuv:
 * eskirgan matnlar, o'zgartirilgan gaplar, olib tashlangan mashq turlari.
 * Kerakli kliplar ro'yxati `server/content/clips.ts` dan olinadi, ya'ni
 * prewarm bilan bir manbadan — kerakli audio hech qachon o'chmaydi.
 *
 *   npm run cache:prune              -- nima o'chishini ko'rsatadi
 *   npm run cache:prune -- --yes     -- haqiqatan o'chiradi
 *
 * Diqqat: murabbiy izohlari (tahlildan keyingi ovozli sharh) ham o'chadi —
 * ular dars kontentiga kirmaydi. Bu arzon: takrorlanganda qaytadan
 * sintez qilinadi va yana keshga tushadi.
 */
import { config } from "dotenv"
import { collectClips } from "../server/content/clips.js"
import { getStore } from "../server/lib/db.js"
import { cacheKeyFor, getTtsProvider } from "../server/lib/tts/index.js"

config({ quiet: true })

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2)

async function main() {
  const confirmed = process.argv.includes("--yes")

  const provider = getTtsProvider()
  if (!provider) {
    console.error(
      "✗ Ovoz xizmati sozlanmagan. Kalitsiz kesh kalitlarini hisoblab bo'lmaydi —\n" +
        "  aks holda tozalash hamma narsani o'chirib yuborardi.",
    )
    process.exit(1)
  }

  const store = await getStore()
  if (store.ephemeral) {
    console.error("✗ MongoDB ulanmagan — tozalanadigan doimiy kesh yo'q.")
    process.exit(1)
  }

  /* --- kerakli kalitlar --- */

  const clips = collectClips()
  const needed = new Set<string>()
  for (const clip of clips) {
    const key = cacheKeyFor(clip.text)
    if (key) needed.add(key)
  }

  /* --- bazadagilar --- */

  const all = await store.ttsCache.find({})
  const orphans = all.filter((doc) => !needed.has(doc._id))

  const totalBytes = all.reduce((s, d) => s + (d.bytes ?? 0), 0)
  const orphanBytes = orphans.reduce((s, d) => s + (d.bytes ?? 0), 0)

  console.log(`\nProvayder     : ${provider.name}`)
  console.log(`Kerakli klip  : ${needed.size} ta (hozirgi darslar bo'yicha)`)
  console.log(`Keshda        : ${all.length} ta, ${mb(totalBytes)} MB`)
  console.log(`Keraksiz      : ${orphans.length} ta, ${mb(orphanBytes)} MB`)

  const missing = needed.size - (all.length - orphans.length)
  if (missing > 0) {
    console.log(`\n  ℹ ${missing} ta kerakli klip hali tayyorlanmagan.`)
    console.log(`    Tozalagandan keyin: npm run prewarm -- --yes`)
  }

  if (orphans.length === 0) {
    console.log("\nKesh toza — o'chiradigan narsa yo'q.\n")
    process.exit(0)
  }

  if (!confirmed) {
    console.log(`\nHech narsa o'chirilmadi. O'chirish uchun:\n  npm run cache:prune -- --yes\n`)
    process.exit(0)
  }

  const removed = await store.ttsCache.deleteMany(orphans.map((d) => d._id))

  console.log(`\n✓ ${removed} ta yozuv o'chirildi (${mb(orphanBytes)} MB bo'shadi)`)
  console.log(`  Keshda qoldi: ${all.length - removed} ta\n`)

  process.exit(0)
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err)
  process.exit(1)
})
