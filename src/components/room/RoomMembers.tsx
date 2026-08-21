import {
  BellRing,
  Check,
  Crown,
  Link2,
  LogOut,
  ShieldBan,
  ShieldCheck,
  X,
} from "lucide-react"

import type { RoomMemberAction, RoomMemberView } from "@shared/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"

const initials = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?"

/* ---------------------------------------------------------- ishtirokchilar */

interface WatchingBarProps {
  members: RoomMemberView[]
  meId: number
  onInvite: () => void
}

/**
 * Pleer ostidagi qator: kim shu yerda va kino haqiqatan birga ketyaptimi.
 *
 * Ilgari bu yerda shunchaki avatarlar qatori turardi — u kim borligini
 * ko'rsatardi, lekin featurening eng muhim va'dasini ("ikkalangizda bir
 * vaqtda") aytmasdi. Uyda yolg'iz odam uchun esa eng kerakli amal —
 * do'stni chaqirish — sarlavhadagi kichkina belgichada yashiringan edi.
 */
export function WatchingBar({ members, meId, onInvite }: WatchingBarProps) {
  const others = members.filter((m) => m.userId !== meId)
  const onlineOthers = others.filter((m) => m.online)

  /* --- uyda yolg'iz: taklif qilish eng katta tugma bo'lsin --- */
  if (others.length === 0) {
    return (
      <Card size="sm" className="gap-2.5 border border-dashed p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-lg">
            🍿
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Uyda yolg'izsiz</p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Havolani yuboring — kino ikkalangizda bir vaqtda ketadi.
            </p>
          </div>
        </div>
        <Button onClick={onInvite} className="w-full">
          <Link2 className="size-4" />
          Do'stni taklif qilish
        </Button>
      </Card>
    )
  }

  const status =
    onlineOthers.length === 0
      ? others.length === 1
        ? `${short(others[0].name)} hozir uyda emas`
        : "Hammasi chiqib turibdi"
      : onlineOthers.length === 1
        ? `Siz va ${short(onlineOthers[0].name)} birga ko'ryapsizlar`
        : `Siz va yana ${onlineOthers.length} kishi birga ko'ryapsizlar`

  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-muted/50 py-2 pr-2 pl-3">
      <div className="flex -space-x-2">
        {/* Chapdagi avatar tepada tursin — aks holda uning holat nuqtasi
            keyingi avatar ostida qolib ketardi. */}
        {members.slice(0, 4).map((member, index) => (
          <div
            key={member.userId}
            className="relative"
            style={{ zIndex: members.length - index }}
          >
            <Avatar className="size-7 ring-2 ring-background">
              {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
              <AvatarFallback className="text-[11px]">{initials(member.name)}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-background",
                member.online ? "bg-success" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
          </div>
        ))}
        {members.length > 4 && (
          <div className="grid size-7 place-items-center rounded-full bg-secondary text-[10px] font-semibold ring-2 ring-background">
            +{members.length - 4}
          </div>
        )}
      </div>

      <p
        className={cn(
          "min-w-0 flex-1 truncate text-xs font-medium",
          onlineOthers.length ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {status}
      </p>

      <Button size="sm" variant="ghost" onClick={onInvite} className="shrink-0 text-primary">
        <Link2 className="size-4" />
        Taklif
      </Button>
    </div>
  )
}

/** Uzun ismlar qatorni buzmasin — birinchi so'zi yetarli. */
const short = (name: string) => name.trim().split(/\s+/)[0] || name


/* ------------------------------------------------------------- so'rovlar */

interface JoinRequestsProps {
  pending: RoomMemberView[]
  busyId: number | null
  onDecide: (userId: number, action: RoomMemberAction) => void
}

/**
 * Kirish so'rovlari — pleer ustidagi qatlam.
 *
 * Kino to'xtamaydi: uy egasi tasdiqlashni bir teginishda hal qiladi.
 */
export function JoinRequests({ pending, busyId, onDecide }: JoinRequestsProps) {
  if (!pending.length) return null

  return (
    <div className="space-y-2 rounded-2xl border border-stress/40 bg-stress-soft p-2.5">
      <p className="flex items-center gap-1.5 px-0.5 text-[11px] font-semibold text-stress">
        <BellRing className="size-3.5" />
        {pending.length === 1 ? "Kirish so'rovi" : `${pending.length} ta kirish so'rovi`}
      </p>

      {pending.map((guest) => (
        <div key={guest.userId} className="flex items-center gap-2.5 rounded-xl bg-card p-2">
          <Avatar className="size-9">
            {guest.photoUrl && <AvatarImage src={guest.photoUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials(guest.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{guest.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {guest.username ? `@${guest.username}` : "uyga kirmoqchi"}
            </div>
          </div>

          {/*
            Tasdiqlash — matnli va to'ldirilgan tugma. Ikkita bir xil
            belgichadan qaysi biri "ha", qaysi biri "yo'q" ekanini uy egasi
            bir qarashda ajrata olmasdi.
          */}
          <Button
            size="sm"
            disabled={busyId === guest.userId}
            onClick={() => {
              haptic.success()
              onDecide(guest.userId, "approve")
            }}
            className="shrink-0"
          >
            <Check className="size-4" />
            Kiritish
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={busyId === guest.userId}
            onClick={() => {
              haptic.impact("light")
              onDecide(guest.userId, "reject")
            }}
            aria-label="Rad etish"
            className="shrink-0"
          >
            <X className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------- boshqaruv ro'yxati */

interface MemberListProps {
  members: RoomMemberView[]
  meId: number
  isOwner: boolean
  busyId: number | null
  onDecide: (userId: number, action: RoomMemberAction) => void
}

/** Sozlamalar oynasidagi to'liq ro'yxat — chiqarish va bloklash shu yerda. */
export function MemberList({ members, meId, isOwner, busyId, onDecide }: MemberListProps) {
  return (
    <ul className="space-y-1.5">
      {members.map((member) => (
        <li key={member.userId} className="flex items-center gap-2.5 rounded-xl px-1 py-1.5">
          <Avatar className="size-8">
            {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium">
              {member.userId === meId ? `${member.name} (siz)` : member.name}
              {member.role === "owner" && <Crown className="size-3 shrink-0 text-stress" />}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {member.online ? "hozir uyda" : "chiqib turibdi"}
            </div>
          </div>

          {isOwner && member.role !== "owner" && (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                className="shrink-0"
                disabled={busyId === member.userId}
                onClick={() => onDecide(member.userId, "kick")}
                aria-label="Uydan chiqarish"
              >
                <LogOut className="size-4 text-muted-foreground" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="shrink-0"
                disabled={busyId === member.userId}
                onClick={() => onDecide(member.userId, "block")}
                aria-label="Bloklash"
              >
                <ShieldBan className="size-4 text-destructive" />
              </Button>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------- bloklanganlar */

interface BlockedListProps {
  blocked: RoomMemberView[]
  busyId: number | null
  onDecide: (userId: number, action: RoomMemberAction) => void
}

/**
 * Bloklangan odamlar — faqat uy egasi ko'radi.
 *
 * Blok bir tomonlama edi: `unblock` amali API'da bor edi-yu, unga
 * bosadigan joy yo'q edi, ya'ni bir marta bloklangan odam abadiy tashqarida
 * qolardi. Xato bosilgan blokni ham qaytarib bo'lmasdi.
 */
export function BlockedList({ blocked, busyId, onDecide }: BlockedListProps) {
  return (
    <ul className="space-y-1.5">
      {blocked.map((member) => (
        <li key={member.userId} className="flex items-center gap-2.5 rounded-xl px-1 py-1.5">
          {/* Bloklangani ko'rinib tursin — ro'yxat a'zolarnikiga o'xshab ketmasin. */}
          <Avatar className="size-8 opacity-50 grayscale">
            {member.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-muted-foreground">
              {member.name}
            </div>
            <div className="truncate text-[11px] text-muted-foreground/80">
              {member.username ? `@${member.username}` : "bloklangan"}
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            disabled={busyId === member.userId}
            onClick={() => {
              haptic.impact("light")
              onDecide(member.userId, "unblock")
            }}
          >
            <ShieldCheck className="size-4" />
            Blokdan chiqarish
          </Button>
        </li>
      ))}
    </ul>
  )
}
