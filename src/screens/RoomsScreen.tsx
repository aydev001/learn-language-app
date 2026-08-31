import { useState } from "react"
import { useNavigate } from "react-router"
import {
  ChevronRight,
  Clapperboard,
  DoorOpen,
  Globe,
  Loader2,
  Lock,
  Play,
  Plus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { useCreateRoom, useMyRooms, usePublicRooms } from "@/lib/rooms"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import { youtubeThumbUrl } from "@shared/youtube"
import type { PublicRoomSummary, RoomSummary, RoomVisibility } from "@shared/types"

/**
 * "Kino" bo'limi — uylar ro'yxati va yangi uy yaratish.
 *
 * Uy = do'stlar birga kino ko'radigan yopiq xona. Video YouTube'da qoladi,
 * bizda faqat havolasi va o'ynash holati saqlanadi.
 */

/** Uy yaratishdagi ikki variant. */
const VISIBILITY = [
  { value: "public" as const, label: "Hammaga ochiq", icon: Globe },
  { value: "private" as const, label: "Maxfiy", icon: Lock },
]
export function RoomsScreen() {
  const navigate = useNavigate()
  const rooms = useMyRooms()
  const publicRooms = usePublicRooms()
  const create = useCreateRoom()

  const [url, setUrl] = useState("")
  const [code, setCode] = useState("")
  /** Sukut bo'yicha uy ochiq: odam kimnidir chaqirish uchun uy ochadi. */
  const [visibility, setVisibility] = useState<RoomVisibility>("public")

  const submitUrl = () => {
    const value = url.trim()
    if (!value || create.isPending) return

    haptic.impact("medium")
    create.mutate(
      { url: value, visibility },
      {
        onSuccess: ({ code: created }) => {
          setUrl("")
          navigate(`/room/${created}`)
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : "Uy yaratilmadi.")
        },
      },
    )
  }

  const submitCode = () => {
    const value = code.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
    if (!value) return
    haptic.select()
    navigate(`/room/${value}`)
  }

  return (
    <div className="safe-top px-4 pb-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Birga kino <span className="align-middle">🍿</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Uy yarating, do'stingizni taklif qiling — kino ikkalangizda bir vaqtda ketadi.
        </p>
      </div>

      {/*
        Ikki yo'l bor: uy yaratish va tayyor uyga qo'shilish. Ilgari ular
        ketma-ket turar va qaysi biri o'ziga kerakligini odam o'ylab
        topishiga to'g'ri kelardi. Endi ular ochiq ajratilgan.
      */}
      <Card className="mt-5 gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground">
            <Plus className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Yangi uy ochish</h2>
            <p className="text-[11px] text-muted-foreground">YouTube havolasini qo'ying</p>
          </div>
        </div>

        <Input
          id="room-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitUrl()}
          placeholder="https://youtu.be/..."
          inputMode="url"
          autoComplete="off"
          aria-label="YouTube havolasi"
        />

        {/*
          Uy kimga ko'rinishi. Ikki variant yonma-yon turadi va tanlanganining
          izohi ostida chiqadi — nomning o'zi ("maxfiy") nima o'zgarishini
          to'liq aytmaydi.
        */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {VISIBILITY.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                haptic.select()
                setVisibility(option.value)
              }}
              aria-pressed={visibility === option.value}
              className={cn(
                "tap flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                visibility === option.value
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground",
              )}
            >
              <option.icon className="size-3.5" />
              {option.label}
            </button>
          ))}
        </div>
        <p className="-mt-1 text-[11px] leading-snug text-muted-foreground">
          {visibility === "public"
            ? "Uy «Ochiq uylar» ro'yxatida hammaga ko'rinadi va istagan odam kirish so'rovini yubora oladi. Kiritish yoki kiritmaslik baribir sizga bog'liq."
            : "Uy hech qayerda ko'rinmaydi. Faqat siz yuborgan havolani olgan odam so'rov yubora oladi."}
        </p>
        <Button onClick={submitUrl} disabled={!url.trim() || create.isPending} size="lg">
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Uy yaratish
        </Button>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Video YouTube'da qoladi — biz faqat havolasini saqlaymiz.
        </p>
      </Card>

      <div className="mt-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium text-muted-foreground">yoki</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Card className="mt-4 gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <DoorOpen className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Do'stingizning uyiga kirish</h2>
            <p className="text-[11px] text-muted-foreground">U bergan kodni kiriting</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCode()}
            placeholder="masalan k7m3qa"
            autoComplete="off"
            autoCapitalize="none"
            aria-label="Taklif kodi"
            className="tracking-widest"
          />
          <Button variant="secondary" className="shrink-0" onClick={submitCode} disabled={!code.trim()}>
            Qo'shilish
          </Button>
        </div>
      </Card>

      {/* --- ro'yxat --- */}
      <section className="mt-7">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Clapperboard className="size-4" />
          Mening uylarim
        </h2>

        {rooms.isLoading && (
          <div className="mt-3 space-y-2.5">
            <Skeleton className="h-[76px] w-full rounded-2xl" />
            <Skeleton className="h-[76px] w-full rounded-2xl" />
          </div>
        )}

        {rooms.isError && (
          <Card className="mt-3 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Uylarni yuklab bo'lmadi. Internetni tekshirib, qaytadan urinib ko'ring.
          </Card>
        )}

        {rooms.data?.length === 0 && (
          <Card className="mt-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Hozircha uy yo'q. Yuqoridagi havolani qo'yib birinchisini yarating.
            </p>
          </Card>
        )}

        <div className="mt-3 space-y-2.5">
          {rooms.data?.map((room) => (
            <RoomRow key={room.code} room={room} onOpen={() => navigate(`/room/${room.code}`)} />
          ))}
        </div>
      </section>

      {/* --- ochiq uylar --- */}
      {(publicRooms.data?.length ?? 0) > 0 && (
        <section className="mt-7">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Globe className="size-4" />
            Ochiq uylar
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Boshqalar ochgan uylar. Kirish uchun egasiga so'rov yuboriladi.
          </p>

          <div className="mt-3 space-y-2.5">
            {publicRooms.data?.map((room) => (
              <PublicRoomRow
                key={room.code}
                room={room}
                onOpen={() => navigate(`/room/${room.code}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function RoomRow({ room, onOpen }: { room: RoomSummary; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="tap block w-full text-left">
      <Card className="flex-row items-center gap-3 p-2.5">
        <div className="relative shrink-0">
          <img
            src={youtubeThumbUrl(room.videoId)}
            alt=""
            loading="lazy"
            className="h-14 w-24 rounded-lg bg-muted object-cover"
          />
          {/*
            Kino hozir ketayotgani — ro'yxatdagi eng foydali ma'lumot:
            do'stlaringiz allaqachon ko'ryaptimi yoki yo'qmi.
          */}
          {room.isPlaying && (
            <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/45">
              <span className="grid size-7 place-items-center rounded-full bg-white/20 backdrop-blur">
                <Play className="size-3.5 translate-x-px fill-white text-white" />
              </span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{room.title}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {room.isOwner ? "Sizning uyingiz" : `${room.ownerName}ning uyi`}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {room.pendingCount > 0 && (
              <Badge className="border-stress/30 bg-stress-soft text-[10px] text-stress">
                {room.pendingCount} ta so'rov
              </Badge>
            )}

            {room.status === "pending" && (
              <Badge className="text-[10px]" variant="secondary">
                Tasdiq kutilmoqda
              </Badge>
            )}

            {room.onlineCount > 0 && (
              <Badge className="border-success/30 bg-success-soft text-[10px] text-success">
                {room.onlineCount} ta onlayn
              </Badge>
            )}

            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="size-3" />
              {room.memberCount}
            </span>
          </div>
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
      </Card>
    </button>
  )
}

/**
 * «Ochiq uylar» qatori.
 *
 * O'z uylarimizdan farqi: bu yerda hali a'zo emasmiz, shuning uchun qator
 * nima bo'lishini ochiq aytadi — bosilsa kirish so'rovi ekrani ochiladi.
 */
function PublicRoomRow({ room, onOpen }: { room: PublicRoomSummary; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="tap block w-full text-left">
      <Card className="flex-row items-center gap-3 p-2.5">
        <div className="relative shrink-0">
          <img
            src={youtubeThumbUrl(room.videoId)}
            alt=""
            loading="lazy"
            className="h-14 w-24 rounded-lg bg-muted object-cover"
          />
          {room.isPlaying && (
            <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/45">
              <span className="grid size-7 place-items-center rounded-full bg-white/20 backdrop-blur">
                <Play className="size-3.5 translate-x-px fill-white text-white" />
              </span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{room.title}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {room.ownerName}ning uyi
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {room.onlineCount > 0 ? (
              <Badge className="border-success/30 bg-success-soft text-[10px] text-success">
                {room.onlineCount} ta onlayn
              </Badge>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="size-3" />
                {room.memberCount}
              </span>
            )}
            <span className="text-[11px] text-primary">So'rov yuborish</span>
          </div>
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
      </Card>
    </button>
  )
}
