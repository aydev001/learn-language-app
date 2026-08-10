/**
 * `lesson-data.txt` ni o'qib, ilova tushunadigan darsga aylantiradi.
 *
 * Manbada faqat ruscha matn va so'zlar ro'yxati bor. Ilovaga bulardan
 * tashqari urg'u belgilari, o'zbekcha tarjimalar va misol gaplar kerak —
 * ularni model to'ldiradi.
 *
 *   npm run import -- "D:/My Files/lesson-data.txt"
 *   npm run import -- <fayl> --lesson=2      # faqat bitta darsni qayta ishlash
 *   npm run import -- <fayl> --dry-run       # tahlil natijasini ko'rsatadi, model chaqirilmaydi
 *
 * Natija: server/content/lessons.data.ts (mavjud darslar saqlanadi, bir xil
 * raqamlisi almashtiriladi) va urg'uni tekshirish uchun
 * server/content/stress-review.txt
 */
import { config } from "dotenv"
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { parseLessons } from "./lib/parseLessons.js"
import { enrichLesson } from "./lib/enrich.js"
import type { Lesson } from "../shared/types.js"
import { graphemes, isStressedGrapheme, countVowels, stripStress } from "../shared/stress.js"

config({ quiet: true })

const OUT_DATA = "server/content/lessons.data.ts"
const OUT_REVIEW = "server/content/stress-review.txt"

async function main() {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith("--")) ?? "D:/My Files/lesson-data.txt"
  const dryRun = args.includes("--dry-run")
  const only = args
    .filter((a) => a.startsWith("--lesson="))
    .map((a) => Number(a.slice("--lesson=".length)))

  if (!existsSync(file)) {
    console.error(`✗ Fayl topilmadi: ${file}`)
    process.exit(1)
  }

  const raw = parseLessons(readFileSync(file, "utf8"))
  const selected = only.length ? raw.filter((l) => only.includes(l.number)) : raw

  if (!selected.length) {
    console.error("✗ Darslar topilmadi. Fayl formatini tekshiring (LESSON 1 / СЛОВА).")
    process.exit(1)
  }

  console.log(`\nManba: ${file}`)
  for (const l of selected) {
    console.log(
      `  LESSON ${l.number}${l.title ? ` "${l.title}"` : ""} — ` +
        `${l.paragraphs.length} abzats, ${l.sentences.length} gap, ${l.words.length} so'z`,
    )
  }

  if (dryRun) {
    console.log("\n--dry-run: model chaqirilmadi, hech narsa yozilmadi.\n")
    for (const l of selected) {
      console.log(`\n=== LESSON ${l.number} gaplari ===`)
      l.sentences.forEach((s, i) => console.log(`${String(i + 1).padStart(2)}. ${s}`))
    }
    return
  }

  /* --- boyitish --- */

  console.log("\nModel to'ldirmoqda (urg'u, tarjima, misollar)…\n")

  const built: Lesson[] = []
  const notCovered: string[] = []

  // Fayldagi eng katta raqamli dars — bugungi vazifa, oldingilari orqada.
  const latest = Math.max(...raw.map((l) => l.number))

  for (const lesson of selected) {
    console.log(`  LESSON ${lesson.number}`)

    const result = await enrichLesson(lesson, {
      weeksAgo: latest - lesson.number,
      hooks: {
        onStep: (label) => console.log(`    ${label} …`),
        onStressProgress: (done, total) => {
          if (done >= total) console.log(`    urg'u lug'ati: ${total} ta so'z`)
        },
      },
    })

    built.push(result.lesson)
    notCovered.push(...result.uncovered)

    console.log(
      `    tayyor: ${result.lesson.reading.sentences.length} gap, ` +
        `${result.lesson.vocabulary.length} so'z, ${result.dict.size} ta urg'u`,
    )
  }

  /* --- saqlash --- */

  const existing = await loadExisting()

  const merged = [...existing.filter((e) => !built.some((b) => b.id === e.id)), ...built].sort(
    (a, b) => a.id.localeCompare(b.id),
  )

  writeFileSync(OUT_DATA, renderDataModule(merged), "utf8")
  console.log(`\n✓ ${OUT_DATA} — ${merged.length} ta dars`)

  writeFileSync(OUT_REVIEW, buildStressReview(built), "utf8")
  console.log(`✓ ${OUT_REVIEW} — urg'uni tekshirish ro'yxati`)

  /* --- ogohlantirishlar --- */

  if (notCovered.length) {
    console.log(`
⚠ Urg'u qo'yilmagan ${notCovered.length} ta so'z:`)
    console.log(`   ${[...new Set(notCovered)].join(", ")}`)
  }

  const problems = collectProblems(built)
  if (problems.length) {
    console.log(`\n⚠ ${problems.length} ta e'tibor talab qiladigan joy:`)
    for (const p of problems.slice(0, 25)) console.log(`   ${p}`)
    if (problems.length > 25) console.log(`   … yana ${problems.length - 25} ta`)
  }

  console.log(
    `\nKeyingi qadam:\n` +
      `  1. ${OUT_REVIEW} ni ko'rib chiqing, urg'u xato bo'lsa ${OUT_DATA} da tuzating\n` +
      `  2. npm run cache:prune -- --yes\n` +
      `  3. npm run prewarm -- --yes\n`,
  )
}

