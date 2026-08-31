/**
 * Kino uyidagi ovozli suhbat — mijoz tomoni.
 *
 * ## Nega ovoz serverdan o'tmaydi
 *
 * Ilova Vercel'da serverless funksiya sifatida ishlaydi: doimiy ulanish
 * yo'q, ya'ni ovoz oqimini o'tkazadigan joy ham yo'q. Uning ustiga ovozni
 * server orqali haydash — trafik va kechikish demakdir.
 *
 * Shuning uchun brauzerlar bir-biriga to'g'ridan-to'g'ri ulanadi (WebRTC).
 * Serverning butun ishi — tanishtirish: ikki brauzer bir marta xat
 * almashadi ("men shu manzillardaman, kodek shunday"), keyin ovoz ular
 * orasida ketadi. Xatlar oddiy `sync` javobida keladi, ya'ni yangi ulanish
 * turi ham, yangi hosting ham kerak emas.
 *
 * ## Nomzodlar (ICE) alohida yuborilmaydi
 *
 * Odatda WebRTC nomzodlarni topgan sayin bittalab yuboradi ("trickle").
 * Bizda kanal sekin — sekundiga bir marta so'raladigan polling, ya'ni har
 * bir nomzod alohida borsa ulanish o'nlab soniyaga cho'zilardi. Shuning
 * uchun nomzodlar yig'ilib bo'lgunicha kutamiz (ko'pi bilan
 * `GATHER_TIMEOUT`) va hammasini SDP ichida bir yo'la yuboramiz: juftlik
 * uchun ikkita xat yetadi.
 *
 * ## Kim taklif qiladi
 *
 * Ikkalasi bir vaqtda taklif yuborsa ulanish chalkashadi. Qoida oddiy:
 * taklifni **id'si kichigi** yuboradi, kattasi javob beradi. Ikkala tomon
 * ham ikkala id'ni biladi, shuning uchun kelishuvga so'rov kerak emas.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { IceConfig, RoomSignalKind, RoomSignalView } from "@shared/types"
import { request } from "./api"

/** Nomzodlar yig'ilishini shuncha kutamiz, keyin bori bilan yuboramiz (ms). */
const GATHER_TIMEOUT = 2500

/** Ovoz darajasi shu oraliqda o'lchanadi (ms). */
const LEVEL_TICK = 150

/** Shundan baland ovoz "gapiryapti" deb hisoblanadi (0..1). */
const SPEAKING_LEVEL = 0.08

/** Gapirish belgisi shuncha vaqt yonib turadi — har bo'g'inda o'chib yonmasin (ms). */
const SPEAKING_HOLD = 700

/** Ulanish uzilib qolsa, shuncha kutib qayta urinamiz (ms). */
const RETRY_DELAY = 3000

export type PeerPhase = "connecting" | "live" | "failed"

export interface VoicePeerView {
  userId: number
  phase: PeerPhase
  /** 0..1 — hozirgi ovoz balandligi */
  level: number
}

export type VoiceStatus = "off" | "starting" | "on"

export interface VoiceChat {
  /** Brauzer mikrofon va WebRTC'ni qo'llab-quvvatlaydimi */
  supported: boolean
  status: VoiceStatus
  error: string | null
  /** O'z mikrofonim o'chirilgan */
  micMuted: boolean
  /** O'z ovozim darajasi (0..1) — mikrofon ishlayotgani ko'rinib tursin */
  level: number
  peers: VoicePeerView[]
  /** Kimdir gapiryapti — kino ovozini shu paytda pasaytiramiz */
  someoneSpeaking: boolean
  start: () => void
  stop: () => void
  toggleMute: () => void
}

interface Peer {
  pc: RTCPeerConnection
  audio: HTMLAudioElement
  analyser?: AnalyserNode
  source?: MediaStreamAudioSourceNode
  phase: PeerPhase
  /** Qayta urinish taymeri */
  retry: number
}

