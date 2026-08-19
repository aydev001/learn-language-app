import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  LeaderboardPeriod,
  LeaderboardResponse,
  Lesson,
  LessonProgress,
  LessonSummary,
  Me,
  PronunciationReport,
  VocabAttemptInput,
  VocabAttemptResult,
} from "@shared/types"
import { getInitData } from "./telegram"

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

function authHeaders(): Record<string, string> {
  const initData = getInitData()
  if (initData) return { Authorization: `tma ${initData}` }

  /**
   * Telegram tashqarisida (brauzerda) sinash uchun: `?devUser=2` bilan
   * ochilgan oyna boshqa foydalanuvchi bo'lib ko'rinadi. Kino uyini bir
   * kompyuterda ikki kishi bo'lib sinash shusiz imkonsiz.
   *
   * Serverda bu faqat `ALLOW_DEV_USER=1` bo'lganda ishlaydi va
   * production'da butunlay o'chiq (`env.allowDevUser`).
   */
  const fromUrl = new URLSearchParams(window.location.search).get("devUser")
  // Manzil o'zgarganda ham saqlanib qolsin. `sessionStorage` — oyna ichida,
  // shuning uchun ikkinchi ilova oynasi boshqa foydalanuvchi bo'la oladi.
  if (fromUrl) sessionStorage.setItem("devUser", fromUrl)

  const devUser = fromUrl ?? sessionStorage.getItem("devUser")
  return devUser ? { "X-Dev-User": devUser } : {}
}

async function toError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null
  return new ApiError(
    res.status,
    body?.error ?? "unknown",
    body?.message ?? "Nomaʼlum xatolik yuz berdi.",
  )
}

/**
 * Autentifikatsiya sarlavhasi bilan JSON so'rov.
 * Kino uyi qatlami (`lib/rooms.ts`) ham shuni ishlatadi.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  })
  if (!res.ok) throw await toError(res)
  return (await res.json()) as T
}

/* ------------------------------------------------------------------ so'rovlar */

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => request<Me>("/me"),
    staleTime: 60_000,
  })
}

export function useLessons() {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: () => request<LessonSummary[]>("/lessons"),
    staleTime: 30_000,
  })
}

export function useLesson(id: string | undefined) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => request<{ lesson: Lesson; progress: LessonProgress }>(`/lessons/${id}`),
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}

export function useLeaderboard(lessonId: string | null, period: LeaderboardPeriod) {
  const params = new URLSearchParams({ period })
  if (lessonId) params.set("lessonId", lessonId)
  return useQuery({
    queryKey: ["leaderboard", lessonId, period],
    queryFn: () => request<LeaderboardResponse>(`/leaderboard?${params}`),
    staleTime: 15_000,
  })
}

/* ---------------------------------------------------------------- o'zgarishlar */

export function useSubmitAttempt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VocabAttemptInput) =>
      request<VocabAttemptResult>("/vocab/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] })
      void qc.invalidateQueries({ queryKey: ["lessons"] })
      void qc.invalidateQueries({ queryKey: ["lesson"] })
      void qc.invalidateQueries({ queryKey: ["leaderboard"] })
    },
  })
}

export interface PronunciationInput {
  lessonId: string
  sentenceId: string
  audio: Blob
  /** Brauzer o'lchagan yozuv uzunligi — server tezlikni shundan hisoblaydi */
  durationMs: number
}

export function useAnalyzePronunciation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ lessonId, sentenceId, audio, durationMs }: PronunciationInput) => {
      const form = new FormData()
      // STT kengaytmaga qarab formatni aniqlaydi — nomni to'g'ri berish muhim.
      form.append("audio", audio, fileNameFor(audio.type))
      form.append("lessonId", lessonId)
      form.append("sentenceId", sentenceId)
      form.append("durationMs", String(Math.round(durationMs)))

      const res = await fetch("/api/pronunciation", {
        method: "POST",
        headers: authHeaders(),
        body: form,
      })
      if (!res.ok) throw await toError(res)
      return (await res.json()) as PronunciationReport
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["me"] })
      void qc.invalidateQueries({ queryKey: ["lessons"] })
      void qc.invalidateQueries({ queryKey: ["lesson"] })
    },
  })
}

function fileNameFor(mime: string): string {
  if (mime.includes("mp4")) return "recording.mp4"
  if (mime.includes("ogg")) return "recording.ogg"
  if (mime.includes("wav")) return "recording.wav"
  return "recording.webm"
}

/* ------------------------------------------------------------------- ovoz */

/**
 * TTS audiosini olib keladi. Kesh uch qavat: brauzer (`audio.ts`),
 * server xotirasi va MongoDB.
 *
 * `personal` — matn shu o'quvchiga xos (murabbiy izohi), keshlanmaydi.
 */
export async function fetchSpeech(text: string, personal = false): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ text, personal }),
  })
  if (!res.ok) throw await toError(res)
  return await res.blob()
}
