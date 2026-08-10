import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Shuffle, Timer, Zap } from "lucide-react"

import { Screen } from "@/components/Layout"
import { StressWord } from "@/components/StressText"
import { QuizRunner, type QuizQuestion } from "@/components/vocab/QuizRunner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLesson } from "@/lib/api"
import { pickDistractors, shuffle } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import { maxScore, QUESTION_SECONDS } from "@shared/scoring"
import type { VocabWord } from "@shared/types"

const OPTION_COUNT = 4

type Direction = "ru-uz" | "uz-ru" | "mixed"

const DIRECTIONS: { id: Direction; label: string; hint: string }[] = [
  { id: "ru-uz", label: "Ruscha → O'zbekcha", hint: "Eng oson boshlash" },
  { id: "uz-ru", label: "O'zbekcha → Ruscha", hint: "Faol so'z boyligi" },
  { id: "mixed", label: "Aralash", hint: "Eng qiyini" },
]

/** Tezlik testi: so'z ko'rsatiladi, tarjimasini imkon qadar tez topish kerak. */
export function SprintScreen() {
  const { lessonId = "" } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useLesson(lessonId)

  const [direction, setDirection] = useState<Direction>("ru-uz")
  const [round, setRound] = useState(0)
  const [started, setStarted] = useState(false)

  const words = useMemo(() => data?.lesson.vocabulary ?? [], [data])

  // `round` o'zgarganda savollar qaytadan aralashadi.
  const questions = useMemo(
    () => (words.length >= OPTION_COUNT ? buildQuestions(words, direction) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, direction, round],
  )

  if (isLoading || !data) {
    return (
      <Screen title="Tezlik testi" backTo={`/lesson/${lessonId}`}>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </Screen>
    )
  }

  if (questions.length === 0) {
    return (
      <Screen title="Tezlik testi" backTo={`/lesson/${lessonId}`}>
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Test uchun kamida {OPTION_COUNT} ta so'z kerak. Bu darsda yetarli so'z yo'q.
        </Card>
      </Screen>
    )
  }

  if (!started) {
    return (
      <Screen title="Tezlik testi" subtitle={data.lesson.titleUz} backTo={`/lesson/${lessonId}`}>
        <Card className="gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-stress/15">
              <Zap className="size-5 text-stress" />
            </div>
            <div>
              <h2 className="font-semibold">Qoidalar</h2>
              <p className="text-xs text-muted-foreground">
                {questions.length} ta savol · har biriga {QUESTION_SECONDS.sprint} soniya
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Timer className="mt-0.5 size-4 shrink-0 text-primary" />
              Qanchalik tez javob bersangiz, shuncha ko'p ball olasiz.
            </li>
            <li className="flex gap-2">
              <Zap className="mt-0.5 size-4 shrink-0 text-stress" />
              Hammasini to'g'ri topsangiz — qo'shimcha bonus.
            </li>
            <li className="flex gap-2">
              <Shuffle className="mt-0.5 size-4 shrink-0 text-success" />
              Maksimal ball: {maxScore(questions.length)}
            </li>
          </ul>
        </Card>

        <Card className="mt-4 gap-3 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Yo'nalishni tanlang</h3>
          <div className="grid gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  haptic.select()
                  setDirection(d.id)
                }}
                className={cn(
                  "tap flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-colors",
                  direction === d.id ? "border-primary bg-accent" : "border-border bg-card",
                )}
              >
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{d.label}</span>
                  <span className="block text-xs text-muted-foreground">{d.hint}</span>
                </span>
                <span
                  className={cn(
                    "size-4 shrink-0 rounded-full border-2",
                    direction === d.id ? "border-primary bg-primary" : "border-border",
                  )}
                />
              </button>
            ))}
          </div>
        </Card>

        <Button
          size="lg"
          className="mt-4 w-full"
          onClick={() => {
            haptic.impact("heavy")
            setStarted(true)
          }}
        >
          <Zap />
          Boshlash
        </Button>
      </Screen>
    )
  }

  return (
    <Screen title="Tezlik testi" subtitle={data.lesson.titleUz} backTo={`/lesson/${lessonId}`}>
      <QuizRunner
        key={round}
        questions={questions}
        lessonId={lessonId}
        mode="sprint"
        onExit={() => navigate(`/lesson/${lessonId}`)}
        onSeeRating={() => navigate("/rating")}
        onPlayAgain={() => {
          setRound((r) => r + 1)
          setStarted(false)
        }}
      />
    </Screen>
  )
}

/* ------------------------------------------------------------- savollar */

function buildQuestions(words: VocabWord[], direction: Direction): QuizQuestion[] {
  return shuffle(words).map((word) => {
    const ruToUz =
      direction === "ru-uz" || (direction === "mixed" && Math.random() < 0.5)

    const correct = ruToUz ? word.uz : word.ru
    const distractors = pickDistractors(
      words.map((w) => (ruToUz ? w.uz : w.ru)),
      correct,
      OPTION_COUNT - 1,
    )
    const options = shuffle([correct, ...distractors])

    return {
      wordId: word.id,
      prompt: ruToUz ? (
        <StressWord word={word.ru} className="text-3xl font-bold" />
      ) : (
        <span className="text-3xl font-bold">{word.uz}</span>
      ),
      hint: (
        <span className="text-xs text-muted-foreground">
          {ruToUz ? "O'zbekcha tarjimasini tanlang" : "Ruscha muqobilini tanlang"}
        </span>
      ),
      options,
      correctIndex: options.indexOf(correct),
    }
  })
}
