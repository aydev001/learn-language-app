import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Gamepad2,
  Medal,
  Target,
  Trophy,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeaderboard, useLessons } from "@/lib/api"
import { formatPercent } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import type { LeaderboardPeriod, LeaderboardRow, LeaderboardTotals } from "@shared/types"

/** Bir sahifada nechta o'quvchi ko'rinadi. */
const PAGE_SIZE = 10

export function LeaderboardScreen() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week")
  const [lessonId, setLessonId] = useState<string | null>(null)
  // null — hali sahifa tanlanmagan, ya'ni o'quvchining o'z sahifasi ochiladi.
  const [page, setPage] = useState<number | null>(null)

  const lessons = useLessons()
  const board = useLeaderboard(lessonId, period)

  const rows = board.data?.rows ?? []
  const podium = rows.slice(0, 3)
  const me = board.data?.me

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const myIndex = rows.findIndex((r) => r.isMe)
  const myPage = myIndex >= 0 ? Math.floor(myIndex / PAGE_SIZE) : 0

  // Filtr o'zgarsa sahifa yana o'z o'rnimizga qaytadi (setPage(null) orqali).
  const current = Math.min(page ?? myPage, pageCount - 1)
  const visible = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  /** Davr yoki dars almashganda sahifani boshidan hisoblaymiz. */
  const changeFilter = (apply: () => void) => {
    apply()
    setPage(null)
  }

  return (
    <div className="safe-top px-4 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Reyting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tezlik testlarida to'plangan ballar bo'yicha
        </p>
      </div>

      {/* Davr */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            { id: "week", label: "Shu hafta" },
            { id: "all", label: "Butun vaqt" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              haptic.select()
              changeFilter(() => setPeriod(tab.id))
            }}
            className={cn(
              "tap rounded-lg py-2 text-sm font-medium transition-colors",
              period === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dars filtri */}
      <div className="-mx-4 mt-3 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          <FilterChip
            active={lessonId === null}
            onClick={() => changeFilter(() => setLessonId(null))}
          >
            Barcha darslar
          </FilterChip>
          {lessons.data?.map((lesson) => (
            <FilterChip
              key={lesson.id}
              active={lessonId === lesson.id}
              onClick={() => changeFilter(() => setLessonId(lesson.id))}
            >
              {lesson.titleUz}
            </FilterChip>
          ))}
        </div>
      </div>

      {board.data && board.data.rows.length > 0 && <Totals totals={board.data.totals} />}

      {board.isLoading && (
        <div className="mt-5 space-y-2.5">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      )}

      {!board.isLoading && rows.length === 0 && (
        <Card className="mt-6 items-center gap-3 p-8 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-muted">
            <Users className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Hali hech kim o'ynamagan. Birinchi bo'ling — tezlik testini boshlang!
          </p>
        </Card>
      )}

      {podium.length > 0 && <Podium rows={podium} />}

      {rows.length > 0 && (
        <>
          <div className="mt-5 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Barcha o'quvchilar</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {rows.length} ta{myIndex >= 0 && ` · siz ${myIndex + 1}-o'rindasiz`}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {visible.map((row) => (
              <PlayerRow key={row.userId} row={row} />
            ))}
          </div>

          {pageCount > 1 && (
            <Pagination
              page={current}
              pageCount={pageCount}
              myPage={myIndex >= 0 ? myPage : null}
              onChange={setPage}
            />
          )}
        </>
      )}

      {/* O'quvchi ro'yxatda bo'lmasa (hujjati hali yaratilmagan) — alohida */}
      {me && myIndex < 0 && (
        <>
          <div className="my-3 text-center text-xs text-muted-foreground">• • •</div>
          <PlayerRow row={me} />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ qismlar */

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic.select()
        onClick()
      }}
      className={cn(
        "tap rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Pagination({
  page,
  pageCount,
  myPage,
  onChange,
}: {
  page: number
  pageCount: number
  /** O'quvchining o'z sahifasi — boshqa yerga o'tib ketsa qaytib kelish uchun */
  myPage: number | null
  onChange: (page: number) => void
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <PagerButton disabled={page === 0} onClick={() => onChange(page - 1)} label="Oldingi sahifa">
          <ChevronLeft className="size-4" />
        </PagerButton>

        {pageWindow(page, pageCount).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-0.5 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <PagerButton key={p} active={p === page} onClick={() => onChange(p)}>
              {p + 1}
            </PagerButton>
          ),
        )}

        <PagerButton
          disabled={page === pageCount - 1}
          onClick={() => onChange(page + 1)}
          label="Keyingi sahifa"
        >
          <ChevronRight className="size-4" />
        </PagerButton>
      </div>

      {myPage !== null && myPage !== page && (
        <button
          type="button"
          onClick={() => {
            haptic.select()
            onChange(myPage)
          }}
          className="tap text-xs font-medium text-primary"
        >
          Mening o'rnimga qaytish
        </button>
      )}
    </div>
  )
}

