import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ArrowRight, CheckCircle2, Eye, EyeOff, Languages } from "lucide-react"
import { toast } from "sonner"

import { Screen } from "@/components/Layout"
import { SpeakButton } from "@/components/SpeakButton"
import { StressText } from "@/components/StressText"
import { AnalysisReport } from "@/components/reading/AnalysisReport"
import { RecordControl } from "@/components/reading/RecordControl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, useAnalyzePronunciation, useLesson } from "@/lib/api"
import { useRecorder, useSpeech } from "@/lib/audio"
import { stripStress } from "@shared/stress"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import {
  CHUNK_SIZE,
  chunkSentences,
  type Lesson,
  type LessonProgress,
  type ReadingChunk,
  type ReadingSentence,
} from "@shared/types"

/** Bitta bo'lak ustidagi urg'u mashqi. Bo'lak indeksi manzildan olinadi. */
export function ReadingScreen() {
  const { lessonId = "", chunk = "0" } = useParams()
  const { data, isLoading } = useLesson(lessonId)

  const backTo = `/lesson/${lessonId}/read`

  if (isLoading || !data) {
    return (
      <Screen title="Urg'u mashqi" backTo={backTo}>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </Screen>
    )
  }

  const chunks = chunkSentences(data.lesson.reading.sentences, data.progress.sentencesDone)
  const current = chunks[Number(chunk)]

  if (!current) {
    return (
      <Screen title="Urg'u mashqi" backTo={backTo}>
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Bu bo'lak topilmadi.
        </Card>
      </Screen>
    )
  }

  // Ma'lumot kelgandan keyingina ichki komponent yuklanadi —
  // shunda boshlang'ich gapni bir marta, render paytida hisoblash mumkin.
  return (
    <ReadingPractice
      key={current.index}
      lesson={data.lesson}
      progress={data.progress}
      chunk={current}
    />
  )
}

/* ------------------------------------------------------------ mashq oqimi */

function ReadingPractice({
  lesson,
  progress,
  chunk,
}: {
  lesson: Lesson
  progress: LessonProgress
  chunk: ReadingChunk
}) {
  const navigate = useNavigate()
  const sentences = chunk.sentences
  const done = new Set(progress.sentencesDone)
  const offset = chunk.index * CHUNK_SIZE

  // Hali o'qilmagan birinchi gapdan boshlaymiz.
  const [index, setIndex] = useState(() => {
    const next = sentences.findIndex((s) => !done.has(s.id))
    return next < 0 ? 0 : next
  })

  const sentence = sentences[index]
  const isLast = index === sentences.length - 1

  return (
    <Screen
      title={`${chunk.index + 1}-qism`}
      subtitle={`${offset + index + 1}-gap · bo'lakda ${index + 1} / ${sentences.length}`}
      backTo={`/lesson/${lesson.id}/read`}
      action={
        <div className="flex gap-1" aria-hidden>
          {sentences.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 w-3 rounded-full transition-colors",
                i === index ? "bg-primary" : done.has(s.id) ? "bg-success" : "bg-border",
              )}
            />
          ))}
        </div>
      }
    >
      {/* key — gap almashganda barcha mashq holati o'z-o'zidan tozalanadi */}
      <SentencePractice
        key={sentence.id}
        lessonId={lesson.id}
        sentence={sentence}
        alreadyDone={done.has(sentence.id)}
        isLast={isLast}
        onNext={() => {
          haptic.impact("medium")
          // Bo'lak tugadi — ro'yxatga qaytamiz, keyingisi o'sha yerda ko'rinadi.
          if (isLast) navigate(`/lesson/${lesson.id}/read`)
          else setIndex((i) => i + 1)
        }}
      />
    </Screen>
  )
}

/* ------------------------------------------------------------- bitta gap */

function SentencePractice({
  lessonId,
  sentence,
  alreadyDone,
  isLast,
  onNext,
}: {
  lessonId: string
  sentence: ReadingSentence
  alreadyDone: boolean
  isLast: boolean
  onNext: () => void
}) {
  const [showTranslation, setShowTranslation] = useState(false)

  const recorder = useRecorder()
  const speech = useSpeech()
  const analyze = useAnalyzePronunciation()

  const report = analyze.data ?? null

  const handleAnalyze = (blob: Blob, durationMs: number) => {
    analyze.mutate(
      { lessonId, sentenceId: sentence.id, audio: blob, durationMs },
      {
        onSuccess: (result) => {
          if (result.accuracy >= 0.85) haptic.success()
          else haptic.impact("medium")
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Tahlil qilishda xatolik. Qaytadan urinib ko'ring.",
          )
        },
      },
    )
  }

  return (
    <>
      {/* Matn */}
      <Card className="gap-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            O'qing
          </span>
          {alreadyDone && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-success">
              <CheckCircle2 className="size-3.5" />
              O'qilgan
            </span>
          )}
        </div>

        <StressText
          text={sentence.ru}
          className="text-[26px] leading-[1.75] font-medium tracking-tight"
          onWordClick={(word) => {
            haptic.select()
            void speech.play(stripStress(word), { key: `w-${word}` })
          }}
        />

        <p className="-mt-1 text-[11px] text-muted-foreground">
          Har qanday so'zni bosing — u alohida o'qib beriladi.
        </p>

        <SpeakButton
          text={sentence.ru}
          speech={speech}
          speakKey="sentence"
          label="Gapni eshitish"
          variant="secondary"
          size="lg"
          className="w-full"
        />

        <button
          type="button"
          onClick={() => {
            haptic.select()
            setShowTranslation((v) => !v)
          }}
          className="tap flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-sm"
        >
          {showTranslation ? (
            <EyeOff className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Eye className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1 text-muted-foreground">
            {showTranslation ? sentence.uz : "Tarjimani ko'rsatish"}
          </span>
          <Languages className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Card>

      {/* Yozib olish */}
      {!report && (
        <Card className="mt-4 p-5">
          <RecordControl
            recorder={recorder}
            onAnalyze={handleAnalyze}
            isAnalyzing={analyze.isPending}
          />
        </Card>
      )}

      {/* Tahlil */}
      {report && (
        <>
          <div className="mt-4">
            <AnalysisReport
              report={report}
              sentenceRu={sentence.ru}
              onRetry={() => {
                analyze.reset()
                recorder.reset()
              }}
            />
          </div>

          <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg border-t border-border bg-card/90 px-4 pt-3 backdrop-blur-lg">
            <Button size="lg" className="w-full" onClick={onNext}>
              {isLast ? "Bo'limni yakunlash" : "Keyingi gap"}
              <ArrowRight />
            </Button>
          </div>
          {/* yopishqoq panel matnni to'smasin */}
          <div className="h-24" aria-hidden />
        </>
      )}
    </>
  )
}