export interface VoiceChatInput {
  /** Uy kodi — boshqa uyga o'tilganda suhbat yopilishi kerak */
  code: string
  meId: number
  /** Mikrofoni yoqilgan a'zolar (o'zimdan boshqa) */
  voiceMembers: number[]
  /** `sync` orqali kelgan signallar */
  signals: RoomSignalView[]
  sendSignal: (to: number, kind: RoomSignalKind, payload: string) => Promise<unknown>
  /** Mikrofon holatini `sync` so'roviga qo'shadi */
  setVoice: (active: boolean, muted: boolean) => void
  /** Darhol qayta so'rash — signal tezroq yetib borsin */
  refresh: () => void
}

/** ICE serverlari bir marta olinadi va sahifa umri davomida saqlanadi. */
let icePromise: Promise<RTCIceServer[]> | null = null

function iceServers(): Promise<RTCIceServer[]> {
  icePromise ??= request<IceConfig>("/rtc/ice")
    .then((config) => config.iceServers as RTCIceServer[])
    .catch(() => {
      // Server javob bermasa ham urinib ko'ramiz: bir tarmoqdagi ikki
      // qurilma STUN'siz ham topishadi.
      icePromise = null
      return [{ urls: "stun:stun.l.google.com:19302" }]
    })
  return icePromise
}

const supported =
  typeof window !== "undefined" &&
  typeof RTCPeerConnection !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia)

