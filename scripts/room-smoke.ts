/**
 * Kino uyi API'sining uchidan-uchiga sinovi — brauzersiz.
 *
 * Hono ilovasini to'g'ridan-to'g'ri chaqiradi va ikki foydalanuvchi
 * (uy egasi va mehmon) o'rtasidagi butun oqimni bosib chiqadi:
 * uy yaratish, so'rov, tasdiq, sinxron holat, chat va boshqaruv qulfi.
 *
 *   npm run test:rooms
 *
 * Baza ishlatilmaydi: `MONGODB_URI` bo'shatiladi, ya'ni xotiradagi zaxira
 * do'kon ishlaydi va haqiqiy ma'lumotlarga tegilmaydi.
 */
import { config } from "dotenv"

config({ quiet: true })

// Sinov ma'lumotlari haqiqiy bazaga tushmasin.
process.env.MONGODB_URI = ""
// Telegram imzosi o'rniga soxta foydalanuvchi (`X-Dev-User`).
process.env.ALLOW_DEV_USER = "1"
process.env.NODE_ENV = "development"
process.env.VERCEL_ENV = ""
// Bot xabarlari yuborilmasin.
process.env.TELEGRAM_BOT_TOKEN = ""

const { default: app } = await import("../server/app.js")

/** Sinovda ishlatiladigan video — YouTube'ning o'z namunasi. */
const VIDEO_URL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ"

const OWNER = "1"
const GUEST = "2"

let failures = 0

