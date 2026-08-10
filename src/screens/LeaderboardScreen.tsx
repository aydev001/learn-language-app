import { useState } from "react"
import { Crown, Gamepad2, Medal, Target, Trophy, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useLeaderboard, useLessons } from "@/lib/api"
import { formatPercent } from "@/lib/format"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import type { LeaderboardPeriod, LeaderboardRow, LeaderboardTotals } from "@shared/types"

export function LeaderboardScreen() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week")
  const [lessonId, setLessonId] = useState<string | null>(null)

  const lessons = useLessons()
  const board = useLeaderboard(lessonId, period)

  const rows = board.data?.rows ?? []
  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)
  const me = board.data?.me
  const meInList = me ? rows.some((r) => r.isMe && r.rank <= 3 + rest.length) : false

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
              setPeriod(tab.id)
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
          <FilterChip active={lessonId === null} onClick={() => setLessonId(null)}>
            Barcha darslar
          </FilterChip>
          {lessons.data?.map((lesson) => (
            <FilterChip
              key={lesson.id}
              active={lessonId === lesson.id}
              onClick={() => setLessonId(lesson.id)}
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

      {rest.length > 0 && (
        <div className="mt-3 space-y-2">
          {rest.map((row) => (
            <PlayerRow key={row.userId} row={row} />
          ))}
        </div>
      )}

      {/* O'zim ro'yxatga tushmasam — pastda alohida ko'rsatamiz */}
      {me && !meInList && (
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
