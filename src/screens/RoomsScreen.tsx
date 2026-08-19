import { useState } from "react"
import { useNavigate } from "react-router"
import { Clapperboard, Loader2, Plus, Users } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { useCreateRoom, useMyRooms } from "@/lib/rooms"
import { haptic } from "@/lib/telegram"
import { youtubeThumbUrl } from "@shared/youtube"
import type { RoomSummary } from "@shared/types"

/**
 * "Kino" bo'limi — uylar ro'yxati va yangi uy yaratish.
 *
 * Uy = do'stlar birga kino ko'radigan yopiq xona. Video YouTube'da qoladi,
 * bizda faqat havolasi va o'ynash holati saqlanadi.
 */
export function RoomsScreen() {
  const navigate = useNavigate()
  const rooms = useMyRooms()
  const create = useCreateRoom()

  const [url, setUrl] = useState("")
  const [code, setCode] = useState("")

  const submitUrl = () => {
    const value = url.trim()
    if (!value || create.isPending) return

    haptic.impact("medium")
    create.mutate(value, {
      onSuccess: ({ code: created }) => {
        setUrl("")
        navigate(`/room/${created}`)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : "Uy yaratilmadi.")
      },
    })
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

      {/* --- yangi uy --- */}
      <Card className="mt-5 gap-3 p-4">
        <label className="text-sm font-semibold" htmlFor="room-url">
          YouTube havolasi
        </label>
        <Input
          id="room-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitUrl()}
          placeholder="https://youtu.be/..."
          inputMode="url"
          autoComplete="off"
        />
        <Button onClick={submitUrl} disabled={!url.trim() || create.isPending} size="lg">
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Uy yaratish
        </Button>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Video YouTube'da qoladi — biz faqat havolasini saqlaymiz. Uyga faqat siz
          tasdiqlagan odam kira oladi.
        </p>
      </Card>

      {/* --- kod bilan qo'shilish --- */}
      <div className="mt-3 flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCode()}
          placeholder="Taklif kodi (masalan k7m3qa)"
          autoComplete="off"
        />
        <Button variant="outline" onClick={submitCode} disabled={!code.trim()}>
          Qo'shilish
        </Button>
      </div>

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
    </div>
  )
}

function RoomRow({ room, onOpen }: { room: RoomSummary; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="tap block w-full text-left">
      <Card className="flex-row items-center gap-3 p-2.5">
        <img
          src={youtubeThumbUrl(room.videoId)}
          alt=""
          loading="lazy"
          className="h-14 w-24 shrink-0 rounded-lg bg-muted object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{room.title}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {room.isOwner ? "Sizning uyingiz" : room.ownerName}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="size-3" />
              {room.memberCount}
            </span>

            {room.onlineCount > 0 && (
              <Badge className="border-success/30 bg-success-soft text-[10px] text-success">
                {room.onlineCount} ta onlayn
              </Badge>
            )}

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
          </div>
        </div>
      </Card>
    </button>
  )
}
