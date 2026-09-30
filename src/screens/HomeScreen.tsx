import { useState } from "react"
import { Link } from "react-router"
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  Flame,
  Hourglass,
  Mic,
  Sparkles,
  Target,
} from "lucide-react"

import { ProgressRing } from "@/components/ProgressRing"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, useLessons, useMe } from "@/lib/api"
import { formatDue, formatPercent, isPastDue } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import type { LessonSummary } from "@shared/types"

export function HomeScreen() {
  const me = useMe()
  const lessons = useLessons()

  /**
   * Ro'yxat sanasi bo'yicha teskari tartibda keladi, ya'ni birinchisi — eng
   * yangi vazifa. Uning muddati o'tgan bo'lsa, u endi "bugungi" emas: pastdagi
   * darslar qatoriga tushadi, o'rniga esa kutish haqida yozuv chiqadi.
   */
  const [newest, ...rest] = lessons.data ?? []
  const current = newest && !isPastDue(newest.dueAt) ? newest : undefined
  const earlier = current ? rest : newest ? [newest, ...rest] : []

  return (
    <div className="safe-top px-4 pb-4">
      <Greeting name={me.data?.firstName} loading={me.isLoading} />

      <StatsStrip
        streak={me.data?.stats.streak ?? 0}
        score={me.data?.stats.totalScore ?? 0}
        readings={me.data?.stats.readingsDone ?? 0}
        loading={me.isLoading}
      />

      {lessons.isLoading && <LessonSkeleton />}

      {lessons.isError && (
        <Card className="mt-5 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Vazifalarni yuklab bo'lmadi. Internetni tekshirib, qaytadan urinib ko'ring.
          <p className="mt-1.5 text-xs opacity-75">{describeError(lessons.error)}</p>
        </Card>
      )}

      {!lessons.isLoading && lessons.data && lessons.data.length > 0 && (
        <section className="mt-6">
          <SectionTitle icon={Sparkles}>Bugungi vazifa</SectionTitle>
          {current ? <CurrentLessonCard lesson={current} /> : <NoTaskYet />}
        </section>
      )}

      {earlier.length > 0 && (
        <section className="mt-7">
          <SectionTitle icon={BookOpenText}>Oldingi darslar</SectionTitle>
          <div className="mt-3 space-y-3">
            {groupByMonth(earlier).map((group, i) => (
              <MonthGroup key={group.month} {...group} defaultOpen={i === 0} />
            ))}
          </div>
        </section>
      )}

      {lessons.data?.length === 0 && (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Hozircha vazifa yo'q. O'qituvchi yangi dars qo'shganda shu yerda paydo bo'ladi.
          </p>
        </Card>
      )}
    </div>
  )
}

/** Oxirgi vazifaning muddati o'tgan, yangisi hali qo'yilmagan holat. */
function NoTaskYet() {
  return (
    <Card className="mt-3 flex-row items-center gap-3 p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
        <Hourglass className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">Bugungi vazifa hali qo'shilmadi</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tez orada qo'shiladi. Shu orada oldingi darslarni takrorlab turing.
        </p>
      </div>
    </Card>
  )
}

/**
 * Xatoning haqiqiy sababi. Busiz har qanday nosozlik — internet uzilishi,
 * 401, serverdagi xato — bir xil ko'rinardi va sababni topib bo'lmasdi.
 */
function describeError(error: unknown): string {
  if (error instanceof ApiError) return `${error.status} — ${error.message}`
  return error instanceof Error ? error.message : "Nomaʼlum xatolik"
}

/* --------------------------------------------------------------- bo'laklar */

function Greeting({ name, loading }: { name?: string; loading: boolean }) {
  return (
    <div className="pt-2">
      {loading ? (
        <Skeleton className="h-7 w-44" />
      ) : (
        <h1 className="text-2xl font-bold tracking-tight">
          Salom, {name ?? "o'quvchi"} <span className="align-middle">👋</span>
        </h1>
      )}
      <p className="mt-1 text-sm text-muted-foreground">Bugun rus tilini mashq qilamizmi?</p>
    </div>
  )
}

