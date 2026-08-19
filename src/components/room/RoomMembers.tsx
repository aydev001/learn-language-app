import { Check, Crown, LogOut, ShieldBan, X } from "lucide-react"

import type { RoomMemberAction, RoomMemberView } from "@shared/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"

const initials = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?"

/* ---------------------------------------------------------- ishtirokchilar */

interface MembersStripProps {
  members: RoomMemberView[]
  meId: number
}

/** Pleer ostidagi qator: kim uyda, kim chiqib ketgan. */
export function MembersStrip({ members, meId }: MembersStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {members.map((member) => (
        <div key={member.userId} className="flex items-center gap-1.5">
          <div className="relative">
            <Avatar className="size-7">
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

          <span className="max-w-24 truncate text-xs font-medium">
            {member.userId === meId ? "Siz" : member.name}
          </span>

          {member.role === "owner" && <Crown className="size-3 text-stress" aria-label="Uy egasi" />}
        </div>
      ))}
    </div>
  )
}

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
    <div className="space-y-2">
      {pending.map((guest) => (
        <div
          key={guest.userId}
          className="flex items-center gap-2.5 rounded-2xl border border-stress/40 bg-stress-soft px-3 py-2"
        >
          <Avatar className="size-8">
            {guest.photoUrl && <AvatarImage src={guest.photoUrl} alt="" />}
            <AvatarFallback className="text-xs">{initials(guest.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{guest.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {guest.username ? `@${guest.username} · ` : ""}uyga kirmoqchi
            </div>
          </div>

          <Button
            size="icon-sm"
            variant="secondary"
            disabled={busyId === guest.userId}
            onClick={() => {
              haptic.success()
              onDecide(guest.userId, "approve")
            }}
            aria-label="Tasdiqlash"
          >
            <Check className="size-4 text-success" />
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
