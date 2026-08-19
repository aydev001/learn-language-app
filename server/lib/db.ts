import { MongoClient, type Db } from "mongodb"
import { env, hasMongo } from "./env.js"
import type { VocabMode } from "../../shared/types.js"

/* ------------------------------------------------------------------ hujjatlar */

export interface UserDoc {
  _id: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  createdAt: string
  lastSeenAt: string
  /** "2026-08-10" ko'rinishidagi faol kunlar — streak hisoblash uchun */
  activeDays: string[]
}

export interface AttemptDoc {
  _id: string
  userId: number
  lessonId: string
  mode: VocabMode
  correct: number
  total: number
  durationMs: number
  score: number
  createdAt: string
}

export interface ReadingDoc {
  _id: string
  userId: number
  lessonId: string
  sentenceId: string
  accuracy: number
  wpm: number
  transcript: string
  createdAt: string
}

export interface TtsCacheDoc {
  /** sha1(provider|voice|text) */
  _id: string
  provider: string
  voice: string
  /** base64 mp3 */
  audio: string
  bytes: number
  createdAt: string
}

export interface UsageDoc {
  /** "2026-08" */
  _id: string
  ttsChars: number
  ttsCalls: number
  sttMs: number
  sttCalls: number
  analysisCalls: number
  costUsd: number
  updatedAt: string
}

/* --- kino uyi --- */

export interface RoomDoc {
  /** taklif kodi — havolada ham, url'da ham shu ishlatiladi */
  _id: string
  ownerId: number
  ownerName: string
  videoId: string
  title: string
  isPlaying: boolean
  /** `stateAt` lahzasidagi joylashuv, sekund */
  positionSec: number
  /** holat o'rnatilgan vaqt, ms */
  stateAt: number
  stateBy: number
  stateByName: string
  /** true — faqat uy egasi play/pause/seek qila oladi */
  controlLocked: boolean
  createdAt: number
  /** har qanday o'zgarish (holat, a'zolar, video) — ro'yxatni saralash uchun */
  updatedAt: number
  closed: boolean
}

export interface RoomMemberDoc {
  /** `${roomId}:${userId}` */
  _id: string
  roomId: string
  userId: number
  name: string
  username?: string
  photoUrl?: string
  status: "pending" | "approved" | "blocked"
  role: "owner" | "guest"
  requestedAt: number
  joinedAt?: number
  /** oxirgi sync so'rovi — kim hozir uyda ekanini shundan bilamiz */
  lastSeenAt: number
}

export interface RoomMessageDoc {
  /** `${roomId}:${at}:${tasodifiy}` — vaqt bo'yicha saralanadigan id */
  _id: string
  roomId: string
  userId: number
  name: string
  text: string
  at: number
  kind: "text" | "system"
}

export interface WordStatDoc {
  /** `${userId}:${lessonId}:${wordId}` */
  _id: string
  userId: number
  lessonId: string
  wordId: string
  seen: number
  correct: number
  totalMs: number
  lastAt: string
}

/* -------------------------------------------------- minimal to'plam interfeysi */

type Filter = Record<string, unknown>

export interface UpsertOps<T> {
  set?: Partial<T>
  setOnInsert?: Partial<T>
  inc?: Partial<Record<keyof T, number>>
  addToSet?: Partial<Record<keyof T, unknown>>
}

export interface Coll<T extends { _id: unknown }> {
  find(filter: Filter): Promise<T[]>
  findOne(filter: Filter): Promise<T | null>
  insertOne(doc: T): Promise<void>
  upsert(id: T["_id"], ops: UpsertOps<T>): Promise<void>
  /** Berilgan id'lar bo'yicha o'chiradi, o'chirilganlar sonini qaytaradi. */
  deleteMany(ids: T["_id"][]): Promise<number>
}

