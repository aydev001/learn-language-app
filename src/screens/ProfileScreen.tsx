import { Flame, Gauge, Mic, Sparkles, Target, Timer, TriangleAlert } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/lib/api"
import { formatPercent } from "@/lib/format"
import { isTelegram } from "@/lib/telegram"
import { BASE_POINTS, MAX_SPEED_BONUS, PERFECT_BONUS } from "@shared/scoring"

export function ProfileScreen() {
  const { data, isLoading } = useMe()

  const fullName = [data?.firstName, data?.lastName].filter(Boolean).join(" ")

  const stats = [
    { icon: Flame, label: "Ketma-ket kun", value: data?.stats.streak ?? 0, tone: "text-stress" },
    { icon: Target, label: "Umumiy ball", value: data?.stats.totalScore ?? 0, tone: "text-primary" },
    { icon: Mic, label: "O'qilgan gap", value: data?.stats.readingsDone ?? 0, tone: "text-success" },
    { icon: Sparkles, label: "O'zlashtirilgan so'z", value: data?.stats.wordsMastered ?? 0, tone: "text-primary" },
    { icon: Timer, label: "O'ynalgan test", value: data?.stats.sprintsPlayed ?? 0, tone: "text-stress" },
    {
      icon: Gauge,
      label: "Eng yaxshi aniqlik",
      value: formatPercent(data?.stats.bestAccuracy ?? 0),
      tone: "text-success",
    },
  ]

  return (
    <div className="safe-top px-4 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
      </div>

      <Card className="mt-4 flex-row items-center gap-4 p-4">
        {isLoading ? (
          <>
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </>
        ) : (
          <>
            <Avatar className="size-16 ring-2 ring-primary/30 ring-offset-2 ring-offset-card">
              <AvatarImage src={data?.photoUrl} alt="" />
              <AvatarFallback className="text-xl">
                {data?.firstName?.slice(0, 1) ?? "?"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold">{fullName || "O'quvchi"}</h2>
              {data?.username && (
                <p className="truncate text-sm text-muted-foreground">@{data.username}</p>
              )}
              {data?.isAdmin && (
                <Badge variant="secondary" className="mt-1.5">
                  O'qituvchi
                </Badge>
              )}
            </div>
          </>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {stats.map(({ icon: Icon, label, value, tone }) => (
          <Card key={label} className="gap-0 p-3.5">
            <Icon className={`size-4 ${tone}`} />
            <div className="mt-2 text-2xl leading-none font-bold tabular-nums">
              {isLoading ? <Skeleton className="h-6 w-12" /> : value}
            </div>
            <div className="mt-1.5 text-[11px] leading-tight text-muted-foreground">{label}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 gap-2.5 p-4">
        <h3 className="text-sm font-semibold">Ball qanday hisoblanadi?</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• Har bir to'g'ri javob — {BASE_POINTS} ball.</li>
          <li>• Tez javob bergani uchun qo'shimcha {MAX_SPEED_BONUS} ballgacha bonus.</li>
          <li>• Butun testni xatosiz yakunlasangiz — yana {PERFECT_BONUS} ball.</li>
          <li>• Reytingda har bir dars bo'yicha eng yaxshi natijangiz hisobga olinadi.</li>
        </ul>
      </Card>

      {!isTelegram && (
        <Card className="mt-4 flex-row items-start gap-3 border-stress/40 bg-stress-soft p-4">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-stress" />
          <div className="text-sm">
            <p className="font-medium">Brauzer rejimi</p>
            <p className="mt-0.5 text-muted-foreground">
              Ilova Telegram tashqarisida ochilgan. Natijalar sinov foydalanuvchisi nomiga
              yozilmoqda.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