function StatsStrip({
  streak,
  score,
  readings,
  loading,
}: {
  streak: number
  score: number
  readings: number
  loading: boolean
}) {
  const items = [
    { icon: Flame, label: "Ketma-ket kun", value: streak, tone: "text-stress" },
    { icon: Target, label: "Umumiy ball", value: score, tone: "text-primary" },
    { icon: Mic, label: "O'qilgan gap", value: readings, tone: "text-success" },
  ]

  return (
    <div className="mt-4 grid grid-cols-3 gap-2.5">
      {items.map(({ icon: Icon, label, value, tone }) => (
        <Card key={label} className="gap-0 p-3">
          <Icon className={cn("size-4", tone)} />
          <div className="mt-1.5 text-xl leading-none font-bold tabular-nums">
            {loading ? <Skeleton className="h-5 w-8" /> : value}
          </div>
          <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</div>
        </Card>
      ))}
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
      <Icon className="size-4" />
      {children}
    </h2>
  )
}

function CurrentLessonCard({ lesson }: { lesson: LessonSummary }) {
  const due = formatDue(lesson.dueAt)
  const done = lesson.progress.completion >= 1

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      onClick={() => haptic.impact("medium")}
      className="tap mt-3 block overflow-hidden rounded-3xl"
    >
      <div className="bg-brand relative p-5 text-white">
        {/* nozik yorug'lik dog'i — gradientni jonlantiradi */}
        <div
          className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-white/15 blur-2xl"
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge className="border-white/25 bg-white/20 text-[11px] text-white">
                {lesson.level}
              </Badge>
              <span className="text-xs text-white/80">{lesson.topic}</span>
            </div>

            <h3 className="mt-2.5 truncate text-xl font-bold">{lesson.title}</h3>
            <p className="truncate text-sm text-white/80">{lesson.titleUz}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/85">
              <span>{lesson.sentenceCount} ta gap</span>
              <span className="opacity-50">•</span>
              <span>{lesson.wordCount} ta so'z</span>
            </div>
          </div>

          <ProgressRing
            value={lesson.progress.completion}
            size={62}
            thickness={6}
            className="stroke-white"
            trackClassName="stroke-white/25"
          >
            <span className="text-xs font-bold">{formatPercent(lesson.progress.completion)}</span>
          </ProgressRing>
        </div>

        <div className="relative mt-4 flex items-center justify-between rounded-2xl bg-white/15 px-3.5 py-2.5">
          <span
            className={cn(
              "text-xs font-medium",
              due.tone === "late" ? "text-white" : "text-white/90",
            )}
          >
            {done ? "Bajarildi ✓" : due.text}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            {done ? "Takrorlash" : "Boshlash"}
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Darslarni o'quv oylari bo'yicha guruhlaydi: eng yangi oy tepada.
 * Ro'yxat sanasi bo'yicha teskari tartibda keladi, guruh ichida ham shunday qoladi.
 */
function groupByMonth(lessons: LessonSummary[]): { month: number; lessons: LessonSummary[] }[] {
  const groups = new Map<number, LessonSummary[]>()
  for (const lesson of lessons) {
    const list = groups.get(lesson.month)
    if (list) list.push(lesson)
    else groups.set(lesson.month, [lesson])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([month, lessons]) => ({ month, lessons }))
}

/** Bir oyning darslari — sarlavhasini bosib yig'ish/ochish mumkin. */
function MonthGroup({
  month,
  lessons,
  defaultOpen,
}: {
  month: number
  lessons: LessonSummary[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const completion = lessons.reduce((sum, l) => sum + l.progress.completion, 0) / lessons.length

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          haptic.select()
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        className="tap flex w-full items-center gap-3 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-left"
      >
        <CalendarDays className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{month}-oy</div>
          <div className="text-xs text-muted-foreground">
            {lessons.length} ta dars · {formatPercent(completion)} bajarildi
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-2.5 space-y-2.5">
          {lessons.map((lesson) => (
            <EarlierLessonRow key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  )
}

function EarlierLessonRow({ lesson }: { lesson: LessonSummary }) {
  return (
    <Link to={`/lesson/${lesson.id}`} onClick={() => haptic.select()} className="tap block">
      <Card className="flex-row items-center gap-3.5 p-3.5">
        <ProgressRing value={lesson.progress.completion} size={44} thickness={4}>
          <span className="text-[10px] font-bold tabular-nums">
            {Math.round(lesson.progress.completion * 100)}
          </span>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{lesson.title}</div>
          <div className="truncate text-xs text-muted-foreground">
            {lesson.titleUz} · {lesson.wordCount} so'z
          </div>
        </div>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </Card>
    </Link>
  )
}

function LessonSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <Skeleton className="h-[72px] w-full rounded-2xl" />
      <Skeleton className="h-[72px] w-full rounded-2xl" />
    </div>
  )
}