/**
 * MongoDB bitta maydonni ikki operator bilan o'zgartirishga ruxsat bermaydi
 * (masalan `$setOnInsert` va `$inc` bir vaqtda) — "would create a conflict"
 * xatosi chiqadi.
 *
 * Xotira rejimi bunga befarq, shuning uchun xato faqat production'da
 * ko'rinardi. Tekshiruvni ikkala yo'lda ham bajarib, farqni yo'qotamiz.
 */
function assertNoConflicts<T>(ops: UpsertOps<T>): void {
  const seen = new Map<string, string>()

  for (const [operator, payload] of Object.entries(ops)) {
    if (!payload) continue
    for (const field of Object.keys(payload)) {
      const previous = seen.get(field)
      if (previous) {
        throw new Error(
          `Upsert konflikti: '${field}' maydoni ham '${previous}', ham '${operator}' ichida. ` +
            `Bittasini olib tashlang ($inc va $addToSet maydonni o'zi yaratadi).`,
        )
      }
      seen.set(field, operator)
    }
  }
}

/* ------------------------------------------------------- xotiradagi zaxira */

/** MONGODB_URI bo'lmaganda ishlaydigan oddiy do'kon. Faqat dev uchun. */
function matches(doc: Record<string, unknown>, filter: Filter): boolean {
  return Object.entries(filter).every(([key, cond]) => {
    const value = doc[key]
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      const c = cond as Record<string, unknown>
      if ("$gte" in c) return (value as never) >= (c.$gte as never)
      if ("$gt" in c) return (value as never) > (c.$gt as never)
      if ("$lt" in c) return (value as never) < (c.$lt as never)
      if ("$ne" in c) return value !== c.$ne
      if ("$in" in c) return (c.$in as unknown[]).includes(value)
    }
    return value === cond
  })
}

function memoryColl<T extends { _id: unknown }>(rows: T[]): Coll<T> {
  return {
    async find(filter) {
      return rows.filter((r) => matches(r as Record<string, unknown>, filter))
    },
    async findOne(filter) {
      return rows.find((r) => matches(r as Record<string, unknown>, filter)) ?? null
    },
    async insertOne(doc) {
      rows.push(doc)
    },
    async upsert(id, ops) {
      assertNoConflicts(ops)
      let row = rows.find((r) => r._id === id)
      if (!row) {
        row = { _id: id, ...(ops.setOnInsert ?? {}) } as T
        rows.push(row)
      }
      Object.assign(row, ops.set ?? {})
      for (const [k, v] of Object.entries(ops.inc ?? {})) {
        const cur = (row as Record<string, unknown>)[k]
        ;(row as Record<string, unknown>)[k] = (typeof cur === "number" ? cur : 0) + (v as number)
      }
      for (const [k, v] of Object.entries(ops.addToSet ?? {})) {
        const cur = (row as Record<string, unknown>)[k]
        const arr = Array.isArray(cur) ? (cur as unknown[]) : []
        if (!arr.includes(v)) arr.push(v)
        ;(row as Record<string, unknown>)[k] = arr
      }
    },
    async deleteMany(ids) {
      const doomed = new Set(ids)
      let removed = 0
      for (let i = rows.length - 1; i >= 0; i--) {
        if (doomed.has(rows[i]._id)) {
          rows.splice(i, 1)
          removed++
        }
      }
      return removed
    },
  }
}

