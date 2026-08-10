/**
 * Botni Mini App'ga ulaydi: webhook, menyu tugmasi va buyruqlar.
 *
 *   npm run tg:setup -- https://xxx.trycloudflare.com
 *   npm run tg:setup                  -- .env dagi PUBLIC_APP_URL ishlatiladi
 *   npm run tg:status                 -- hozirgi holatni ko'rsatadi
 *   npm run tg:setup -- --off         -- webhook'ni o'chiradi
 *
 * Tunnel manzili har safar o'zgargani uchun skriptni qayta ishga tushiring —
 * u .env dagi PUBLIC_APP_URL ni ham yangilab qo'yadi.
 */
import { config } from "dotenv"
import { readFileSync, writeFileSync, existsSync } from "node:fs"

config({ quiet: true })

async function main() {
  const args = process.argv.slice(2)
  const off = args.includes("--off")
  const statusOnly = args.includes("--status")
  const urlArg = args.find((a) => a.startsWith("https://"))

  // .env ni yangilagandan keyingina modullarni yuklaymiz — ular env ni
  // import paytida o'qiydi.
  if (urlArg) saveUrl(urlArg)
  if (urlArg) process.env.PUBLIC_APP_URL = urlArg.replace(/\/+$/, "")

  const bot = await import("../server/lib/botApi")
  const { env } = await import("../server/lib/env")

  if (!env.botToken) {
    console.error("✗ .env da TELEGRAM_BOT_TOKEN yo'q.")
    process.exit(1)
  }

  const me = await bot.getMe()
  console.log(`\n  Bot        @${me.username}`)

  /* --- holat --- */
  if (statusOnly) {
    const info = await bot.getWebhookInfo()
    console.log(`  Webhook    ${info.url || "o'rnatilmagan"}`)
    console.log(`  Navbatda   ${info.pending_update_count} ta yangilanish`)
    if (info.last_error_message) {
      const when = info.last_error_date
        ? new Date(info.last_error_date * 1000).toLocaleString()
        : ""
      console.log(`  ⚠ Oxirgi xato: ${info.last_error_message} ${when}`)
    }
    console.log(`  Ilova      ${env.publicUrl || "sozlanmagan"}\n`)
    return
  }

  /* --- o'chirish --- */
  if (off) {
    await bot.deleteWebhook()
    console.log("  Webhook o'chirildi.\n")
    return
  }

  /* --- o'rnatish --- */
  const url = env.publicUrl
  if (!url) {
    console.error(
      "✗ Ilova manzili yo'q.\n" +
        "  Foydalanish: npm run tg:setup -- https://xxx.trycloudflare.com",
    )
    process.exit(1)
  }
  if (!url.startsWith("https://")) {
    console.error("✗ Telegram faqat HTTPS manzilni qabul qiladi.")
    process.exit(1)
  }

  console.log(`  Ilova      ${url}`)

  await bot.setWebhook(`${url}/api/telegram/webhook`)
  console.log("  ✓ webhook o'rnatildi")

  await bot.setMenuButton(url, "Darslar")
  console.log("  ✓ menyu tugmasi ilovaga bog'landi")

  await bot.setCommands([
    { command: "start", description: "Darslarni ochish" },
    { command: "help", description: "Yordam" },
  ])
  console.log("  ✓ buyruqlar yangilandi")

  // Telegram xatoni darhol emas, birinchi yangilanishda ko'rsatadi.
  const info = await bot.getWebhookInfo()
  if (info.last_error_message) {
    console.log(`\n  ⚠ Oldingi xato saqlanib turibdi: ${info.last_error_message}`)
    console.log("    Botga /start yozib tekshiring, keyin: npm run tg:status")
  }

  console.log(`\n  Tayyor. Telegramda @${me.username} ni oching va /start yuboring.\n`)
}

/** PUBLIC_APP_URL ni .env ichida yangilaydi (yoki qo'shadi). */
function saveUrl(rawUrl: string) {
  const url = rawUrl.replace(/\/+$/, "")
  const path = ".env"
  if (!existsSync(path)) return

  const content = readFileSync(path, "utf8")
  const line = `PUBLIC_APP_URL=${url}`

  const updated = /^PUBLIC_APP_URL=.*$/m.test(content)
    ? content.replace(/^PUBLIC_APP_URL=.*$/m, line)
    : `${content.trimEnd()}\n\n# Ilovaning tashqi HTTPS manzili (bot shu havolani yuboradi)\n${line}\n`

  writeFileSync(path, updated, "utf8")
  console.log(`  .env yangilandi: PUBLIC_APP_URL`)
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err)
  process.exit(1)
})
