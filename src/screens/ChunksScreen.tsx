import { Link, useParams } from "react-router"
import { ArrowRight, CheckCircle2, Mic } from "lucide-react"

import { Screen } from "@/components/Layout"
import { ProgressRing } from "@/components/ProgressRing"
import { StressText } from "@/components/StressText"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLesson } from "@/lib/api"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import { CHUNK_SIZE, chunkSentences } from "@shared/types"

/**
 * Urg'u mashqi bo'laklari.
 *
 * Matnda 20-40 gap bo'ladi — hammasini bir o'tirishda o'qish charchatadi.
 * Shuning uchun {@link CHUNK_SIZE} tadan bo'lib beramiz: o'quvchi bugun
 * bir bo'lakni tugatadi, ertaga keyingisini. Har bo'lakning o'z progressi
 * ko'rinib turadi.
 */
export function ChunksScreen() {
  const { lessonId = "" } = useParams()
  const { data, isLoading } = useLesson(lessonId)

  if (isLoading || !data) {
    return (
      <Screen title="Urg'u mashqi" backTo={`/lesson/${lessonId}`}>
        <div className="space-y-2.5">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </Screen>
    )
  }

  const { lesson, progress } = data
  const chunks = chunkSentences(lesson.reading.sentences, progress.sentencesDone)

  if (!chunks.length) {
    return (
      <Screen title="Urg'u mashqi" backTo={`/lesson/${lessonId}`}>
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Bu darsda o'qish uchun matn yo'q.
        </Card>
      </Screen>
    )
  }

  const totalDone = chunks.reduce((n, c) => n + c.done, 0)
  const nextIndex = chunks.findIndex((c) => c.done < c.sentences.length)

  return (
    <Screen
      title="Urg'u mashqi"
      subtitle={`${totalDone} / ${lesson.reading.sentences.length} gap o'qildi`}
      backTo={`/lesson/${lessonId}`}
      action={
        <ProgressRing value={totalDone / lesson.reading.sentences.length} size={40} thickness={4}>
          <span className="text-[10px] font-bold tabular-nums">
            {Math.round((totalDone / lesson.reading.sentences.length) * 100)}
          </span>
        </ProgressRing>
      }
    >
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
        {lesson.reading.introUz}
      </p>

      <div className="space-y-2.5">
        {chunks.map((chunk) => {
          const complete = chunk.done === chunk.sentences.length
          const isNext = chunk.index === nextIndex
          const first = chunk.sentences[0]
          const from = chunk.index * CHUNK_SIZE + 1
          const to = from + chunk.sentences.length - 1

          return (
            <Link
              key={chunk.index}
              to={`/lesson/${lessonId}/read/${chunk.index}`}
              onClick={() => haptic.impact("medium")}
              className="tap block"
            >
              <Card
                className={cn(
                  "gap-2.5 p-4 transition-colors",
                  isNext && "border-primary/60 bg-primary/5",
                  complete && "border-success/40",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-2xl text-sm font-bold",
                      complete
                        ? "bg-success-soft text-success"
                        : isNext
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {complete ? <CheckCircle2 className="size-5" /> : chunk.index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {chunk.index + 1}-qism
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {from}–{to} gap
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        complete ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {complete
                        ? "Bajarildi"
                        : chunk.done > 0
                          ? `${chunk.done} / ${chunk.sentences.length} o'qildi`
                          : "Boshlanmagan"}
                    </div>
                  </div>

                  {isNext ? (
                    <Mic className="size-4 shrink-0 text-primary" />
                  ) : (
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </div>

                {first && (
                  <StressText
                    text={truncate(first.ru, 72)}
                    className="text-sm leading-relaxed text-muted-foreground"
                  />
                )}
              </Card>
            </Link>
          )
        })}
      </div>
    </Screen>
  )
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…"
}