function mongoColl<T extends { _id: unknown }>(db: Db, name: string): Coll<T> {
  const c = db.collection<never>(name)
  return {
    async find(filter) {
      return (await c.find(filter as never).toArray()) as unknown as T[]
    },
    async findOne(filter) {
      return (await c.findOne(filter as never)) as unknown as T | null
    },
    async insertOne(doc) {
      await c.insertOne(doc as never)
    },
    async upsert(id, ops) {
      assertNoConflicts(ops)
      const update: Record<string, unknown> = {}
      if (ops.set) update.$set = ops.set
      if (ops.setOnInsert) update.$setOnInsert = ops.setOnInsert
      if (ops.inc) update.$inc = ops.inc
      if (ops.addToSet) update.$addToSet = ops.addToSet
      await c.updateOne({ _id: id } as never, update as never, { upsert: true })
    },
    async deleteMany(ids) {
      if (!ids.length) return 0
      // Katta ro'yxatni bo'lib yuboramiz — MongoDB so'rovi 16 MB bilan cheklangan.
      let removed = 0
      for (let i = 0; i < ids.length; i += 1000) {
        const batch = ids.slice(i, i + 1000)
        const res = await c.deleteMany({ _id: { $in: batch } } as never)
        removed += res.deletedCount ?? 0
      }
      return removed
    },
  }
}

/* ------------------------------------------------------------------ ulanish */

export interface Store {
  users: Coll<UserDoc>
  attempts: Coll<AttemptDoc>
  readings: Coll<ReadingDoc>
  wordStats: Coll<WordStatDoc>
  ttsCache: Coll<TtsCacheDoc>
  usage: Coll<UsageDoc>
  rooms: Coll<RoomDoc>
  roomMembers: Coll<RoomMemberDoc>
  roomMessages: Coll<RoomMessageDoc>
  /** true bo'lsa ma'lumot faqat xotirada — server o'chsa yo'qoladi */
  ephemeral: boolean
}

// Serverless'da "warm" chaqiruvlar orasida ulanishni saqlaymiz.
const globalCache = globalThis as unknown as {
  __lrClient?: Promise<MongoClient>
  __lrMemory?: {
    users: UserDoc[]
    attempts: AttemptDoc[]
    readings: ReadingDoc[]
    wordStats: WordStatDoc[]
    ttsCache: TtsCacheDoc[]
    usage: UsageDoc[]
    rooms: RoomDoc[]
    roomMembers: RoomMemberDoc[]
    roomMessages: RoomMessageDoc[]
  }
}

function memoryStore(): Store {
  globalCache.__lrMemory ??= {
    users: [],
    attempts: [],
    readings: [],
    wordStats: [],
    ttsCache: [],
    usage: [],
    rooms: [],
    roomMembers: [],
    roomMessages: [],
  }
  const m = globalCache.__lrMemory
  return {
    users: memoryColl(m.users),
    attempts: memoryColl(m.attempts),
    readings: memoryColl(m.readings),
    wordStats: memoryColl(m.wordStats),
    ttsCache: memoryColl(m.ttsCache),
    usage: memoryColl(m.usage),
    rooms: memoryColl(m.rooms),
    roomMembers: memoryColl(m.roomMembers),
    roomMessages: memoryColl(m.roomMessages),
    ephemeral: true,
  }
}

export async function getStore(): Promise<Store> {
  if (!hasMongo()) return memoryStore()

  try {
    globalCache.__lrClient ??= new MongoClient(env.mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    }).connect()

    const db = (await globalCache.__lrClient).db(env.mongoDb)
    return {
      users: mongoColl<UserDoc>(db, "users"),
      attempts: mongoColl<AttemptDoc>(db, "attempts"),
      readings: mongoColl<ReadingDoc>(db, "readings"),
      wordStats: mongoColl<WordStatDoc>(db, "wordStats"),
      ttsCache: mongoColl<TtsCacheDoc>(db, "ttsCache"),
      usage: mongoColl<UsageDoc>(db, "usage"),
      rooms: mongoColl<RoomDoc>(db, "rooms"),
      roomMembers: mongoColl<RoomMemberDoc>(db, "roomMembers"),
      roomMessages: mongoColl<RoomMessageDoc>(db, "roomMessages"),
      ephemeral: false,
    }
  } catch (err) {
    // Baza yiqilsa ilova butunlay to'xtab qolmasin.
    console.error("[db] Mongo ulanmadi, xotira rejimiga o'tildi:", err)
    globalCache.__lrClient = undefined
    return memoryStore()
  }
}
