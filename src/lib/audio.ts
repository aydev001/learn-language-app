import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { fetchSpeech } from "./api"

/* ============================================================== o'qib berish */

/** Bir xil matn qayta so'ralmasin — object URL'lar sahifa umri davomida saqlanadi. */
const speechCache = new Map<string, string>()
let currentAudio: HTMLAudioElement | null = null

export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

async function getSpeechUrl(text: string, personal: boolean): Promise<string> {
  const cached = speechCache.get(text)
  if (cached) return cached

  const blob = await fetchSpeech(text, personal)
  const url = URL.createObjectURL(blob)
  speechCache.set(text, url)
  return url
}

export type SpeechStatus = "idle" | "loading" | "playing"

export interface SpeakOptions {
  /** Qaysi tugma faol ekanini ajratish uchun (masalan so'z id'si) */
  key?: string
  /** Shu o'quvchiga xos matn (murabbiy izohi) — serverda keshlanmaydi */
  personal?: boolean
}

/**
 * Matnni ovoz bilan o'qib beruvchi hook.
 * Bir vaqtning o'zida faqat bitta audio yangraydi.
 */
export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle")
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const stop = useCallback(() => {
    stopSpeech()
    if (mounted.current) {
      setStatus("idle")
      setActiveKey(null)
    }
  }, [])

  const play = useCallback(
    async (text: string, opts: SpeakOptions = {}) => {
      const key = opts.key ?? text
      stopSpeech()
      setError(null)
      setActiveKey(key)
      setStatus("loading")

      try {
        const url = await getSpeechUrl(text, opts.personal ?? false)
        if (!mounted.current) return

        const audio = new Audio(url)
        currentAudio = audio

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve()
          audio.onerror = () => reject(new Error("Audio ijro etilmadi"))
          audio.onplaying = () => {
            if (mounted.current) setStatus("playing")
          }
          void audio.play().catch(reject)
        })
      } catch (err) {
        // Server sababni o'zbekcha yozib yuboradi (mablag' tugagan, kalit
        // noto'g'ri...) — uni yashirmasdan o'quvchiga ko'rsatamiz.
        const text = err instanceof Error ? err.message : "Ovozni o'qib bo'lmadi"
        if (mounted.current) setError(text)
        toast.error(text)
      } finally {
        if (currentAudio && mounted.current) currentAudio = null
        if (mounted.current) {
          setStatus("idle")
          setActiveKey(null)
        }
      }
    },
    [],
  )

  return { play, stop, status, activeKey, error, isBusy: status !== "idle" }
}

/* ======================================================= ketma-ket ijro */

export interface SequenceState {
  /** Hozir yangrayotgan bo'lak; hech narsa yangramasa -1 */
  index: number
  status: SpeechStatus
}

/**
 * Bir nechta matnni ketma-ket o'qib beradi — to'liq matnni tinglash uchun.
 *
 * Nega bo'laklab: TTS bitta so'rovda 1200 belgigacha qabul qiladi, uzun
 * matn esa undan oshadi. Abzatslarga bo'lib yuborish ayni paytda qulay
 * ham — o'quvchi qaysi joyni tinglayotganini ko'rib turadi.
 *
 * Keyingi bo'lak joriysi tugamasdan oldin yuklab qo'yiladi, shunda
 * orada uzilish sezilmaydi.
 */
