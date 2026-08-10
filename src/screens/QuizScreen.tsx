import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"

import { Screen } from "@/components/Layout"
import { StressText } from "@/components/StressText"
import { QuizRunner, type QuizQuestion } from "@/components/vocab/QuizRunner"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLesson } from "@/lib/api"
import { pickDistractors, shuffle } from "@/lib/format"
import { QUESTION_SECONDS } from "@shared/scoring"
import type { VocabWord } from "@shared/types"

const OPTION_COUNT = 4

/**
 * Gapda ishlatish testi: so'z alohida emas, jonli gap ichida beriladi.
 * O'quvchi butun gapning ma'nosini tanlaydi — bu so'zni kontekstda mustahkamlaydi.
 */
export function QuizScreen() {
  const { lessonId = "" } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useLesson(lessonId)

  const [round, setRound] = useState(0)

  const withExamples = useMemo(
    () => (data?.lesson.vocabulary ?? []).filter((w) => w.example),
    [data],
  )

  const questions = useMemo(
    () => (withExamples.length >= OPTION_COUNT ? buildQuestions(withExamples) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [withExamples, round],
  )

  if (isLoading || !data) {
    return (
      <Screen title="Gapda ishlatish" backTo={`/lesson/${lessonId}`}>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </Screen>
    )
  }

  if (questions.length === 0) {
    return (
      <Screen title="Gapda ishlatish" backTo={`/lesson/${lessonId}`}>
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Bu darsda misol gaplar yetarli emas. Avval tezlik testini sinab ko'ring.
        </Card>
      </Screen>
    )
  }

  return (
    <Screen
      title="Gapda ishlatish"
      subtitle={`${questions.length} ta gap · ${QUESTION_SECONDS.sentence} soniyadan`}
      backTo={`/lesson/${lessonId}`}
    >
      <QuizRunner
        key={round}
        questions={questions}
        lessonId={lessonId}
        mode="sentence"
        onExit={() => navigate(`/lesson/${lessonId}`)}
        onSeeRating={() => navigate("/rating")}
        onPlayAgain={() => setRound((r) => r + 1)}
      />
    </Screen>
  )
}

function buildQuestions(words: VocabWord[]): QuizQuestion[] {
  const allTranslations = words.map((w) => w.example!.uz)

  return shuffle(words).map((word) => {
    const correct = word.example!.uz
    const options = shuffle([
      correct,
      ...pickDistractors(allTranslations, correct, OPTION_COUNT - 1),
    ])

    return {
      wordId: word.id,
      prompt: (
        <StressText text={word.example!.ru} className="text-xl leading-relaxed font-medium" />
      ),
      hint: <span className="text-xs text-muted-foreground">Gapning tarjimasini tanlang</span>,
      options,
      correctIndex: options.indexOf(correct),
    }
  })
}
