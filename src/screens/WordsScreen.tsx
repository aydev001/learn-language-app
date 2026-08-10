import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Check, RotateCcw, Timer, X } from "lucide-react"

import { Screen } from "@/components/Layout"
import { SpeakButton } from "@/components/SpeakButton"
import { StressWord } from "@/components/StressText"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useLesson } from "@/lib/api"
import { useSpeech } from "@/lib/audio"
import { shuffle } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import type { VocabWord } from "@shared/types"

/**
 * Kartochkalar — so'zlar bilan birinchi tanishuv.
 * Bu yerda ball yig'ilmaydi: maqsad — bosim ostida emas, xotirjam o'rganish.
 * "Takrorlash" bosilgan so'zlar navbat oxiriga qaytadi.
 */
export function WordsScreen() {
  const { lessonId = "" } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useLesson(lessonId)

  const words = useMemo(() => data?.lesson.vocabulary ?? [], [data])

  const [queue, setQueue] = useState<string[] | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [seen, setSeen] = useState(0)

  const speech = useSpeech()

  if (isLoading || !data) {
    return (
      <Screen title="So'z kartochkalari" backTo={`/lesson/${lessonId}`}>
        <Skeleton className="h-72 w-full rounded-3xl" />
      </Screen>
    )
  }

  // Birinchi renderdan keyin navbatni bir marta shakllantiramiz.
  const order = queue ?? words.map((w) => w.id)
  const currentId = order[0]
  const current = words.find((w) => w.id === currentId)
  const finished = !current

  const advance = (isKnown: boolean) => {
    if (!current) return
    haptic.impact(isKnown ? "light" : "medium")

    const rest = order.slice(1)
    setKnown((prev) => {
      const next = new Set(prev)
      if (isKnown) next.add(current.id)
      else next.delete(current.id)
      return next
    })
    // Bilmagan so'z navbat oxiriga qaytadi — takrorlash shu tarzda yuzaga keladi.
    setQueue(isKnown ? rest : [...rest, current.id])
    setSeen((s) => s + 1)
    setFlipped(false)
  }

  const restart = () => {
    setQueue(shuffle(words.map((w) => w.id)))
    setKnown(new Set())
    setSeen(0)
    setFlipped(false)
  }

  if (finished) {
    return (
      <Screen title="So'z kartochkalari" backTo={`/lesson/${lessonId}`}>
        <Card className="animate-pop-in items-center gap-4 p-8 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-success-soft">
            <Check className="size-8 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Barcha so'zlar ko'rib chiqildi</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {words.length} ta so'zni {seen} ta kartochkada takrorladingiz.
            </p>
          </div>

          <div className="grid w-full gap-2">
            <Button size="lg" onClick={() => navigate(`/lesson/${lessonId}/sprint`)}>
              <Timer />
              Endi tezlik testini sinang
            </Button>
            <Button variant="outline" size="lg" onClick={restart}>
              <RotateCcw />
              Yana bir marta
            </Button>
          </div>
        </Card>
      </Screen>
    )
  }

  const remaining = order.length
  const progress = words.length ? (known.size / words.length) * 100 : 0

  return (
    <Screen
      title="So'z kartochkalari"
      subtitle={`${known.size} / ${words.length} o'zlashtirildi`}
      backTo={`/lesson/${lessonId}`}
    >
      <Progress value={progress} className="h-1.5" />

      <Flashcard
        word={current}
        flipped={flipped}
        onFlip={() => {
          haptic.select()
          setFlipped((v) => !v)
        }}
        speech={speech}
      />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          size="lg"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => advance(false)}
        >
          <X />
          Takrorlash
        </Button>
        <Button
          size="lg"
          className="bg-success text-success-foreground hover:bg-success/90"
          onClick={() => advance(true)}
        >
          <Check />
          Bilaman
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Navbatda {remaining} ta karta · Kartani bosib tarjimasini ko'ring
      </p>
    </Screen>
  )
}

/* -------------------------------------------------------------- kartochka */

function Flashcard({
  word,
  flipped,
  onFlip,
  speech,
}: {
  word: VocabWord
  flipped: boolean
  onFlip: () => void
  speech: ReturnType<typeof useSpeech>
}) {
  return (
    <Card
      onClick={onFlip}
      className="tap animate-pop-in mt-4 min-h-64 cursor-pointer justify-center gap-4 p-6 text-center"
    >
      {word.pos && (
        <Badge variant="secondary" className="mx-auto">
          {word.pos}
        </Badge>
      )}

      <StressWord word={word.ru} className="text-4xl leading-tight font-bold" />

      <div
        className={cn(
          "transition-all duration-200",
          flipped ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <p className="text-xl font-semibold text-primary">{word.uz}</p>

        {word.example && (
          <div className="mt-4 space-y-1 rounded-xl bg-muted/60 p-3 text-left">
            <StressWord word={word.example.ru} className="text-sm leading-relaxed" />
            <p className="text-xs text-muted-foreground">{word.example.uz}</p>
          </div>
        )}
      </div>

      {!flipped && <p className="text-sm text-muted-foreground">Tarjimani ko'rish uchun bosing</p>}

      {/* Kartani bosib qo'ymaslik uchun tugma bosilishini to'xtatamiz */}
      <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        <SpeakButton
          text={word.ru}
          speech={speech}
          speakKey={`w-${word.id}`}
          label="So'z"
          variant="secondary"
        />
        {word.example && (
          <SpeakButton
            text={word.example.ru}
            speech={speech}
            speakKey={`ex-${word.id}`}
            label="Gap"
          />
        )}
      </div>
    </Card>
  )
}
