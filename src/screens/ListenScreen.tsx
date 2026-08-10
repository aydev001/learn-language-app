import { useMemo, useState } from "react"
import { useParams } from "react-router"
import { Eye, EyeOff, Headphones, Loader2, Pause, Play, SkipBack } from "lucide-react"

import { Screen } from "@/components/Layout"
import { StressText } from "@/components/StressText"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLesson } from "@/lib/api"
import { useSpeechSequence } from "@/lib/audio"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"

/**
 * To'liq matnni tinglash.
 *
 * Bu yerda ovoz yozib olish yo'q — maqsad boshqa: o'quvchi butun hikoyani
 * bir butun holda, tabiiy ohangda eshitib, umumiy tasavvur oladi. Urg'u
 * ustidagi ish alohida ekranda, gaplarga bo'lib olib boriladi.
 */
export function ListenScreen() {
  const { lessonId = "" } = useParams()
  const { data, isLoading } = useLesson(lessonId)

  const [showTranslation, setShowTranslation] = useState(false)

  const paragraphs = useMemo(() => data?.lesson.reading.paragraphs ?? [], [data])
  const sequence = useSpeechSequence(paragraphs)

  if (isLoading || !data) {
    return (
      <Screen title="Matnni eshitish" backTo={`/lesson/${lessonId}`}>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </Screen>
    )
  }

  if (!paragraphs.length) {
    return (
      <Screen title="Matnni eshitish" backTo={`/lesson/${lessonId}`}>
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Bu darsda matn yo'q.
        </Card>
      </Screen>
    )
  }

  const { lesson } = data
  const playing = sequence.isActive

  // Tarjimani abzats bo'yicha ko'rsatish uchun gaplarni guruhlaymiz.
  const translations = groupTranslations(lesson.reading)

  return (
    <Screen
      title="Matnni eshitish"
      subtitle={lesson.titleUz}
      backTo={`/lesson/${lessonId}`}
      footer={
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              haptic.impact("medium")
              if (playing) sequence.stop()
              else void sequence.play(0)
            }}
          >
            {sequence.status === "loading" ? (
              <Loader2 className="animate-spin" />
            ) : playing ? (
              <Pause className="fill-current" />
            ) : (
              <Play className="fill-current" />
            )}
            {playing ? "To'xtatish" : "Boshidan eshitish"}
          </Button>

          {playing && sequence.index > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => void sequence.play(sequence.index - 1)}
              aria-label="Oldingi abzats"
            >
              <SkipBack />
            </Button>
          )}
        </div>
      }
    >
      <Card className="gap-2.5 p-4">
        <div className="flex items-center gap-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12">
            <Headphones className="size-4.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{lesson.title}</h2>
            <p className="text-xs text-muted-foreground">
              {paragraphs.length} abzats · {lesson.reading.sentences.length} gap
            </p>
          </div>
          <Badge variant="secondary">{lesson.level}</Badge>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Butun matnni tinglang. Abzatsni bosib, o'sha joydan boshlashingiz mumkin.
        </p>

        <button
          type="button"
          onClick={() => {
            haptic.select()
            setShowTranslation((v) => !v)
          }}
          className="tap flex items-center gap-2 self-start rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          {showTranslation ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {showTranslation ? "Tarjimani yashirish" : "Tarjimani ko'rsatish"}
        </button>
      </Card>

      <div className="mt-3 space-y-2.5">
        {paragraphs.map((paragraph, i) => {
          const active = sequence.index === i
          const done = sequence.index > i

          return (
            <Card
              key={i}
              onClick={() => {
                haptic.select()
                void sequence.play(i)
              }}
              className={cn(
                "tap cursor-pointer gap-2 p-4 transition-colors",
                active && "border-primary/60 bg-primary/5",
                done && !active && "opacity-70",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                {active && sequence.status === "loading" && (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                )}
                {active && sequence.status === "playing" && <SoundBars />}
              </div>

              <StressText
                text={paragraph}
                className={cn("text-[17px] leading-[1.9]", active && "font-medium")}
              />

              {showTranslation && translations[i] && (
                <p className="border-t border-dashed border-border pt-2 text-sm leading-relaxed text-muted-foreground">
                  {translations[i]}
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </Screen>
  )
}

/* ------------------------------------------------------------ yordamchi */

/** Abzatsdagi gaplar tarjimasini bitta matnga birlashtiradi. */
function groupTranslations(reading: {
  paragraphs: string[]
  sentences: { ru: string; uz: string }[]
}): string[] {
  const out: string[] = []
  let cursor = 0

  for (const paragraph of reading.paragraphs) {
    // Abzatsdagi gaplar sonini matnni solishtirib topamiz.
    let count = 0
    let matched = ""
    while (cursor + count < reading.sentences.length && matched.length < paragraph.length) {
      matched = matched
        ? `${matched} ${reading.sentences[cursor + count].ru}`
        : reading.sentences[cursor + count].ru
      count++
    }

    out.push(
      reading.sentences
        .slice(cursor, cursor + count)
        .map((s) => s.uz)
        .filter(Boolean)
        .join(" "),
    )
    cursor += count
  }

  return out
}

/** Yangrayotganini bildiruvchi kichik animatsiya. */
function SoundBars() {
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-0.5 animate-pulse rounded-full bg-primary"
          style={{ height: delay === 150 ? 12 : 8, animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}
