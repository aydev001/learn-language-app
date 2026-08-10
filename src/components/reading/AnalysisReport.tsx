import { useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle2,
  Ear,
  Gauge,
  Lightbulb,
  MessageCircleWarning,
  RotateCcw,
} from "lucide-react"

import { ProgressRing } from "@/components/ProgressRing"
import { SpeakButton } from "@/components/SpeakButton"
import { StressText, StressWord, SyllableChips } from "@/components/StressText"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSpeech } from "@/lib/audio"

import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import { stripStress } from "@shared/stress"
import type { PronunciationReport, WordJudgement, WordStatus } from "@shared/types"

const STATUS_LABEL: Record<WordStatus, string> = {
  ok: "To'g'ri",
  stress: "Urg'u",
  sound: "Talaffuz",
  missing: "Tushib qoldi",
  extra: "Ortiqcha",
}

export function AnalysisReport({
  report,
  sentenceRu,
  onRetry,
}: {
  report: PronunciationReport
  sentenceRu: string
  onRetry: () => void
}) {
  const speech = useSpeech()
  const coachPlayed = useRef(false)

  // Tahlil tugagach izohni bir marta o'zi yangratamiz.
  // Brauzer to'sib qo'ysa — tugma baribir joyida turadi.
  useEffect(() => {
    if (coachPlayed.current || !report.coachScript) return
    coachPlayed.current = true
    void speech.play(report.coachScript, { key: "coach" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.coachScript])

  const statuses = useMemo(() => {
    const map: Record<number, WordStatus> = {}
    let index = 0
    for (const word of report.words) {
      if (word.status === "extra") continue
      map[index++] = word.status
    }
    return map
  }, [report.words])

  const issues = report.words.filter((w) => w.status !== "ok" && w.expected)
  const extras = report.words.filter((w) => w.status === "extra")
  const perfect = issues.length === 0 && extras.length === 0

  return (
    <div className="animate-slide-up space-y-4">
      <ScoreCard report={report} perfect={perfect} />

      {/* Ovozli izoh */}
      <Card className="gap-3 border-primary/25 bg-primary/5 p-4">
        <div className="flex items-start gap-2.5">
          <Ear className="mt-0.5 size-4.5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed">{report.summaryUz}</p>
        </div>

        <SpeakButton
          text={report.coachScript}
          speakKey="coach"
          speech={speech}
          variant="default"
          size="lg"
          label="Murabbiy izohini eshitish"
          className="w-full"
        />
      </Card>

      {/* So'zma-so'z natija */}
      <Card className="gap-3 p-4">
        <h3 className="text-sm font-semibold text-muted-foreground">So'zlar bo'yicha natija</h3>
        <StressText text={sentenceRu} statuses={statuses} className="text-lg" />
        <Legend />
        {report.transcript && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">Ilova nimani eshitdi?</summary>
            <p className="mt-1.5 rounded-lg bg-muted p-2.5 leading-relaxed">{report.transcript}</p>
          </details>
        )}
      </Card>

      {/* Xato so'zlar ustida mashq */}
      {issues.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <MessageCircleWarning className="size-4" />
            Mashq qilamiz ({issues.length})
          </h3>
          {issues.map((word, i) => (
            <IssueCard key={`${word.expected}-${i}`} word={word} speech={speech} />
          ))}
        </section>
      )}

      {extras.length > 0 && (
        <Card className="gap-2 border-destructive/25 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-destructive">Matnda yo'q so'zlar</h3>
          <p className="text-sm text-muted-foreground">
            {extras.map((w) => w.heard).filter(Boolean).join(", ")}
          </p>
        </Card>
      )}

      {report.tips.length > 0 && (
        <Card className="gap-2 p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Lightbulb className="size-4" />
            Maslahatlar
          </h3>
          <ul className="space-y-1.5">
            {report.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button variant="outline" size="lg" className="w-full" onClick={onRetry}>
        <RotateCcw />
        Qaytadan o'qish
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ bo'laklar */

function ScoreCard({ report, perfect }: { report: PronunciationReport; perfect: boolean }) {
  const pct = Math.round(report.accuracy * 100)
  const tone = pct >= 85 ? "success" : pct >= 60 ? "stress" : "destructive"

  return (
    <Card className="flex-row items-center gap-4 p-4">
      <ProgressRing
        value={report.accuracy}
        size={78}
        thickness={7}
        className={
          tone === "success" ? "stroke-success" : tone === "stress" ? "stroke-stress" : "stroke-destructive"
        }
      >
        <div className="text-center">
          <div className="text-xl leading-none font-bold tabular-nums">{pct}</div>
          <div className="text-[9px] text-muted-foreground">%</div>
        </div>
      </ProgressRing>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          {perfect ? (
            <>
              <CheckCircle2 className="size-4 text-success" />
              <span className="font-semibold text-success">Mukammal o'qildi!</span>
            </>
          ) : (
            <span className="font-semibold">
              {pct >= 85 ? "Juda yaxshi" : pct >= 60 ? "Yaxshi, davom eting" : "Yana mashq kerak"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gauge className="size-3.5" />
            {Math.round(report.wpm)} so'z/daq
          </span>
          <span>{(report.durationMs / 1000).toFixed(1)} s</span>
        </div>

        {report.degraded && (
          <p className="text-[11px] text-muted-foreground">
            Batafsil tahlil vaqtincha ishlamadi — mexanik solishtiruv ko'rsatilmoqda.
          </p>
        )}
      </div>
    </Card>
  )
}

function Legend() {
  const items: { status: WordStatus; className: string }[] = [
    { status: "ok", className: "bg-success-soft text-success" },
    { status: "stress", className: "bg-stress-soft text-stress" },
    { status: "sound", className: "bg-destructive/12 text-destructive" },
    { status: "missing", className: "bg-muted text-muted-foreground" },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ status, className }) => (
        <span key={status} className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", className)}>
          {STATUS_LABEL[status]}
        </span>
      ))}
    </div>
  )
}

/**
 * Bitta xato so'z ustidagi mashq:
 * o'quvchi urg'uli bo'g'inni topadi, keyin to'g'ri talaffuzni eshitadi.
 */
function IssueCard({
  word,
  speech,
}: {
  word: WordJudgement
  speech: ReturnType<typeof useSpeech>
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const canDrill = word.correctSyllable >= 0 && word.syllables.length > 1
  const revealed = picked !== null || !canDrill

  const handlePick = (index: number) => {
    setPicked(index)
    const right = index === word.correctSyllable
    if (right) haptic.success()
    else haptic.error()
    void speech.play(stripStress(word.expected), { key: `drill-${word.expected}` })
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StressWord word={word.expected} className="text-2xl font-semibold" />
          {word.heard && word.heard !== stripStress(word.expected) && (
            <p className="mt-1 text-xs text-muted-foreground">
              Siz aytdingiz: <span className="font-medium text-destructive">{word.heard}</span>
            </p>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0",
            word.status === "stress" && "border-stress/40 text-stress",
            word.status === "sound" && "border-destructive/40 text-destructive",
          )}
        >
          {STATUS_LABEL[word.status]}
        </Badge>
      </div>

      {word.hintUz && <p className="text-sm leading-relaxed text-muted-foreground">{word.hintUz}</p>}

      {canDrill && (
        <div className="space-y-2.5">
          <p className="text-center text-xs font-medium text-muted-foreground">
            {picked === null
              ? "Qaysi bo'g'inga urg'u tushadi?"
              : picked === word.correctSyllable
                ? "To'g'ri! ✓"
                : "Urg'u boshqa bo'g'inda — yuqorida rangli ko'rsatildi."}
          </p>
          <SyllableChips
            word={word.expected}
            selected={picked}
            correct={word.correctSyllable}
            revealed={revealed}
            onSelect={handlePick}
          />
        </div>
      )}

      <SpeakButton
        text={stripStress(word.expected)}
        speakKey={`drill-${word.expected}`}
        speech={speech}
        variant="secondary"
        label="To'g'ri talaffuzni eshitish"
        className="w-full"
      />
    </Card>
  )
}