function PagerButton({
  children,
  onClick,
  active,
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        haptic.select()
        onClick()
      }}
      className={cn(
        "tap grid size-8 place-items-center rounded-lg border text-xs font-semibold tabular-nums transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  )
}

/**
 * Ekran tor — o'nlab sahifani chizib bo'lmaydi. Birinchi, oxirgi va hozirgi
 * sahifaning atrofi qoladi, orasi "…" bilan qisqartiriladi.
 */
function pageWindow(page: number, count: number): (number | null)[] {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i)

  const wanted = [...new Set([0, page - 1, page, page + 1, count - 1])]
    .filter((p) => p >= 0 && p < count)
    .sort((a, b) => a - b)

  const out: (number | null)[] = []
  let previous = -1
  for (const p of wanted) {
    if (previous >= 0 && p - previous > 1) out.push(null)
    out.push(p)
    previous = p
  }
  return out
}

function Totals({ totals }: { totals: LeaderboardTotals }) {
  const items = [
    { icon: Users, label: "O'quvchi", value: String(totals.players) },
    { icon: Gamepad2, label: "Test", value: String(totals.plays) },
    { icon: Target, label: "Aniqlik", value: formatPercent(totals.accuracy) },
  ]

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {items.map(({ icon: Icon, label, value }) => (
        <Card key={label} className="items-center gap-0 p-2.5">
          <Icon className="size-3.5 text-muted-foreground" />
          <div className="mt-1 text-base leading-none font-bold tabular-nums">{value}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
        </Card>
      ))}
    </div>
  )
}

const PODIUM_STYLE = [
  { height: "h-24", ring: "ring-stress", badge: "bg-stress text-stress-foreground", icon: Crown },
  { height: "h-18", ring: "ring-muted-foreground/40", badge: "bg-muted-foreground/20", icon: Medal },
  { height: "h-14", ring: "ring-stress/40", badge: "bg-stress/25", icon: Medal },
]

function Podium({ rows }: { rows: LeaderboardRow[] }) {
  // Ko'rgazmali tartib: 2 – 1 – 3
  const order = [rows[1], rows[0], rows[2]].filter(Boolean)

  return (
    <Card className="mt-5 flex-row items-end justify-center gap-3 p-4 pt-6">
      {order.map((row) => {
        const style = PODIUM_STYLE[row.rank - 1]
        const Icon = style.icon

        return (
          <div key={row.userId} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="relative">
              <Avatar className={cn("size-14 ring-2 ring-offset-2 ring-offset-card", style.ring)}>
                <AvatarImage src={row.photoUrl} alt="" />
                <AvatarFallback>{row.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full text-[11px] font-bold",
                  style.badge,
                )}
              >
                {row.rank === 1 ? <Icon className="size-3.5" /> : row.rank}
              </span>
            </div>

            <div className="w-full text-center">
              <div className={cn("truncate text-xs font-semibold", row.isMe && "text-primary")}>
                {row.isMe ? "Siz" : row.name}
              </div>
              {row.username && (
                <div className="truncate text-[10px] text-muted-foreground">@{row.username}</div>
              )}
              <div className="text-sm font-bold tabular-nums">{row.score}</div>
            </div>

            <div
              className={cn(
                "w-full rounded-t-xl bg-gradient-to-t from-primary/10 to-primary/30",
                style.height,
              )}
            />
          </div>
        )
      })}
    </Card>
  )
}

function PlayerRow({ row }: { row: LeaderboardRow }) {
  return (
    <Card
      className={cn(
        "flex-row items-center gap-3 p-3",
        row.isMe && "border-primary/50 bg-primary/5",
      )}
    >
      <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">
        {row.rank}
      </span>

      <Avatar className="size-9 shrink-0">
        <AvatarImage src={row.photoUrl} alt="" />
        <AvatarFallback>{row.name.slice(0, 1)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm font-semibold", row.isMe && "text-primary")}>
          {row.isMe ? `${row.name} (siz)` : row.name}
          {row.username && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              @{row.username}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {formatPercent(row.accuracy)} aniqlik · {row.plays} marta
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums">
        <Trophy className="size-3.5 text-stress" />
        {row.score}
      </div>
    </Card>
  )
}
