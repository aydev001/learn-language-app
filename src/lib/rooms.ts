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
  RoomAccess,
  RoomMemberAction,
  RoomMessageView,
  RoomStateView,
  RoomSummary,
  RoomSync,
} from "@shared/types"
import { ApiError, request } from "./api"

/* ---------------------------------------------------------------- so'rovlar */

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export function useMyRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => request<RoomSummary[]>("/rooms"),
    staleTime: 5_000,
    // Ro'yxatdagi "hozir uyda" belgisi eskirib qolmasin.
    refetchInterval: 15_000,
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => post<{ code: string; inviteUrl: string }>("/rooms", { url }),
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
    sendMessage: (text: string) => post<{ message: RoomMessageView }>(`${base}/messages`, { text }),
    member: (userId: number, action: RoomMemberAction) =>
      post<{ ok: true }>(`${base}/members/${userId}`, { action }),
    leave: () => post<{ ok: true; closed: boolean }>(`${base}/leave`),
    close: () => post<{ ok: true }>(`${base}/close`),
  }
}

/* ------------------------------------------------------------ sinxronlash */

/** Video ketayotganda tez-tez so'raymiz — sinxronlik shundan. */
const INTERVAL_PLAYING = 1500
/** To'xtatilgan yoki hali kirilmagan holat — kamroq. */
const INTERVAL_IDLE = 2500
/** Ilova fonda: batareyani yemasin, lekin chatdan uzilib ham qolmasin. */
const INTERVAL_HIDDEN = 10_000

/** Xotirada saqlanadigan xabarlar chegarasi. */
const MESSAGE_CAP = 200

export interface RoomSyncResult {
  sync: RoomSync | null
  messages: RoomMessageView[]
  error: ApiError | null
  /** Birinchi javob hali kelmagan */
  loading: boolean
  /** Server soati bo'yicha hozirgi vaqt (ms) */
  serverNow: () => number
  /** Darhol qayta so'rash */
  refresh: () => void
  /** POST javobidan kelgan yangi holatni kutmasdan qo'llash */
  applyState: (state: RoomStateView) => void
  /** O'zi yozgan xabarni darhol ko'rsatish */
  appendMessage: (message: RoomMessageView) => void
}

export function useRoomSync(code: string): RoomSyncResult {
  const [sync, setSync] = useState<RoomSync | null>(null)
  const [messages, setMessages] = useState<RoomMessageView[]>([])
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)

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
  const inflightRef = useRef(false)
  const intervalRef = useRef(INTERVAL_IDLE)
  const wakeRef = useRef<(() => void) | null>(null)

  const poll = useCallback(async () => {
    if (inflightRef.current) return
    inflightRef.current = true

    if (cursorRef.current.code !== code) cursorRef.current = { code, since: 0 }
    const since = cursorRef.current.since
    const sentAt = Date.now()

    try {
      const data = await request<RoomSync>(`/rooms/${code}/sync?msgSince=${since}`)

      // Javob kelguncha boshqa uyga o'tib ketgan bo'lishimiz mumkin.
      if (cursorRef.current.code !== code) return

      const roundTrip = Date.now() - sentAt
      offsetRef.current = data.serverNow + Math.round(roundTrip / 2) - Date.now()

      if (data.messages?.length) {
        const incoming = data.messages
        cursorRef.current.since = Math.max(since, ...incoming.map((m) => m.at))
        setMessages((prev) => mergeMessages(prev, incoming))
      }

      setSync(data)
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
  useEffect(() => {
    intervalRef.current = sync?.state?.isPlaying ? INTERVAL_PLAYING : INTERVAL_IDLE
  }, [sync?.state?.isPlaying])

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
      schedule(document.hidden ? INTERVAL_HIDDEN : intervalRef.current)
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
    setError(null)
    setLoading(true)
  }

  const serverNow = useCallback(() => Date.now() + offsetRef.current, [])
  const refresh = useCallback(() => wakeRef.current?.(), [])

  const applyState = useCallback((state: RoomStateView) => {
    setSync((prev) => (prev ? { ...prev, state, videoId: state.videoId, title: state.title } : prev))
  }, [])

  const appendMessage = useCallback((message: RoomMessageView) => {
    cursorRef.current.since = Math.max(cursorRef.current.since, message.at)
    setMessages((prev) => mergeMessages(prev, [message]))
  }, [])

  return useMemo(
    () => ({ sync, messages, error, loading, serverNow, refresh, applyState, appendMessage }),
    [sync, messages, error, loading, serverNow, refresh, applyState, appendMessage],
  )
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
