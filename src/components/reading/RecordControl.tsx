import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2, Mic, Pause, Play, RotateCcw, Sparkles, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { useRecorder } from "@/lib/audio"
import { stopSpeech } from "@/lib/audio"
import { formatClock } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"

interface RecordControlProps {
  recorder: ReturnType<typeof useRecorder>
  onAnalyze: (blob: Blob, durationMs: number) => void
  isAnalyzing: boolean
}

/** Yozib olish → tinglash → tahlilga yuborish oqimi. */
export function RecordControl({ recorder, onAnalyze, isAnalyzing }: RecordControlProps) {
  const { state, recording, elapsedMs, level, error, start, stop, reset, maxMs } = recorder

  if (state === "unsupported" || state === "denied") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="text-sm">
          <p className="font-medium text-destructive">Mikrofon ishlamayapti</p>
          <p className="mt-0.5 text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void start()}>
            <RotateCcw />
            Qayta urinish
          </Button>
        </div>
      </div>
    )
  }

  if (recording && state === "stopped") {
    return (
      <div className="animate-slide-up space-y-3">
        <RecordingPlayback url={recording.url} durationMs={recording.durationMs} />

        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button variant="outline" size="lg" onClick={reset} disabled={isAnalyzing}>
            <RotateCcw />
            Qayta
          </Button>
          <Button
            size="lg"
            onClick={() => {
              haptic.impact("medium")
              stopSpeech()
              onAnalyze(recording.blob, recording.durationMs)
            }}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isAnalyzing ? "Tahlil qilinmoqda…" : "Tahlil qilish"}
          </Button>
        </div>
      </div>
    )
  }

  const isRecording = state === "recording"
  const isRequesting = state === "requesting"

  return (
    <div className="flex flex-col items-center gap-3">
      {isRecording && <LevelMeter level={level} />}

      <button
        type="button"
        disabled={isRequesting}
        onClick={() => {
          haptic.impact(isRecording ? "heavy" : "medium")
          if (isRecording) stop()
          else {
            stopSpeech()
            void start()
          }
        }}
        aria-label={isRecording ? "Yozishni to'xtatish" : "Ovozni yozish"}
        className={cn(
          "tap grid size-20 place-items-center rounded-full text-white shadow-lg transition-colors",
          isRecording
            ? "animate-rec-pulse bg-destructive"
            : "bg-brand disabled:opacity-60",
        )}
      >
        {isRequesting ? (
          <Loader2 className="size-8 animate-spin" />
        ) : isRecording ? (
          <Square className="size-7 fill-current" />
        ) : (
          <Mic className="size-8" />
        )}
      </button>

      <div className="text-center">
        {isRecording ? (
          <p className="font-mono text-sm tabular-nums">
            {formatClock(elapsedMs)}
            <span className="text-muted-foreground"> / {formatClock(maxMs)}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isRequesting ? "Mikrofonga ruxsat so'ralmoqda…" : "Bosing va gapni ovoz chiqarib o'qing"}
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- indikatorlar */

/** Ovoz balandligini ko'rsatuvchi ustunchalar — o'quvchi eshitilayotganini biladi. */
function LevelMeter({ level }: { level: number }) {
  const bars = [0.35, 0.65, 1, 0.65, 0.35]
  return (
    <div className="flex h-10 items-center gap-1.5" aria-hidden>
      {bars.map((weight, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-destructive transition-[height] duration-75"
          style={{ height: `${Math.max(6, level * weight * 40)}px` }}
        />
      ))}
    </div>
  )
}

/** O'z yozuvini tinglash. */
function RecordingPlayback({ url, durationMs }: { url: string; durationMs: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const audio = new Audio(url)
    audioRef.current = audio

    const onTime = () => {
      // MediaRecorder blob'larida `duration` ba'zan Infinity bo'ladi —
      // shuning uchun o'lchangan vaqtga tayanamiz.
      const total = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration * 1000
        : durationMs
      setProgress(Math.min(1, (audio.currentTime * 1000) / total))
    }
    const onEnd = () => {
      setPlaying(false)
      setProgress(0)
    }

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", onEnd)
      audioRef.current = null
    }
  }, [url, durationMs])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      stopSpeech()
      void audio.play()
      setPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/50 p-3">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pauza" : "O'z ovozini eshitish"}
        className="tap grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground">Sizning yozuvingiz</div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatClock(durationMs)}
      </span>
    </div>
  )
}
