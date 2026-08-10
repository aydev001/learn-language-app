import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  Crown,
  Flame,
  Gauge,
  Loader2,
  RotateCcw,
  Target,
  Trophy,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSubmitAttempt } from "@/lib/api"
import { formatSeconds } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import { attemptScore, questionLimitMs, wordPoints } from "@shared/scoring"
import type { VocabAttemptResult, VocabMode, WordResult } from "@shared/types"

export interface QuizQuestion {
  wordId: string
  /** Katta ko'rinadigan asosiy savol (ruscha so'z yoki gap) */
  prompt: React.ReactNode
  /** Savol tagidagi kichik izoh */
  hint?: React.ReactNode
  options: string[]
  correctIndex: number
}

interface QuizRunnerProps {
  questions: QuizQuestion[]
  lessonId: string
  mode: VocabMode
  onExit: () => void
  onPlayAgain: () => void
  onSeeRating: () => void
}

/** Javobdan keyin natijani ko'rsatib turish vaqti */
const FEEDBACK_MS = 750

export function QuizRunner({
  questions,
  lessonId,
  mode,
  onExit,
  onPlayAgain,
  onSeeRating,
}: QuizRunnerProps) {
  // Vaqt chegarasi rejimdan kelib chiqadi — ball ham shu chegaraga
  // nisbatan hisoblanadi, shuning uchun manba bitta bo'lishi shart.
  const limitMs = questionLimitMs(mode)

  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<WordResult[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [remainingMs, setRemainingMs] = useState(limitMs)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  // Vaqt render paytida emas, effekt ichida o'lchanadi — render toza qoladi.
  const startedAt = useRef(0)
  const questionStartedAt = useRef(0)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  const submit = useSubmitAttempt()
  const submitted = useRef(false)

  const question = questions[index]
  const finished = index >= questions.length

  const liveScore = useMemo(
    () => results.reduce((sum, r) => sum + wordPoints(r, mode), 0),
    [results, mode],
  )

  /* ------------------------------------------------------------- javob */

  const answer = useCallback(
    (choice: number | null) => {
      if (locked || !question) return

      const ms = Math.min(limitMs, Date.now() - questionStartedAt.current)
      const correct = choice === question.correctIndex

      setLocked(true)
      setSelected(choice)
      setResults((prev) => [...prev, { wordId: question.wordId, correct, ms }])

      setStreak((prev) => {
        const next = correct ? prev + 1 : 0
        setBestStreak((best) => Math.max(best, next))
        return next
      })

      if (correct) haptic.success()
      else haptic.error()

      advanceTimer.current = setTimeout(() => {
        setSelected(null)
        setLocked(false)
        setRemainingMs(limitMs)
        setIndex((i) => i + 1)
      }, FEEDBACK_MS)
    },
    [locked, question, limitMs],
  )

  /* ------------------------------------------------------------ taymer */

  useEffect(() => {
    if (finished || locked) return

    // Yangi savol ochildi — hisoblagichni shu yerdan boshlaymiz.
    questionStartedAt.current = Date.now()

    const tick = setInterval(() => {
      const left = limitMs - (Date.now() - questionStartedAt.current)
      if (left <= 0) {
        setRemainingMs(0)
        answer(null) // vaqt tugadi — javobsiz o'tadi
      } else {
        setRemainingMs(left)
      }
    }, 80)

    return () => clearInterval(tick)
  }, [finished, locked, limitMs, answer])

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    },
    [],
  )

  /* ----------------------------------------------------- natijani yuborish */

  useEffect(() => {
    if (!finished || submitted.current || results.length === 0) return
    submitted.current = true

    submit.mutate(
      {
        lessonId,
        mode,
        correct: results.filter((r) => r.correct).length,
        total: results.length,
        durationMs: Date.now() - startedAt.current,
        wordResults: results,
      },
      {
        onError: () =>
          toast.error("Natijani saqlab bo'lmadi, lekin ballingiz quyida ko'rinadi."),
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  /* ------------------------------------------------------------- natija */

  if (finished) {
    return (
      <ResultCard
        results={results}
        mode={mode}
        bestStreak={bestStreak}
        questions={questions}
        server={submit.data}
        isSaving={submit.isPending}
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        onSeeRating={onSeeRating}
      />
    )
  }

  const timeRatio = remainingMs / limitMs
  const urgent = timeRatio < 0.3

  return (
    <div className="space-y-4">
      {/* Yuqori qator: progress, ball, seriya */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {index + 1}/{questions.length}
        </span>

        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>

        {streak >= 2 && (
          <span className="flex items-center gap-0.5 text-xs font-bold text-stress">
            <Flame className="size-3.5" />
            {streak}
          </span>
        )}

        <span className="text-sm font-bold tabular-nums text-primary">{liveScore}</span>
      </div>

      {/* Vaqt chizig'i */}
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-100 ease-linear",
            urgent ? "bg-destructive" : "bg-stress",
          )}
          style={{ width: `${Math.max(0, timeRatio) * 100}%` }}
        />
      </div>

      {/* Savol */}
      <Card
        key={question.wordId}
        className="animate-pop-in min-h-36 items-center justify-center gap-2 p-6 text-center"
      >
        {question.prompt}
        {question.hint}
      </Card>

      {/* Javob variantlari */}
      <div className="grid gap-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex
          const isPicked = selected === i

          return (
            <button
              key={i}
              type="button"
              disabled={locked}
              onClick={() => answer(i)}
              className={cn(
                "tap flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-base font-medium transition-colors",
                "border-border bg-card",
                !locked && "hover:border-primary/50 hover:bg-accent",
                locked && isCorrect && "border-success bg-success-soft text-success",
                locked && isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                locked && !isCorrect && !isPicked && "opacity-45",
              )}
            >
              <span className="flex-1">{option}</span>
              {locked && isCorrect && <Check className="size-5 shrink-0" />}
              {locked && isPicked && !isCorrect && <X className="size-5 shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Vaqt tugab javobsiz o'tsa ham o'quvchi nima bo'lganini bilsin */}
      {locked && selected === null && (
        <p className="text-center text-sm font-medium text-destructive">Vaqt tugadi!</p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- natija */

function ResultCard({
  results,
  mode,
  bestStreak,
  questions,
  server,
  isSaving,
  onExit,
  onPlayAgain,
  onSeeRating,
}: {
  results: WordResult[]
  mode: VocabMode
  bestStreak: number
  questions: QuizQuestion[]
  server?: VocabAttemptResult
  isSaving: boolean
  onExit: () => void
  onPlayAgain: () => void
  onSeeRating: () => void
}) {
  const correct = results.filter((r) => r.correct).length
  const score = attemptScore(results, mode)
  const avgMs = results.length ? results.reduce((s, r) => s + r.ms, 0) / results.length : 0
  const accuracy = results.length ? correct / results.length : 0
  const wrong = results.filter((r) => !r.correct)

  const promptOf = (wordId: string) => questions.find((q) => q.wordId === wordId)

  return (
    <div className="animate-slide-up space-y-4">
      <Card className="items-center gap-3 p-6 text-center">
        <div
          className={cn(
            "grid size-16 place-items-center rounded-full",
            accuracy >= 0.8 ? "bg-success-soft" : "bg-stress-soft",
          )}
        >
          {accuracy >= 0.8 ? (
            <Trophy className="size-8 text-success" />
          ) : (
            <Target className="size-8 text-stress" />
          )}
        </div>

        <div>
          <div className="text-4xl leading-none font-bold tabular-nums text-brand">{score}</div>
          <div className="mt-1 text-sm text-muted-foreground">ball</div>
        </div>

        {server?.personalBest && (
          <Badge className="gap-1 bg-stress text-stress-foreground">
            <Crown className="size-3.5" />
            Shaxsiy rekord!
          </Badge>
        )}
        {server && !server.personalBest && server.previousBest > 0 && (
          <p className="text-xs text-muted-foreground">
            Eng yaxshi natijangiz: {server.previousBest} ball
          </p>
        )}

        <div className="mt-1 grid w-full grid-cols-3 gap-2">
          <Stat label="To'g'ri" value={`${correct}/${results.length}`} icon={Check} />
          <Stat label="O'rtacha" value={formatSeconds(avgMs)} icon={Gauge} />
          <Stat label="Seriya" value={String(bestStreak)} icon={Flame} />
        </div>

        <div className="mt-1 flex min-h-5 items-center gap-1.5 text-sm">
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Saqlanmoqda…</span>
            </>
          ) : server ? (
            <span className="font-medium">
              Reytingda <span className="text-primary">{server.rank}-o'rin</span> ({server.totalPlayers} ta
              o'quvchi orasida)
            </span>
          ) : null}
        </div>
      </Card>

      {wrong.length > 0 && (
        <Card className="gap-2.5 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Takrorlash kerak ({wrong.length})
          </h3>
          <ul className="divide-y divide-border">
            {wrong.map((r) => {
              const q = promptOf(r.wordId)
              return (
                <li key={r.wordId} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1 text-sm">{q?.prompt}</div>
                  <span className="shrink-0 text-sm font-medium text-success">
                    {q?.options[q.correctIndex]}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <div className="grid gap-2">
        <Button size="lg" onClick={onPlayAgain}>
          <RotateCcw />
          Yana o'ynash
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={onSeeRating}>
            <Trophy />
            Reyting
          </Button>
          <Button variant="ghost" size="lg" onClick={onExit}>
            Darsga qaytish
          </Button>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-xl bg-muted/60 px-2 py-2.5">
      <Icon className="mx-auto size-3.5 text-muted-foreground" />
      <div className="mt-1 text-sm leading-none font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
