/**
 * Shu oygi sarfni ko'rsatadi.
 *
 *   npm run usage
 */
import { config } from "dotenv"
import { getStore } from "../server/lib/db.js"
import { getTtsProvider } from "../server/lib/tts/index.js"
import { monthUsage } from "../server/lib/usage.js"
import { env } from "../server/lib/env.js"

config()

async function main() {
  const store = await getStore()
  const usage = await monthUsage(store)
  const limit = env.monthlyBudgetUsd

  const cacheDocs = await store.ttsCache.find({}).catch(() => [])
  const cacheBytes = cacheDocs.reduce((sum, d) => sum + (d.bytes ?? 0), 0)

  console.log(`\n  Oy          ${usage._id}`)
  console.log(`  Provayder   ${getTtsProvider()?.name ?? "sozlanmagan"}`)
  if (store.ephemeral) console.log(`  ⚠ MongoDB ulanmagan — raqamlar faqat shu jarayondan`)

  console.log(`\n  Ovoz o'qish  ${usage.ttsCalls} chaqiruv, ${usage.ttsChars} belgi`)
  console.log(`  Eshitish     ${usage.sttCalls} chaqiruv, ${(usage.sttMs / 60000).toFixed(1)} daqiqa`)
  console.log(`  Tahlil       ${usage.analysisCalls} chaqiruv`)

  console.log(`\n  Keshdagi audio  ${cacheDocs.length} ta, ${(cacheBytes / 1024 / 1024).toFixed(1)} MB`)

  const spent = usage.costUsd
  console.log(`\n  Sarflandi   $${spent.toFixed(3)}`)

  if (limit > 0) {
    const percent = Math.min(100, Math.round((spent / limit) * 100))
    const filled = Math.round(percent / 5)
    console.log(`  Chegara     $${limit.toFixed(2)}`)
    console.log(`  ${"█".repeat(filled)}${"░".repeat(20 - filled)} ${percent}%`)
    if (spent >= limit) console.log(`\n  ⚠ Chegara tugadi. Yangi sintez to'xtaydi, kesh ishlayveradi.`)
  } else {
    console.log(`  Chegara     o'chirilgan`)
  }

  console.log()
  process.exit(0)
}

main().catch((err) => {
  console.error("✗", err)
  process.exit(1)
})