function check(label: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}`)
  if (!ok) {
    failures++
    if (detail !== undefined) console.log("     ", JSON.stringify(detail))
  }
}

async function call<T>(
  method: string,
  path: string,
  user: string,
  body?: unknown,
): Promise<{ status: number; body: T }> {
  const res = await app.request(`/api${path}`, {
    method,
    headers: {
      "X-Dev-User": user,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    // Xato javobi HTML bo'lishi mumkin — o'shanda matnning o'zini ko'rsatamiz.
    parsed = text
  }
  return { status: res.status, body: parsed as T }
}

const get = <T,>(path: string, user: string) => call<T>("GET", path, user)
const post = <T,>(path: string, user: string, body?: unknown) =>
  call<T>("POST", path, user, body ?? {})

async function main() {
  console.log("\nKino uyi — API sinovi\n")

  /* --- 1. uy yaratish --- */

  const created = await post<{ code: string; inviteUrl: string }>("/rooms", OWNER, {
    url: VIDEO_URL,
  })
  check("uy yaratildi", created.status === 200 && Boolean(created.body.code), created.body)

  const code = created.body.code
  if (!code) {
    console.log("\nUy yaratilmadi — davom etib bo'lmaydi.\n")
    process.exit(1)
  }
  console.log(`     kod: ${code}`)

  const badUrl = await post<{ message: string }>("/rooms", OWNER, { url: "shunchaki matn" })
  check("noto'g'ri havola rad etildi", badUrl.status === 400, badUrl.body)

  /* --- 2. mehmon hali a'zo emas --- */

  const guestFirst = await get<{ access: string; state?: unknown }>(
    `/rooms/${code}/sync`,
    GUEST,
  )
  check(
    "mehmon uyni ko'radi, lekin ichkariga kira olmaydi",
    guestFirst.body.access === "none" && guestFirst.body.state === undefined,
    guestFirst.body,
  )

  const sneak = await post(`/rooms/${code}/messages`, GUEST, { text: "salom" })
  check("a'zo bo'lmagan odam yoza olmaydi", sneak.status === 403, sneak.body)

  /* --- 3. so'rov va tasdiq --- */

  const join = await post<{ access: string }>(`/rooms/${code}/join`, GUEST)
  check("kirish so'rovi yuborildi", join.body.access === "pending", join.body)

  const ownerSees = await get<{ pending: { userId: number }[] }>(`/rooms/${code}/sync`, OWNER)
  check(
    "uy egasi so'rovni ko'rdi",
    ownerSees.body.pending?.some((p) => p.userId === 2),
    ownerSees.body.pending,
  )

  const guestPending = await get<{ access: string }>(`/rooms/${code}/sync`, GUEST)
  check("mehmon «kutilmoqda» holatida", guestPending.body.access === "pending")

  const approve = await post(`/rooms/${code}/members/2`, OWNER, { action: "approve" })
  check("tasdiqlandi", approve.status === 200, approve.body)

  const guestIn = await get<{ access: string; members: unknown[]; state: { videoId: string } }>(
    `/rooms/${code}/sync`,
    GUEST,
  )
  check(
    "mehmon uyga kirdi va videoni ko'ryapti",
    guestIn.body.access === "member" &&
      guestIn.body.members.length === 2 &&
      guestIn.body.state.videoId === "aqz-KE-bpKQ",
    guestIn.body,
  )

  /* --- 4. video sinxroni --- */

  const play = await post<{ state: { isPlaying: boolean; positionSec: number; stateAt: number } }>(
    `/rooms/${code}/state`,
    OWNER,
    { isPlaying: true, positionSec: 42 },
  )
  check("uy egasi videoni yoqdi", play.body.state?.isPlaying === true, play.body)

  const guestState = await get<{ state: { isPlaying: boolean; positionSec: number } }>(
    `/rooms/${code}/sync`,
    GUEST,
  )
  check(
    "mehmonga holat yetib bordi (42-soniya, o'ynayapti)",
    guestState.body.state.isPlaying && guestState.body.state.positionSec === 42,
    guestState.body.state,
  )

  const guestPause = await post<{ state: { isPlaying: boolean } }>(
    `/rooms/${code}/state`,
    GUEST,
    { isPlaying: false, positionSec: 55 },
  )
  check("qulf ochiq — mehmon ham to'xtata oladi", guestPause.body.state?.isPlaying === false)

  /* --- 5. boshqaruv qulfi --- */

  await post(`/rooms/${code}/control`, OWNER, { locked: true })
  const blocked = await post(`/rooms/${code}/state`, GUEST, { isPlaying: true, positionSec: 60 })
  check("qulf yopiq — mehmonga ruxsat yo'q", blocked.status === 403, blocked.body)

  const lockOwner = await post(`/rooms/${code}/state`, OWNER, { isPlaying: true, positionSec: 60 })
  check("qulf yopiq — uy egasi boshqaraveradi", lockOwner.status === 200)

  const guestLock = await post(`/rooms/${code}/control`, GUEST, { locked: false })
  check("mehmon qulfni o'zgartira olmaydi", guestLock.status === 403)

  await post(`/rooms/${code}/control`, OWNER, { locked: false })

  /* --- 6. chat --- */

  const before = Date.now()
  const sent = await post<{ message: { text: string; at: number } }>(
    `/rooms/${code}/messages`,
    GUEST,
    { text: "Bu kino zo'r ekan!" },
  )
  check("mehmon xabar yozdi", sent.body.message?.text === "Bu kino zo'r ekan!", sent.body)

  const inbox = await get<{ messages: { text: string }[] }>(
    `/rooms/${code}/sync?msgSince=${before - 1}`,
    OWNER,
  )
  check(
    "xabar uy egasiga yetdi",
    inbox.body.messages?.some((m) => m.text === "Bu kino zo'r ekan!"),
    inbox.body.messages,
  )

  const future = await get<{ messages: unknown[] }>(
    `/rooms/${code}/sync?msgSince=${Date.now() + 1000}`,
    OWNER,
  )
  check("kursordan keyin eski xabarlar qaytmaydi", future.body.messages?.length === 0)

  const empty = await post(`/rooms/${code}/messages`, OWNER, { text: "   " })
  check("bo'sh xabar rad etildi", empty.status === 400)

  /* --- 7. ro'yxat --- */

  const list = await get<{ code: string; memberCount: number; isOwner: boolean }[]>(
    "/rooms",
    OWNER,
  )
  const row = list.body.find((r) => r.code === code)
  check("uy ro'yxatda ko'rinadi", row?.isOwner === true && row?.memberCount === 2, list.body)

  /* --- 8. kinoni almashtirish --- */

  const guestSwap = await post(`/rooms/${code}/video`, GUEST, { url: VIDEO_URL })
  check("mehmon kinoni almashtira olmaydi", guestSwap.status === 403)

  const swap = await post<{ state: { videoId: string } }>(`/rooms/${code}/video`, OWNER, {
    url: "https://youtu.be/dQw4w9WgXcQ?t=30",
  })
  check("uy egasi kinoni almashtirdi", swap.body.state?.videoId === "dQw4w9WgXcQ", swap.body)

  /* --- 9. chiqarish va yopish --- */

  const kick = await post(`/rooms/${code}/members/2`, OWNER, { action: "block" })
  check("mehmon bloklandi", kick.status === 200)

  const afterBlock = await get<{ access: string }>(`/rooms/${code}/sync`, GUEST)
  check("bloklangan odam ichkariga kira olmaydi", afterBlock.body.access === "blocked")

  const rejoin = await post<{ access: string }>(`/rooms/${code}/join`, GUEST)
  check("bloklangan odam qayta so'rov yubora olmaydi", rejoin.body.access === "blocked")

  const missing = await get(`/rooms/yoqbunday/sync`, OWNER)
  check("mavjud bo'lmagan uy — 404", missing.status === 404)

  const close = await post(`/rooms/${code}/close`, OWNER)
  check("uy yopildi", close.status === 200)

  const afterClose = await get<{ closed: boolean }>(`/rooms/${code}/sync`, OWNER)
  check("yopilgan uy shunday belgilanadi", afterClose.body.closed === true)

  /* --- xulosa --- */

  console.log(
    failures === 0
      ? "\n✓ Hammasi joyida.\n"
      : `\n✗ ${failures} ta tekshiruv o'tmadi.\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error("\n✗", err)
  process.exit(1)
})
