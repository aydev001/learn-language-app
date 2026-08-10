import { Link, useParams } from "react-router"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Headphones,
  Layers,
  Mic,
  MessageSquareQuote,
  Timer,
} from "lucide-react"

import { ProgressRing } from "@/components/ProgressRing"
import { Screen } from "@/components/Layout"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLesson } from "@/lib/api"
import { formatDate, formatDue, formatPercent } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import { maxScore } from "@shared/scoring"
import { CHUNK_SIZE } from "@shared/types"

export function LessonScreen() {
  const { lessonId } = useParams()
  const { data, isLoading, isError } = useLesson(lessonId)

  if (isLoading) {
    return (
      <Screen title="Yuklanmoqda…" backTo="/">
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      </Screen>
    )
  }

  if (isError || !data) {
    return (
      <Screen title="Dars topilmadi" backTo="/">
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Bu darsni ochib bo'lmadi. Bosh sahifaga qaytib, qaytadan urinib ko'ring.
        </Card>
      </Screen>
    )
  }

  const { lesson, progress } = data
  const due = formatDue(lesson.dueAt)
  const readDone = progress.sentencesDone.length
  const readTotal = lesson.reading.sentences.length
  const chunkCount = Math.ceil(readTotal / CHUNK_SIZE)
  const vocabRatio = Math.min(1, progress.vocabBestScore / maxScore(lesson.vocabulary.length))

  return (
    <Screen
      title={lesson.title}
      subtitle={lesson.titleUz}
      backTo="/"
      action={
        <ProgressRing value={progress.completion} size={42} thickness={4}>
          <span className="text-[10px] font-bold tabular-nums">
            {Math.round(progress.completion * 100)}
          </span>
        </ProgressRing>
      }
    >
      {/* Umumiy ma'lumot */}
      <Card className="gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lesson.level}</Badge>
          <Badge variant="outline">{lesson.topic}</Badge>
          <span
            className={cn(
              "ml-auto flex items-center gap-1 text-xs font-medium",
              due.tone === "late"
                ? "text-destructive"
                : due.tone === "soon"
                  ? "text-stress"
                  : "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-3.5" />
            {due.text}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{lesson.reading.introUz}</p>
        <p className="text-xs text-muted-foreground/80">Berilgan: {formatDate(lesson.assignedAt)}</p>
      </Card>

      {/* 1-modul */}
      <ModuleCard
        step={1}
        title="Matn ustida ishlash"
        description={
          `Avval butun matnni tinglang, so'ng ${chunkCount} ta qismga bo'lib ` +
          `o'qing — ilova urg'ularingizni tahlil qilib, xatolarni tushuntiradi.`
        }
        icon={Mic}
        accent="primary"
        progressLabel={`${readDone} / ${readTotal} gap o'qildi`}
        progress={readTotal ? readDone / readTotal : 0}
        actions={[
          {
            to: `/lesson/${lesson.id}/listen`,
            label: "Matnni eshitish",
            icon: Headphones,
          },
          {
            to: `/lesson/${lesson.id}/read`,
            label: readDone ? "Urg'u mashqini davom ettirish" : "Urg'u mashqi",
            icon: Mic,
            primary: true,
          },
        ]}
      />

      {/* 2-modul */}
      <ModuleCard
        step={2}
        title="So'zlarni yodlash"
        description={`${lesson.vocabulary.length} ta so'z. Avval kartochkalar bilan tanishing, keyin tezlik testida sinab ko'ring.`}
        icon={Layers}
        accent="stress"
        progressLabel={
          progress.vocabPlays
            ? `Eng yaxshi ball: ${progress.vocabBestScore}`
            : "Hali o'ynalmagan"
        }
        progress={vocabRatio}
        actions={[
          { to: `/lesson/${lesson.id}/words`, label: "Kartochkalar", icon: Layers },
          { to: `/lesson/${lesson.id}/sprint`, label: "Tezlik testi", icon: Timer, primary: true },
          { to: `/lesson/${lesson.id}/quiz`, label: "Gapda ishlatish", icon: MessageSquareQuote },
        ]}
      />

      {progress.completion >= 1 && (
        <Card className="mt-4 flex-row items-center gap-3 border-success/40 bg-success-soft p-4">
          <CheckCircle2 className="size-5 shrink-0 text-success" />
          <p className="text-sm font-medium text-success">
            Bu vazifa to'liq bajarildi. Barakalla!
          </p>
        </Card>
      )}
    </Screen>
  )
}

/* ------------------------------------------------------------ modul kartasi */

interface ModuleAction {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
}

function ModuleCard({
  step,
  title,
  description,
  icon: Icon,
  accent,
  progress,
  progressLabel,
  actions,
}: {
  step: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  accent: "primary" | "stress"
  progress: number
  progressLabel: string
  actions: ModuleAction[]
}) {
  const accentClasses =
    accent === "primary"
      ? { chip: "bg-primary/12 text-primary", ring: "stroke-primary" }
      : { chip: "bg-stress/15 text-stress", ring: "stroke-stress" }

  return (
    <Card className="mt-4 gap-4 p-4">
      <div className="flex items-start gap-3">
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", accentClasses.chip)}>
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {step}-modul
          </div>
          <h3 className="text-base leading-tight font-semibold">{title}</h3>
        </div>

        <ProgressRing value={progress} size={40} thickness={4} className={accentClasses.ring}>
          <span className="text-[10px] font-bold tabular-nums">{formatPercent(progress)}</span>
        </ProgressRing>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      <p className="-mt-1 text-xs font-medium text-muted-foreground/90">{progressLabel}</p>

      <div className="grid gap-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            onClick={() => haptic.impact("medium")}
            className={cn(
              "tap flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors",
              action.primary
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-card hover:bg-muted",
            )}
          >
            <action.icon className="size-4" />
            {action.label}
            <ArrowRight className="ml-auto size-4 opacity-70" />
          </Link>
        ))}
      </div>
    </Card>
  )
}