export function useVoiceChat(input: VoiceChatInput): VoiceChat {
  const [status, setStatus] = useState<VoiceStatus>("off")
  const [error, setError] = useState<string | null>(null)
  const [micMuted, setMicMuted] = useState(false)
  const [level, setLevel] = useState(0)
  const [peerViews, setPeerViews] = useState<VoicePeerView[]>([])
  /** Kimdir gapiryapti — kino ovozini pasaytirish uchun */
  const [someoneSpeaking, setSomeoneSpeaking] = useState(false)
  /**
   * Uzilgan ulanishni qayta qurish uchun turtki.
   *
   * Ulanishlar bitta effektda quriladi ("suhbatda kim bor — o'sha bilan
   * ulan"). Uzilganda ham xuddi shu yo'ldan borish uchun ulanish
   * o'chiriladi va shu raqam o'zgaradi: effekt qaytadan ishlaydi.
   */
  const [rebuild, setRebuild] = useState(0)
  /**
   * Gapirish belgisi shu lahzagacha yonib turadi.
   *
   * Ref'da, chunki u har 150 ms da o'zgaradi: holatga yozilsa ekran
   * bekorga qayta chizilardi. Belgining o'zi (`someoneSpeaking`) esa
   * o'sha o'lchov halqasida hisoblanadi, ya'ni o'zi o'chadi.
   */
  const speakingUntilRef = useRef(0)

  const streamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef(new Map<number, Peer>())
  const ctxRef = useRef<AudioContext | null>(null)
  const myAnalyserRef = useRef<AnalyserNode | null>(null)
  const handledRef = useRef(new Set<string>())
  const statusRef = useRef<VoiceStatus>("off")

  /* Hodisa ishlovchilari bir marta yaratiladi, lekin eng yangi qiymatlarni
     ko'rishi kerak — shuning uchun ref orqali. */
  const inputRef = useRef(input)
  useEffect(() => {
    inputRef.current = input
    statusRef.current = status
  })

  /* ------------------------------------------------------------ ko'rinish */

  /**
   * Ro'yxatni qayta chizadi.
   *
   * Ro'yxat ulanishlardan emas, **suhbatdagi odamlardan** tuziladi: javob
   * beruvchi tomonda taklif kelguncha ulanish umuman bo'lmaydi, lekin odam
   * ekranda "ulanmoqda" bo'lib turishi kerak.
   */
  const publish = useCallback(() => {
    const next: VoicePeerView[] = inputRef.current.voiceMembers.map((userId) => ({
      userId,
      phase: peersRef.current.get(userId)?.phase ?? "connecting",
      level: 0,
    }))

    setPeerViews((prev) => {
      const same =
        prev.length === next.length &&
        prev.every((p, i) => p.userId === next[i].userId && p.phase === next[i].phase)
      if (same) return prev
      return next.map((p) => ({
        ...p,
        level: prev.find((q) => q.userId === p.userId)?.level ?? 0,
      }))
    })
  }, [])

  /** Oqimga daraja o'lchagichini ulaydi (kim gapiryapti). */
  const meter = useCallback((userId: number, stream: MediaStream) => {
    const ctx = ctxRef.current
    const peer = peersRef.current.get(userId)
    if (!ctx || !peer) return

    try {
      peer.source?.disconnect()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.5
      source.connect(analyser)
      peer.source = source
      peer.analyser = analyser
    } catch {
      /* o'lchov qo'shimcha qulaylik — bo'lmasa ham suhbat ishlaydi */
    }
  }, [])

  /* --------------------------------------------------------------- ulanish */

  const closePeer = useCallback(
    (userId: number, farewell: boolean) => {
      const peer = peersRef.current.get(userId)
      if (!peer) return
      peersRef.current.delete(userId)

      window.clearTimeout(peer.retry)
      try {
        peer.source?.disconnect()
        peer.pc.ontrack = null
        peer.pc.onconnectionstatechange = null
        peer.pc.close()
      } catch {
        /* allaqachon yopilgan */
      }
      peer.audio.srcObject = null
      peer.audio.remove()

      if (farewell) void inputRef.current.sendSignal(userId, "bye", "").catch(() => {})
      publish()
    },
    [publish],
  )

  const closeAll = useCallback(
    (farewell: boolean) => {
      for (const userId of [...peersRef.current.keys()]) closePeer(userId, farewell)
    },
    [closePeer],
  )

  /**
   * Nomzodlar yig'ilishini kutadi.
   *
   * Cheksiz kutib bo'lmaydi: ba'zi tarmoqlarda TURN nomzodi hech qachon
   * kelmaydi va yig'ilish "complete" bo'lmay qotib qoladi. Shuning uchun
   * chegara bor — bori bilan yuboraveramiz.
   */
  const gathered = (pc: RTCPeerConnection) =>
    new Promise<void>((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve()

      const finish = () => {
        window.clearTimeout(timer)
        pc.removeEventListener("icegatheringstatechange", check)
        resolve()
      }
      const check = () => {
        if (pc.iceGatheringState === "complete") finish()
      }

      const timer = window.setTimeout(finish, GATHER_TIMEOUT)
      pc.addEventListener("icegatheringstatechange", check)
    })

  /**
   * Bitta do'st bilan ulanish.
   *
   * `offer` berilgan bo'lsa — biz javob beruvchimiz (do'st taklif yubordi),
   * aks holda taklifni o'zimiz yuboramiz.
   */
  const connect = useCallback(
    async (userId: number, offer?: RTCSessionDescriptionInit) => {
      const stream = streamRef.current
      if (!stream) return

      closePeer(userId, false)

      const pc = new RTCPeerConnection({ iceServers: await iceServers() })

      /* Ovozni chalish uchun alohida element. Ba'zi brauzerlar sahifada
         turmagan elementni chalmaydi, shuning uchun DOM'ga qo'shamiz. */
      const audio = document.createElement("audio")
      audio.autoplay = true
      audio.setAttribute("playsinline", "")
      audio.style.display = "none"
      document.body.appendChild(audio)

      const peer: Peer = { pc, audio, phase: "connecting", retry: 0 }
      peersRef.current.set(userId, peer)
      publish()

      for (const track of stream.getTracks()) pc.addTrack(track, stream)

      pc.ontrack = (event) => {
        const [remote] = event.streams
        if (!remote) return
        audio.srcObject = remote
        void audio.play().catch(() => {
          /* foydalanuvchi hali tegmagan — mikrofon tugmasi baribir teginish */
        })
        meter(userId, remote)
      }

      pc.onconnectionstatechange = () => {
        const live = pc.connectionState
        if (live === "connected") {
          peer.phase = "live"
          publish()
          return
        }
        if (live !== "failed" && live !== "disconnected") return

        peer.phase = "failed"
        publish()

        /*
          Uzilgan ulanishni faqat taklif qiluvchi tomon tiklaydi — ikkalasi
          bir vaqtda urinsa yana chalkashardi.
        */
        if (inputRef.current.meId < userId && statusRef.current === "on") {
          window.clearTimeout(peer.retry)
          peer.retry = window.setTimeout(() => {
            if (statusRef.current !== "on") return
            /*
              Ulanishni bu yerdan qayta qurmaymiz: uni o'chirib, "qaytadan
              qara" deb belgi qo'yamiz — kim bilan ulanish kerakligini
              baribir bitta effekt hal qiladi va ikkita joyda ikki xil
              mantiq qolmaydi.
            */
            closePeer(userId, false)
            setRebuild((n) => n + 1)
          }, RETRY_DELAY)
        }
      }

      try {
        if (offer) {
          await pc.setRemoteDescription(offer)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          await gathered(pc)
          await inputRef.current.sendSignal(userId, "answer", JSON.stringify(pc.localDescription))
        } else {
          const local = await pc.createOffer()
          await pc.setLocalDescription(local)
          await gathered(pc)
          await inputRef.current.sendSignal(userId, "offer", JSON.stringify(pc.localDescription))
        }
        // Javob yo'lda kutib qolmasin.
        inputRef.current.refresh()
      } catch {
        peer.phase = "failed"
        publish()
      }
    },
    [closePeer, meter, publish],
  )

  /* -------------------------------------------------------------- boshlash */

  const start = useCallback(async () => {
    if (!supported) {
      setError("Bu brauzerda ovozli suhbat ishlamaydi.")
      return
    }
    if (statusRef.current !== "off") return

    setStatus("starting")
    statusRef.current = "starting"
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Kino ovozi mikrofonga qaytib aks-sado bo'lmasligi uchun.
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      })
      streamRef.current = stream

      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) {
        const ctx = new Ctx()
        // Teginishdan keyin ochilgan kontekst ba'zan "suspended" turadi.
        void ctx.resume().catch(() => {})
        ctxRef.current = ctx

        try {
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 512
          analyser.smoothingTimeConstant = 0.5
          source.connect(analyser)
          myAnalyserRef.current = analyser
        } catch {
          /* o'lchovsiz ham ishlayveradi */
        }
      }

      setStatus("on")
      statusRef.current = "on"
      setMicMuted(false)
      inputRef.current.setVoice(true, false)
      inputRef.current.refresh()
    } catch (err) {
      setStatus("off")
      statusRef.current = "off"
      setError(describeMicError(err))
    }
  }, [])

  const stop = useCallback(() => {
    closeAll(true)

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    myAnalyserRef.current = null
    void ctxRef.current?.close().catch(() => {})
    ctxRef.current = null

    handledRef.current.clear()
    setStatus("off")
    statusRef.current = "off"
    setMicMuted(false)
    setLevel(0)
    setPeerViews([])
    speakingUntilRef.current = 0
    setSomeoneSpeaking(false)
    inputRef.current.setVoice(false, false)
  }, [closeAll])

  const toggleMute = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return

    const next = !stream.getAudioTracks().every((track) => !track.enabled)
    for (const track of stream.getAudioTracks()) track.enabled = !next
    setMicMuted(next)
    if (next) setLevel(0)
    inputRef.current.setVoice(true, next)
  }, [])

  /* ------------------------------------------------------------- signallar */

  useEffect(() => {
    if (status !== "on") return

    for (const signal of input.signals) {
      if (handledRef.current.has(signal.id)) continue
      handledRef.current.add(signal.id)

      if (signal.kind === "bye") {
        closePeer(signal.from, false)
        continue
      }

      const sdp = parseSdp(signal.payload)
      if (!sdp) continue

      if (signal.kind === "offer") {
        // Taklifni id'si kichigi yuboradi; kelgani — ulanishni qaytadan
        // qurish demak (do'st sahifani yangilagan bo'lishi mumkin).
        void connect(signal.from, sdp)
        continue
      }

      const peer = peersRef.current.get(signal.from)
      if (!peer || peer.pc.signalingState !== "have-local-offer") continue
      void peer.pc.setRemoteDescription(sdp).catch(() => {
        peer.phase = "failed"
        publish()
      })
    }
  }, [input.signals, status, connect, closePeer, publish])

  /* ------------------------------------------- kim suhbatda: ulanish/uzish */

  const membersKey = input.voiceMembers.join(",")

  useEffect(() => {
    if (status !== "on") return

    const wanted = new Set(membersKey ? membersKey.split(",").map(Number) : [])

    // Chiqib ketganlar bilan ulanishni yopamiz.
    for (const userId of [...peersRef.current.keys()]) {
      if (!wanted.has(userId)) closePeer(userId, false)
    }

    /*
      Taklifni id'si kichigi yuboradi. Kattasi hech narsa qilmaydi — u
      taklif kelishini kutadi; ekranda esa "ulanmoqda" bo'lib turadi,
      chunki ro'yxat ulanishlardan emas, odamlardan tuziladi.
    */
    for (const userId of wanted) {
      if (peersRef.current.has(userId)) continue
      if (inputRef.current.meId < userId) void connect(userId)
    }
    publish()
  }, [membersKey, status, rebuild, connect, closePeer, publish])

  /* ------------------------------------------------------- daraja o'lchovi */

  useEffect(() => {
    if (status !== "on") return

    const timer = window.setInterval(() => {
      const mine = myAnalyserRef.current ? readLevel(myAnalyserRef.current) : 0
      setLevel((prev) => (Math.abs(prev - mine) < 0.02 ? prev : mine))

      let loudest = 0
      setPeerViews((prev) => {
        let changed = false
        const next = prev.map((view) => {
          const analyser = peersRef.current.get(view.userId)?.analyser
          const value = analyser ? readLevel(analyser) : 0
          loudest = Math.max(loudest, value)
          if (Math.abs(view.level - value) < 0.02) return view
          changed = true
          return { ...view, level: value }
        })
        return changed ? next : prev
      })

      if (loudest > SPEAKING_LEVEL) speakingUntilRef.current = Date.now() + SPEAKING_HOLD
      const speaking = speakingUntilRef.current > Date.now()
      setSomeoneSpeaking((prev) => (prev === speaking ? prev : speaking))
    }, LEVEL_TICK)

    return () => window.clearInterval(timer)
  }, [status])

  /* ------------------------------------------------------------- tozalash */

  /** Uydan chiqilganda yoki sahifa yopilganda mikrofon o'chsin. */
  useEffect(() => {
    const onHide = () => {
      if (statusRef.current !== "off") stop()
    }
    window.addEventListener("pagehide", onHide)
    return () => {
      window.removeEventListener("pagehide", onHide)
      onHide()
    }
  }, [input.code, stop])

  return useMemo(
    () => ({
      supported,
      status,
      error,
      micMuted,
      level,
      peers: peerViews,
      someoneSpeaking,
      start: () => void start(),
      stop,
      toggleMute,
    }),
    [status, error, micMuted, level, peerViews, someoneSpeaking, start, stop, toggleMute],
  )
}

/** Kelgan signal ichidagi SDP. Buzuq bo'lsa — tashlab yuboriladi. */
function parseSdp(payload: string): RTCSessionDescriptionInit | null {
  try {
    const parsed = JSON.parse(payload) as RTCSessionDescriptionInit
    return parsed?.type ? parsed : null
  } catch {
    return null
  }
}

/** Analizatordan 0..1 oralig'idagi ovoz balandligi (RMS). */
function readLevel(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteTimeDomainData(data)

  let sum = 0
  for (const value of data) {
    const centered = (value - 128) / 128
    sum += centered * centered
  }

  // Odatdagi suhbat RMS'i 0,05 atrofida — ko'rinadigan bo'lishi uchun kuchaytiramiz.
  return Math.min(1, Math.sqrt(sum / data.length) * 4)
}

function describeMicError(err: unknown): string {
  const name = err instanceof Error ? err.name : ""
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering."
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "Mikrofon topilmadi."
  }
  if (name === "NotReadableError") {
    return "Mikrofon band — uni boshqa dastur ishlatyapti."
  }
  return "Mikrofonni yoqib bo'lmadi."
}
