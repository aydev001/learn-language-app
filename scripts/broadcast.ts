/**
 * O'quvchilarga xabar yuboradi — yangi dars yoki yangi imkoniyat haqida.
 *
 *   npm run broadcast -- lesson-04 --test    -- faqat adminlarga (sinov)
 *   npm run broadcast -- lesson-04           -- bazadagi barcha o'quvchilarga
 *   npm run broadcast -- lesson-04 --dry     -- hech kimga yubormay, matnni ko'rsatadi
 *   npm run broadcast -- kino --test         -- e'lon (dars emas), sinov
 *
 * Avval `--test` bilan o'zingizga yuborib ko'ring: Telegramda xabar qanday
 * ko'rinishini tekshirgach, bayroqsiz qayta ishga tushiring.
 *
 * Argument dars id'si bo'lsa dars e'loni yasaladi, aks holda pastdagi
 * `NOTES` dan tayyor e'lon olinadi.
 */
import { config } from "dotenv"

config({ quiet: true })

interface Note {
  text: string
  /** Xabar ostidagi tugma yozuvi */
  button: string
  /** Tugma ochadigan ichki manzil, masalan "/rooms" */
  path?: string
}

/**
 * Tayyor e'lonlar.
 *
 * Dars e'loni har safar boshqacha (nomi, muddati), shuning uchun u koddan
 * yasaladi. Imkoniyat haqidagi e'lon esa bir martalik matn — uni shu yerda
 * ko'rib chiqib, tuzatib, keyin yuborish qulay.
 */
const NOTES: Record<string, Note> = {
  oylar: {
    button: "📚 Bugungi darsni ochish",
    path: "/lesson/lesson-13",
    text: [
      "📅 Darslar endi <b>oylar bo'yicha</b> guruhlangan: 1-oyga 3 ta yangi dars qo'shildi, 2-oy boshlandi.",
      "",
      "📚 <b>Bugungi dars:</b> «Забавная история»",
      "⏰ Muddat: bugun 23:00 gacha",
    ].join("\n"),
  },
  kino: {
    button: "🍿 Kino bo'limini ochish",
    path: "/rooms",
    text: [
      "🍿 <b>Yangi: do'stingiz bilan birga kino ko'rish</b>",
      "",
      "Ilovada «Kino» bo'limi ochildi. YouTube havolasini qo'yasiz, do'stingizni taklif qilasiz — va kino <b>ikkalangizda bir vaqtda</b> ketadi.",
      "",
      "Kim to'xtatsa — ikkalangizda to'xtaydi. Kim oldinga sursa — ikkalangizda suriladi. Sekundigacha bir xil joyda turadi.",
      "",
      "🎙 <b>Ovozli suhbat ham bor.</b> Mikrofon tugmasini bosasiz va bir-biringizni eshitasiz — telefonda gaplashgandek. Kimdir gapirsa kino ovozi o'zi pasayadi, gap tugagach yana ko'tariladi. Yozishni afzal ko'rsangiz — yonida chat turadi.",
      "",
      "<b>Qanday boshlanadi:</b>",
      "1️⃣ «Kino» bo'limiga kiring",
      "2️⃣ YouTube havolasini qo'yib, uy oching",
      "3️⃣ Havolani do'stingizga yuboring — u so'rov yuboradi, siz tasdiqlaysiz",
      "",
      "💡 Rus tilidagi multfilm yoki qo'shiqni birga ko'ring va ko'rganingizni rus tilida muhokama qiling — bu darsdan kam foyda bermaydi.",
      "",
      "🎧 Ovoz tiniq chiqishi uchun naushnik kiying.",
    ].join("\n"),
  },
}

async function main() {
  const args = process.argv.slice(2)
  const target = args.find((a) => !a.startsWith("--"))
  const test = args.includes("--test")
  const dry = args.includes("--dry")

  const { getLessonById } = await import("../server/content/lessons.js")
  const { getStore } = await import("../server/lib/db.js")
  const bot = await import("../server/lib/botApi.js")
  const { env } = await import("../server/lib/env.js")

  if (!target) {
    console.error(
      "✗ Nima yuborilishi ko'rsatilmagan.\n" +
        `  Dars:  npm run broadcast -- lesson-04 --test\n` +
        `  E'lon: npm run broadcast -- ${Object.keys(NOTES).join("|")} --test`,
    )
    process.exit(1)
  }

  const lesson = getLessonById(target)
  const note = NOTES[target]

  if (!lesson && !note) {
    console.error(`✗ '${target}' topilmadi — na dars, na e'lon.`)
    process.exit(1)
  }

  const appUrl = env.publicUrl
  const text = lesson ? announcement(lesson.id, lesson.title, lesson.dueAt) : note.text
  const buttonUrl = appUrl ? `${appUrl}${lesson ? "" : (note.path ?? "")}` : ""
  const button = buttonUrl
    ? { text: lesson ? "📚 Darslarni ochish" : note.button, url: buttonUrl }
    : undefined

  console.log(
    lesson ? `\n  Dars       ${lesson.id} — ${lesson.titleUz}` : `\n  E'lon      ${target}`,
  )
  console.log(`  Tugma      ${buttonUrl || "sozlanmagan (tugmasiz yuboriladi)"}`)
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
