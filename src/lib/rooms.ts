/**
 * Kino uyi — mijoz tomoni.
 *
 * Server bilan aloqa oddiy HTTP orqali: uy ichida turganda qisqa oraliqda
 * `sync` so'raymiz, o'zgarishlarni esa POST bilan yuboramiz. WebSocket yo'q,
 * chunki ilova Vercel'da serverless funksiya sifatida ishlaydi (batafsil:
 * `server/lib/rooms.ts`).
 *
 * Bu fayl polling'ning barcha nozik joylarini o'z ichiga oladi:
 * soatlar farqi, xabarlar kursori va tarmoq uzilishida qayta urinish.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  Me,
  PublicRoomSummary,
  RoomAccess,
  RoomMemberAction,
  RoomMessageView,
  RoomSignalKind,
  RoomSignalView,
  RoomStateView,
  RoomSummary,
  RoomVisibility,
  RoomSync,
} from "@shared/types"
import { ApiError, request } from "./api"

/* -------------------------------------------------------- sinov davri */

/**
 * «Kino» bo'limi hozircha hamma uchun ochiq emas.
 *
 * Feature real sharoitda sinovdan o'tyapti: sinxron, uy egasining tasdig'i
 * va chat bir necha odamda bir vaqtda tekshirilishi kerak. Shuning uchun
 * pastdagi menyuda u faqat adminlarga va sinovda qatnashayotgan o'quvchiga
 * ko'rinadi.
 *
 * Taklif havolasi (`/room/<kod>`) hamma uchun ochiq qoladi — aks holda
 * sinovchi do'stini uyiga chaqira olmasdi, ya'ni sinovning o'zi imkonsiz
 * bo'lardi. Yopiq bo'lgani — bo'limni topib borish yo'li.
 *
 * Sinov tugagach shu ro'yxatni bo'shatib, `canUseRooms` ni `true`
 * qaytaradigan qilish kifoya.
 */
const ROOMS_TESTERS = [7255599788]

export const canUseRooms = (me?: Me | null): boolean =>
  Boolean(me && (me.isAdmin || ROOMS_TESTERS.includes(me.id)))

/* ---------------------------------------------------------------- so'rovlar */

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export function useMyRooms(enabled = true) {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => request<RoomSummary[]>("/rooms"),
    enabled,
    staleTime: 5_000,
    // Ro'yxatdagi "hozir uyda" belgisi eskirib qolmasin.
    refetchInterval: 15_000,
  })
}

/** Kodni bilmagan odam ham ko'radigan uylar. */
export function usePublicRooms(enabled = true) {
  return useQuery({
    queryKey: ["rooms", "public"],
    queryFn: () => request<PublicRoomSummary[]>("/rooms/public"),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { url: string; visibility: RoomVisibility }) =>
      post<{ code: string; inviteUrl: string }>("/rooms", input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["rooms"] }),
  })
}

