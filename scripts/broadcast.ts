/**
 * Yangi dars haqida o'quvchilarga xabar yuboradi.
 *
 *   npm run broadcast -- lesson-04 --test    -- faqat adminlarga (sinov)
 *   npm run broadcast -- lesson-04           -- bazadagi barcha o'quvchilarga
 *   npm run broadcast -- lesson-04 --dry     -- hech kimga yubormay, matnni ko'rsatadi
 *
 * Avval `--test` bilan o'zingizga yuborib ko'ring: Telegramda xabarni
 * qanday ko'rinishini tekshirgach, bayroqsiz qayta ishga tushiring.
 */
import { config } from "dotenv"

config({ quiet: true })

async function main() {
  const args = process.argv.slice(2)
  const lessonId = args.find((a) => !a.startsWith("--"))
  const test = args.includes("--test")
  const dry = args.includes("--dry")

  const { getLessonById } = await import("../server/content/lessons.js")
  const { getStore } = await import("../server/lib/db.js")
  const bot = await import("../server/lib/botApi.js")
  const { env } = await import("../server/lib/env.js")

  if (!lessonId) {
    console.error("✗ Dars id'si ko'rsatilmagan.\n  Foydalanish: npm run broadcast -- lesson-04 --test")
    process.exit(1)
  }

  const lesson = getLessonById(lessonId)
  if (!lesson) {
    console.error(`✗ '${lessonId}' topilmadi.`)
    process.exit(1)
  }

  const text = announcement(lesson.id, lesson.title, lesson.dueAt)
  const url = env.publicUrl
  const button = url ? { text: "📚 Darslarni ochish", url } : undefined

  console.log(`\n  Dars       ${lesson.id} — ${lesson.titleUz}`)
  console.log(`  Ilova      ${url || "sozlanmagan (tugmasiz yuboriladi)"}`)
  console.log(`\n  ── xabar ──\n${text.replace(/^/gm, "  ")}\n  ───────────\n`)

  /* --- kimga --- */
  let chatIds: number[]
  if (test) {
    chatIds = env.adminIds
    if (!chatIds.length) {
      console.error("✗ .env da ADMIN_TELEGRAM_IDS yo'q — sinov uchun kim kerakligi noma'lum.")
      process.exit(1)
    }
    console.log(`  Sinov rejimi: ${chatIds.length} ta adminga yuboriladi.\n`)
  } else {
    const store = await getStore()
    if (store.ephemeral) {
      console.error("✗ Baza ulanmagan (xotira rejimi) — o'quvchilar ro'yxati bo'sh bo'lardi.")
      process.exit(1)
    }
    chatIds = (await store.users.find({})).map((u) => u._id)
    console.log(`  ${chatIds.length} ta o'quvchiga yuboriladi.\n`)
  }

  if (dry) {
    console.log("  --dry: hech narsa yuborilmadi.\n")
    process.exit(0)
  }

  /* --- yuborish --- */
  let sent = 0
  const failed: string[] = []

  for (const chatId of chatIds) {
    try {
      await bot.sendMessage({ chatId, text, webAppButton: button })
      sent++
    } catch (err) {
      // Botni bloklagan yoki chatni o'chirgan o'quvchilar bo'ladi — bu normal.
      failed.push(`${chatId}: ${err instanceof Error ? err.message : err}`)
    }
    // Telegram guruhsiz yuborishda soniyasiga ~30 ta xabarga ruxsat beradi.
    await new Promise((r) => setTimeout(r, 40))
  }

  console.log(`  ✓ ${sent} ta yuborildi`)
  if (failed.length) {
    console.log(`  ⚠ ${failed.length} tasiga yetib bormadi:`)
    for (const f of failed) console.log(`    ${f}`)
  }
  console.log()
  process.exit(0)
}

/** Qisqa e'lon: dars nomi va muddat. Batafsili ilovaning o'zida. */
function announcement(id: string, title: string, dueAt: string): string {
  const number = Number(id.replace(/\D/g, "")) || id
  return (
    `📚 <b>${number}-dars qo'shildi:</b> «${escapeHtml(title)}»\n` +
    `⏰ Muddat: ${due(dueAt)} gacha`
  )
}

/**
 * Muddatni o'quvchi tiliga o'giradi.
 *
 * "Ertaga 23:00" — sanadan ko'ra tushunarli, lekin faqat e'lon yuborilgan
 * kuni to'g'ri bo'ladi; boshqa holatda to'liq sanani yozamiz.
 */
function due(dueAt: string): string {
  const date = new Date(dueAt)
  if (Number.isNaN(date.getTime())) return dueAt

  const tz = "Asia/Tashkent"
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: tz })
  const time = date.toLocaleTimeString("uz-UZ", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  if (day(date) === day(now)) return `bugun ${time}`
  if (day(date) === day(tomorrow)) return `ertaga ${time}`

  const full = date.toLocaleDateString("uz-UZ", { timeZone: tz, day: "numeric", month: "long" })
  return `${full}, ${time}`
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err)
  process.exit(1)
})