/* ---------------------------------------------------------------- saqlash */

/** Avvalgi darslarni o'qiydi; fayl yo'q yoki buzuq bo'lsa — bo'sh ro'yxat. */
async function loadExisting(): Promise<Lesson[]> {
  if (!existsSync(OUT_DATA)) return []
  try {
    const mod = (await import(pathToFileURL(resolve(OUT_DATA)).href)) as {
      LESSON_DATA?: Lesson[]
    }
    return mod.LESSON_DATA ?? []
  } catch (err) {
    console.warn("⚠ Avvalgi darslarni o'qib bo'lmadi, ustiga yoziladi:", err)
    return []
  }
}

/**
 * Darslarni TypeScript modul sifatida yozadi.
 *
 * JSON emas: Node ESM'da JSON importi alohida sintaksis talab qiladi va
 * Vercel'da buziladi (u TS'ni qadoqlamasdan, kengaytmasi bilan ishga
 * tushiradi). TS modul lokal dev'da ham, serverless'da ham bir xil yuklanadi.
 */
function renderDataModule(lessons: Lesson[]): string {
  const header = [
    'import type { Lesson } from "../../shared/types.js"',
    "",
    "/**",
    " * Darslar ma'lumoti.",
    " *",
    " * BU FAYL AVTOMATIK YARATILADI — `npm run import` uni qayta yozadi.",
    " * Qo'lda tahrirlash mumkin (masalan urg'uni tuzatish uchun), lekin",
    " * keyingi importda o'zgarishlar yo'qoladi.",
    " */",
    "export const LESSON_DATA: Lesson[] = ",
  ].join("\n")

  return header + JSON.stringify(lessons, null, 2) + "\n"
}

/* ------------------------------------------------------ tekshirish yordami */

/** Har bir noyob so'zni urg'usi bilan ro'yxatga chiqaradi. */
function buildStressReview(lessons: Lesson[]): string {
  const lines: string[] = [
    "URG'UNI TEKSHIRISH",
    "",
    "Model qo'ygan urg'ular. Xato bo'lsa server/content/lessons.data.ts da tuzating.",
    "Urg'u belgisi — U+0301, urg'uli unlidan KEYIN qo'yiladi.",
    "«ё» har doim urg'uli, unga belgi qo'yilmaydi.",
    "",
  ]

  for (const lesson of lessons) {
    lines.push(`${"=".repeat(60)}`, `${lesson.id} — ${lesson.title}`, "")

    const seen = new Map<string, string>()
    const collect = (text: string) => {
      for (const token of text.split(/[^\p{L}\u0300-\u036f-]+/u)) {
        const plain = stripStress(token).toLowerCase()
        if (plain.length > 1 && !seen.has(plain)) seen.set(plain, token)
      }
    }

    for (const s of lesson.reading.sentences) collect(s.ru)
    for (const w of lesson.vocabulary) {
      collect(w.ru)
      if (w.example) collect(w.example.ru)
    }

    const sorted = [...seen.entries()].sort(([a], [b]) => a.localeCompare(b, "ru"))
    for (const [plain, marked] of sorted) {
      const flag = needsStress(marked) ? " ← URG'U YO'Q" : ""
      lines.push(`  ${marked.padEnd(24)} ${plain}${flag}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

/** Ko'p bo'g'inli so'zda urg'u belgisi yo'qmi? */
function needsStress(word: string): boolean {
  if (countVowels(word) < 2) return false
  return !graphemes(word).some(isStressedGrapheme)
}

function collectProblems(lessons: Lesson[]): string[] {
  const problems: string[] = []

  for (const lesson of lessons) {
    for (const s of lesson.reading.sentences) {
      if (!s.uz.trim()) problems.push(`${lesson.id}/${s.id}: tarjima bo'sh`)
      const missing = s.ru
        .split(/\s+/)
        .filter((w) => needsStress(w) && countVowels(w) > 1)
      if (missing.length > 2) {
        problems.push(`${lesson.id}/${s.id}: ${missing.length} so'zda urg'u yo'q`)
      }
    }
    for (const w of lesson.vocabulary) {
      if (needsStress(w.ru)) problems.push(`${lesson.id}/${w.id}: "${w.ru}" urg'usiz`)
      if (!w.example) problems.push(`${lesson.id}/${w.id}: "${stripStress(w.ru)}" misolsiz`)
    }
  }

  return problems
}

main().catch((err) => {
  console.error("\n✗", err instanceof Error ? err.message : err)
  process.exit(1)
})