/** Bitta uyga tegishli barcha amallar. */
export function roomApi(code: string) {
  const base = `/rooms/${code}`
  return {
    join: () => post<{ access: RoomAccess }>(`${base}/join`),
    setState: (isPlaying: boolean, positionSec: number) =>
      post<{ state: RoomStateView }>(`${base}/state`, { isPlaying, positionSec }),
    changeVideo: (url: string) => post<{ state: RoomStateView }>(`${base}/video`, { url }),
    setLock: (locked: boolean) => post<{ ok: true }>(`${base}/control`, { locked }),
    setVisibility: (visibility: RoomVisibility) =>
      post<{ ok: true }>(`${base}/visibility`, { visibility }),
    sendMessage: (text: string) => post<{ message: RoomMessageView }>(`${base}/messages`, { text }),
    /**
     * Ovozli suhbat signali.
     *
     * `keepalive` — sahifa yopilayotganda ham yuborilsin: "men chiqdim"
     * xabari aynan o'sha lahzada ketadi va usiz do'stning ekranida
     * ulanmagan odam 15 soniya osilib turardi.
     */
    signal: (to: number, kind: RoomSignalKind, payload: string) =>
      request<{ ok: true }>(`${base}/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, kind, payload }),
        keepalive: true,
      }),
    member: (userId: number, action: RoomMemberAction) =>
      post<{ ok: true }>(`${base}/members/${userId}`, { action }),
    leave: () => post<{ ok: true; closed: boolean }>(`${base}/leave`),
    close: () => post<{ ok: true }>(`${base}/close`),
  }
}

/* ------------------------------------------------------------ sinxronlash */

/** Video ketayotganda tez-tez so'raymiz — sinxronlik shundan. */
const INTERVAL_PLAYING = 1200
/**
 * Uy ichida, lekin video to'xtatilgan.
 *
 * Bu ham tez bo'lishi kerak: do'st "o'ynatish"ni bosganda o'zgarish shu
 * oraliqda yetib keladi. Ilgari 2,5 soniya edi va kino ikkinchi tarafda
 * sezilarli kechikib boshlanardi.
 */
const INTERVAL_IDLE = 1800
/** Hali uyga kirmagan (so'rov kutayotgan) odam — shoshilishga hojat yo'q. */
const INTERVAL_WAITING = 3000
/** Ilova fonda: batareyani yemasin, lekin chatdan uzilib ham qolmasin. */
const INTERVAL_HIDDEN = 10_000

/**
 * Ilova fonda, lekin ovozli suhbat ochiq.
 *
 * Suhbat ulanishi shu so'rovlar orqali quriladi, shuning uchun 10 soniya
 * juda uzun: boshqa ilovaga o'tib qaytgan odam bilan qaytadan ulanish
 * o'nlab soniyaga cho'zilardi. Ovoz baribir ketayotgan bo'lsa batareya
 * shusiz ham ishlayapti.
 */
const INTERVAL_HIDDEN_VOICE = 3000

/**
 * Harakat javobi shuncha kutiladi (ms).
 *
 * Shu vaqt ichida `sync` javoblari uy holatiga tegmaydi. Chegara zarur:
 * so'rov umuman qaytmasa (tarmoq uzildi) sinxronlash abadiy yopiq qolardi.
 */
const ACTION_WAIT = 5000

/**
 * Ovozli suhbat ochiq — tez-tez so'raymiz.
 *
 * Ulanish signallari shu so'rovda keladi, ya'ni oraliq to'g'ridan-to'g'ri
 * "necha soniyada gaplasha boshlaymiz" degani.
 */
const INTERVAL_VOICE = 900

/** Xotirada saqlanadigan xabarlar chegarasi. */
const MESSAGE_CAP = 200

/**
 * Xotirada saqlanadigan signallar chegarasi.
 *
 * Ular bir martalik va katta (SDP ~5 KB), shuning uchun ro'yxat qisqa:
 * ishlatilgani ortiq kerak emas.
 */
const SIGNAL_CAP = 12

export interface RoomSyncResult {
  sync: RoomSync | null
  messages: RoomMessageView[]
  /** Ovozli suhbat signallari — kelgan tartibda */
  signals: RoomSignalView[]
  error: ApiError | null
  /** Birinchi javob hali kelmagan */
  loading: boolean
  /** Server soati bo'yicha hozirgi vaqt (ms) */
  serverNow: () => number
  /** Darhol qayta so'rash */
  refresh: () => void
  /**
   * Foydalanuvchi harakati: ekranga darhol qo'llanadi va shu lahzadan
   * boshlab yo'ldagi `sync` javoblari inobatga olinmaydi. Qaytgan raqam —
   * harakat navbati, uni javob kelganda qaytarib berish kerak.
   */
  predictState: (patch: StatePatch) => number
  /** Markazdan kelgan tasdiq. `seq` berilsa, eskirgan javob tashlab yuboriladi. */
  applyState: (state: RoomStateView, seq?: number) => void
  /** Harakat bajarilmadi — sinxronlash yana ochiladi */
  abortAction: (seq: number) => void
  /** O'zi yozgan xabarni darhol ko'rsatish */
  appendMessage: (message: RoomMessageView) => void
  /**
   * Kirish so'rovi javobi.
   *
   * Ekran keyingi `sync` ni kutmasligi kerak: so'rov yuborilmagan odam
   * uchun oraliq uch soniya va o'sha uch soniya davomida tugma o'sha
   * holicha turardi — odam uni yana bosardi.
   */
  applyAccess: (access: RoomAccess) => void
  /**
   * Mikrofon holati.
   *
   * Alohida so'rov yuborilmaydi: keyingi `sync` so'roviga qo'shiladi va
   * shu bilan "men ovozli suhbatdaman" belgisi yangilanib turadi.
   */
  setVoice: (active: boolean, muted: boolean) => void
}

/** Foydalanuvchi harakatidan keyin uy holatining kutilayotgan ko'rinishi. */
export type StatePatch = Pick<
  RoomStateView,
  "isPlaying" | "positionSec" | "stateBy" | "stateByName"
>

export function useRoomSync(code: string): RoomSyncResult {
  const [sync, setSync] = useState<RoomSync | null>(null)
  const [messages, setMessages] = useState<RoomMessageView[]>([])
  const [signals, setSignals] = useState<RoomSignalView[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  /** Mikrofon yoqilgan — so'rov oralig'i ham shunga qarab qisqaradi */
  const [voiceOn, setVoiceOn] = useState(false)

  /**
   * Server va mijoz soatlari orasidagi farq.
   *
   * Telefon soati bir necha soniyaga adashishi mumkin — o'shanda video
   * boshqalarnikidan surilib ketardi. Har javobda farqni qayta o'lchaymiz
   * va so'rov davomiyligining yarmini (yo'lda ketgan vaqt) hisobga olamiz.
   */
  const offsetRef = useRef(0)
  /**
   * Olingan eng oxirgi xabar vaqti — faqat undan keyingilarini so'raymiz.
   * Uy kodi bilan birga saqlanadi: boshqa uyga o'tilganda kursor nolga
   * qaytishi kerak, aks holda yangi uyning suhbati ochilmay qolardi.
   */
  const cursorRef = useRef({ code, since: 0 })
  /** Olingan eng oxirgi signal vaqti — xabarlar kursorining ovozli nusxasi. */
  const sigCursorRef = useRef(0)
  /** Mikrofon holati — har `sync` so'roviga qo'shib yuboriladi. */
  const voiceRef = useRef({ active: false, muted: false })
  const inflightRef = useRef(false)
  /** So'nggi o'lchangan borish-kelish vaqti (ms) — harakatni oldindan qo'yish uchun */
  const rttRef = useRef(0)
  /**
   * Javobi kutilayotgan harakat.
   *
   * `actionSeq` — harakat navbati: javob kelganda uning hali eng oxirgi
   * harakat ekanini shu raqamdan bilamiz. `pendingSince` — javob kutila
   * boshlangan lahza: shu vaqt ichida `sync` javoblari uy holatiga
   * tegmaydi.
   */
  const actionSeqRef = useRef(0)
  const pendingSinceRef = useRef(0)
  const intervalRef = useRef(INTERVAL_IDLE)
  const wakeRef = useRef<(() => void) | null>(null)

  const poll = useCallback(async () => {
    if (inflightRef.current) return
    inflightRef.current = true

    // Boshqa uyga o'tilgan — kursorlar va mikrofon holati nolga qaytadi.
    if (cursorRef.current.code !== code) {
      cursorRef.current = { code, since: 0 }
      sigCursorRef.current = 0
      voiceRef.current = { active: false, muted: false }
    }
    const since = cursorRef.current.since
    const sentAt = Date.now()

    const voice = voiceRef.current
    const query = new URLSearchParams({
      msgSince: String(since),
      sigSince: String(sigCursorRef.current),
    })
    if (voice.active) {
      query.set("voice", "1")
      if (voice.muted) query.set("muted", "1")
    }

    try {
      const data = await request<RoomSync>(`/rooms/${code}/sync?${query}`)

      // Javob kelguncha boshqa uyga o'tib ketgan bo'lishimiz mumkin.
      if (cursorRef.current.code !== code) return

      const roundTrip = Date.now() - sentAt
      rttRef.current = roundTrip
      offsetRef.current = data.serverNow + Math.round(roundTrip / 2) - Date.now()

      if (data.messages?.length) {
        const incoming = data.messages
        cursorRef.current.since = Math.max(since, ...incoming.map((m) => m.at))
        setMessages((prev) => mergeMessages(prev, incoming))
      }

      if (data.signals?.length) {
        const incoming = data.signals
        sigCursorRef.current = Math.max(sigCursorRef.current, ...incoming.map((s) => s.at))
        setSignals((prev) => {
          const seen = new Set(prev.map((s) => s.id))
          const merged = [...prev, ...incoming.filter((s) => !seen.has(s.id))]
          return merged.length > SIGNAL_CAP ? merged.slice(-SIGNAL_CAP) : merged
        })
      }

      /**
       * Harakat javobi kutilayotgan bo'lsa, bu javob uy holatini o'zgartira
       * olmaydi: u biz tugmani bosishdan oldin yo'lga chiqqan va ichida
       * eskirgan soniya bor. Ilgari u yangi holatni bosib ketar, kuzatuv esa
       * videoni eski joyga qaytarardi.
       *
       * A'zolar, so'rovlar va suhbat bunga aloqasiz — ular baribir yangilanadi.
       */
      const waiting =
        pendingSinceRef.current > 0 && Date.now() - pendingSinceRef.current < ACTION_WAIT

      setSync((prev) => mergeSync(prev, data, waiting))
      setError(null)
    } catch (err) {
      if (cursorRef.current.code !== code) return
      setError(err instanceof ApiError ? err : new ApiError(0, "network", "Aloqa uzildi."))
    } finally {
      inflightRef.current = false
      setLoading(false)
    }
  }, [code])

  // So'rov oralig'i holatga qarab o'zgaradi.
  const isMember = sync?.access === "member"
  const isPlaying = sync?.state?.isPlaying ?? false
  useEffect(() => {
    intervalRef.current = !isMember
      ? INTERVAL_WAITING
      : voiceOn
        ? INTERVAL_VOICE
        : isPlaying
          ? INTERVAL_PLAYING
          : INTERVAL_IDLE
  }, [isMember, isPlaying, voiceOn])

  useEffect(() => {
    let cancelled = false
    let timer = 0

    const schedule = (delay: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(tick, delay)
    }

    /**
     * Ilova fonda bo'lsa so'rovlar siyraklashadi, lekin butunlay to'xtamaydi:
     * fon oynada ochilgan uy ham yuklanishi kerak (Telegram ilovani ba'zan
     * ko'rinmas holatda tayyorlab qo'yadi).
     */
    const tick = async () => {
      if (cancelled) return
      await poll()
      if (cancelled) return
      const hidden = voiceRef.current.active ? INTERVAL_HIDDEN_VOICE : INTERVAL_HIDDEN
      schedule(document.hidden ? hidden : intervalRef.current)
    }

    // Ekranga qaytganda kutib o'tirmaymiz — darhol yangilaymiz.
    const onVisibility = () => {
      if (!document.hidden) schedule(0)
    }

    wakeRef.current = () => schedule(0)
    document.addEventListener("visibilitychange", onVisibility)
    void tick()

    return () => {
      cancelled = true
      wakeRef.current = null
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [poll])

  /**
   * Boshqa uyga o'tilganda eski suhbat qolib ketmasin.
   *
   * Tozalash effektda emas, render paytida bajariladi: effekt bir kadr
   * kechikkani uchun yangi uy ustida bir zumga eski xabarlar ko'rinib
   * qolardi.
   */
  const [openCode, setOpenCode] = useState(code)
  if (openCode !== code) {
    setOpenCode(code)
    setSync(null)
    setMessages([])
    setSignals([])
    setError(null)
    setLoading(true)
    // Ovozli suhbat uy bilan birga tugaydi (kursorlarni `poll` tozalaydi).
    setVoiceOn(false)
  }

  const serverNow = useCallback(() => Date.now() + offsetRef.current, [])
  const refresh = useCallback(() => wakeRef.current?.(), [])
  /**
   * Foydalanuvchi harakati.
   *
   * Ekran markazning javobini kutmaydi: kutilayotgan holat darhol qo'yiladi,
   * aks holda surilgan chiziq bir zum eski joyga qaytib turardi. Ayni paytda
   * yo'lda turgan `sync` javoblari yopiladi — ular tugma bosilishidan oldin
   * chiqqan va eskirgan soniyani olib qaytadi.
   *
   * `stateAt` server qo'yadigan lahzaga yaqin bo'lishi kerak, shuning uchun
   * o'lchangan borish vaqtining yarmi qo'shiladi. Tasdiq kelganda uning
   * aniq qiymati baribir ustiga yozadi.
   */
  const predictState = useCallback((patch: StatePatch) => {
    const seq = ++actionSeqRef.current
    pendingSinceRef.current = Date.now()

    const stateAt = Date.now() + offsetRef.current + Math.round(rttRef.current / 2)
    setSync((prev) =>
      prev?.state ? { ...prev, state: { ...prev.state, ...patch, stateAt } } : prev,
    )
    return seq
  }, [])

  /**
   * Markazdan kelgan tasdiq.
   *
   * `seq` — qaysi harakatning javobi. Undan keyin yangi harakat qilingan
   * bo'lsa javob eskirgan: uni qo'llasak, endigina surilgan video oldingi
   * joyiga qaytib ketardi.
   */
  const applyState = useCallback((state: RoomStateView, seq?: number) => {
    if (seq !== undefined && seq !== actionSeqRef.current) return
    // `seq` siz chaqiruv — kinoni almashtirish kabi mustaqil harakat.
    if (seq === undefined) actionSeqRef.current++
    pendingSinceRef.current = 0
    setSync((prev) => (prev ? { ...prev, state, videoId: state.videoId, title: state.title } : prev))
  }, [])

  /** Harakat bajarilmadi (ruxsat yo'q, aloqa uzildi) — sinxronlash yana ochiladi. */
  const abortAction = useCallback((seq: number) => {
    if (seq !== actionSeqRef.current) return
    pendingSinceRef.current = 0
  }, [])

  const appendMessage = useCallback((message: RoomMessageView) => {
    cursorRef.current.since = Math.max(cursorRef.current.since, message.at)
    setMessages((prev) => mergeMessages(prev, [message]))
  }, [])

  /** Kirish so'rovining javobi darhol ekranga qo'yiladi. */
  const applyAccess = useCallback((access: RoomAccess) => {
    setSync((prev) => (prev ? { ...prev, access } : prev))
  }, [])

  /**
   * Mikrofon holati.
   *
   * Ref'ga yoziladi (keyingi so'rov o'zi olib ketadi), holat esa faqat
   * so'rov oralig'ini o'zgartirish uchun kerak — shuning uchun u
   * haqiqatan almashgandagina yangilanadi.
   */
  const setVoice = useCallback((active: boolean, muted: boolean) => {
    voiceRef.current = { active, muted }
    setVoiceOn((prev) => (prev === active ? prev : active))
  }, [])

  return useMemo(
    () => ({
      sync,
      messages,
      signals,
      error,
      loading,
      serverNow,
      refresh,
      predictState,
      applyState,
      abortAction,
      appendMessage,
      applyAccess,
      setVoice,
    }),
    [
      sync,
      messages,
      signals,
      error,
      loading,
      serverNow,
      refresh,
      predictState,
      applyState,
      abortAction,
      appendMessage,
      applyAccess,
      setVoice,
    ],
  )
}

/**
 * Yangi `sync` javobini joriy holat bilan birlashtiradi.
 *
 * Uy holati ikki holatda saqlanib qoladi: harakat javobi kutilayotganda
 * (`hold`) va javob eskirganda — javoblar yo'lda bir-birini quvib o'tishi
 * mumkin, o'shanda kechikkani videoni orqaga tortardi. Qolgan hamma narsa
 * (a'zolar, so'rovlar, ruxsat) har doim yangilanadi.
 */
function mergeSync(prev: RoomSync | null, next: RoomSync, hold: boolean): RoomSync {
  const keep = prev?.state
  if (!keep || !next.state) return next
  if (!hold && next.state.stateAt >= keep.stateAt) return next
  return { ...next, state: keep, videoId: keep.videoId, title: keep.title }
}

/**
 * Xabarlarni qo'shadi: takrorlanganini tashlab, vaqt bo'yicha saralaydi.
 *
 * Takror bo'lishi mumkin — o'z xabarimizni darhol ko'rsatamiz, keyin u
 * `sync` javobida ham qaytadi.
 */
function mergeMessages(
  current: RoomMessageView[],
  incoming: RoomMessageView[],
): RoomMessageView[] {
  const seen = new Set(current.map((m) => m.id))
  const merged = [...current]

  for (const message of incoming) {
    if (seen.has(message.id)) continue
    seen.add(message.id)
    merged.push(message)
  }

  merged.sort((a, b) => a.at - b.at)
  return merged.length > MESSAGE_CAP ? merged.slice(-MESSAGE_CAP) : merged
}

/**
 * Videoning hozir qayerda bo'lishi kerakligi.
 *
 * Bazada "hozirgi joy" saqlanmaydi — u har soniyada o'zgaradi. Saqlanadigani:
 * `positionSec` (belgilangan lahzadagi joy) va `stateAt` (o'sha lahza).
 */
export function expectedPosition(state: RoomStateView, serverNow: number): number {
  if (!state.isPlaying) return state.positionSec
  return state.positionSec + Math.max(0, serverNow - state.stateAt) / 1000
}