export function useSpeechSequence(parts: string[]) {
  const [index, setIndex] = useState(-1)
  const [status, setStatus] = useState<SpeechStatus>("idle")

  const cancelled = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      cancelled.current = true
      stopSpeech()
    }
  }, [])

  const stop = useCallback(() => {
    cancelled.current = true
    stopSpeech()
    if (mounted.current) {
      setStatus("idle")
      setIndex(-1)
    }
  }, [])

  /** `from` dan boshlab oxirigacha o'qiydi. */
  const play = useCallback(
    async (from = 0) => {
      cancelled.current = false
      stopSpeech()

      for (let i = from; i < parts.length; i++) {
        if (cancelled.current || !mounted.current) return

        setIndex(i)
        setStatus("loading")

        let url: string
        try {
          url = await getSpeechUrl(parts[i], false)
        } catch (err) {
          const text = err instanceof Error ? err.message : "Ovozni o'qib bo'lmadi"
          toast.error(text)
          if (mounted.current) {
            setStatus("idle")
            setIndex(-1)
          }
          return
        }

        if (cancelled.current || !mounted.current) return

        const audio = new Audio(url)
        currentAudio = audio

        // Keyingi bo'lakni oldindan yuklaymiz — pauza sezilmasin.
        if (i + 1 < parts.length) void getSpeechUrl(parts[i + 1], false).catch(() => {})

        try {
          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve()
            audio.onerror = () => reject(new Error("Audio ijro etilmadi"))
            audio.onplaying = () => {
              if (mounted.current) setStatus("playing")
            }
            void audio.play().catch(reject)
          })
        } catch {
          // Brauzer to'sib qo'ydi yoki fayl buzuq — to'xtaymiz.
          if (mounted.current) {
            setStatus("idle")
            setIndex(-1)
          }
          return
        }
      }

      if (mounted.current && !cancelled.current) {
        setStatus("idle")
        setIndex(-1)
      }
    },
    [parts],
  )

  return {
    index,
    status,
    isActive: status !== "idle",
    play,
    stop,
  }
}

/* ================================================================ yozib olish */

export type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "stopped"
  | "denied"
  | "unsupported"

const MAX_RECORDING_MS = 60_000

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4", // iOS Safari / Telegram iOS
    "audio/ogg;codecs=opus",
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? ""
}

export interface Recording {
  blob: Blob
  durationMs: number
  url: string
}

/**
 * Mikrofondan yozib oluvchi hook.
 * `level` — 0..1 oralig'idagi ovoz balandligi, to'lqin animatsiyasi uchun.
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle")
  const [recording, setRecording] = useState<Recording | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoStopRef.current) clearTimeout(autoStopRef.current)
    rafRef.current = null
    timerRef.current = null
    autoStopRef.current = null

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    void audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null

    setLevel(0)
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported")
      setError("Bu qurilmada ovoz yozish qo'llab-quvvatlanmaydi.")
      return
    }

    setError(null)
    setRecording(null)
    setElapsedMs(0)
    setState("requesting")

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch {
      setState("denied")
      setError("Mikrofonga ruxsat berilmadi. Sozlamalardan ruxsat bering.")
      return
    }

    streamRef.current = stream
    chunksRef.current = []

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
      const durationMs = Date.now() - startedAtRef.current
      cleanup()
      setRecording({ blob, durationMs, url: URL.createObjectURL(blob) })
      setState("stopped")
    }

    // Ovoz balandligini o'lchash — faqat vizual effekt uchun
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)

      const buffer = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buffer)
        let sum = 0
        for (const v of buffer) sum += (v - 128) ** 2
        const rms = Math.sqrt(sum / buffer.length) / 128
        setLevel(Math.min(1, rms * 3.2))
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      /* analizator bo'lmasa ham yozuv ishlayveradi */
    }

    startedAtRef.current = Date.now()
    recorder.start()
    setState("recording")

    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 100)
    autoStopRef.current = setTimeout(() => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop()
    }, MAX_RECORDING_MS)
  }, [cleanup])

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
  }, [])

  const reset = useCallback(() => {
    if (recording) URL.revokeObjectURL(recording.url)
    setRecording(null)
    setElapsedMs(0)
    setState("idle")
    setError(null)
  }, [recording])

  return {
    state,
    recording,
    elapsedMs,
    level,
    error,
    start,
    stop,
    reset,
    isRecording: state === "recording",
    maxMs: MAX_RECORDING_MS,
  }
}
