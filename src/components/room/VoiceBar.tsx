import { Loader2, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react"

import type { RoomMemberView } from "@shared/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { VoiceChat } from "@/lib/voice"
import { cn } from "@/lib/utils"

/**
 * Ovozli suhbat qatori — pleer bilan chat orasida.
 *
 * Kino ko'rayotganda yozib o'tirish noqulay: ekrandan ko'z uzish kerak,
 * qiziq joyini esa o'sha zahoti aytgingiz keladi. Shuning uchun ovoz —
 * matnli chatning o'rnini bosuvchi emas, uning yonidagi ikkinchi yo'l.
 *
 * Ovoz serverdan o'tmaydi: brauzerlar bir-biriga to'g'ridan-to'g'ri
 * ulanadi (`lib/voice.ts`).
 */

const initials = (name: string) => name.trim().slice(0, 1).toUpperCase() || "?"
const short = (name: string) => name.trim().split(/\s+/)[0] || name

interface VoiceBarProps {
  voice: VoiceChat
  /** Uyning tasdiqlangan a'zolari — ism va rasm shu yerdan olinadi */
  members: RoomMemberView[]
  meId: number
}

export function VoiceBar({ voice, members, meId }: VoiceBarProps) {
  const others = members.filter((m) => m.userId !== meId && m.voice)
  const byId = new Map(members.map((m) => [m.userId, m]))

  /* ------------------------------------------------- mikrofon o'chiq turibdi */

  if (voice.status === "off") {
    return (
      <div className="space-y-1.5">
        <Button
          variant={others.length ? "default" : "secondary"}
          className="w-full"
          disabled={!voice.supported}
          onClick={voice.start}
        >
          <Mic className="size-4" />
          {others.length ? "Suhbatga qo'shilish" : "Ovozli suhbat"}
        </Button>

        {/*
          Kimdir allaqachon gapirayotgani ko'rinib tursin: uyda ikki kishi
          bo'lsa ham, ovoz yoqilganini bilmasa hech kim birinchi bo'lib
          mikrofonni bosmaydi.
        */}
        {others.length > 0 && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Volume2 className="size-3.5 text-success" />
            {others.length === 1
              ? `${short(others[0].name)} ovozli suhbatda`
              : `${others.length} kishi ovozli suhbatda`}
          </p>
        )}

        {!voice.supported && (
          <p className="text-center text-[11px] text-muted-foreground">
            Bu brauzerda ovozli suhbat ishlamaydi.
          </p>
        )}

        {voice.error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            {voice.error}
          </p>
        )}
      </div>
    )
  }

  /* ------------------------------------------------------- mikrofon so'ralyapti */

  if (voice.status === "starting") {
    return (
      <Card size="sm" className="flex-row items-center gap-2 p-3">
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Mikrofonga ruxsat so'ralmoqda — brauzer savoliga «Ruxsat berish» deng.
        </p>
      </Card>
    )
  }

  /* --------------------------------------------------------- suhbat ketyapti */

  const me = byId.get(meId)

  return (
    <Card size="sm" className="gap-2 p-2.5">
      <div className="flex items-center gap-2">
        {/* O'z mikrofonim — eng kerakli tugma, shuning uchun chapda va kattaroq. */}
        <button
          type="button"
          onClick={voice.toggleMute}
          aria-label={voice.micMuted ? "Mikrofonni yoqish" : "Mikrofonni o'chirish"}
          aria-pressed={voice.micMuted}
          className={cn(
            "tap relative grid size-10 shrink-0 place-items-center rounded-full transition-colors",
            voice.micMuted ? "bg-destructive/15 text-destructive" : "bg-success-soft text-success",
          )}
        >
          {voice.micMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          {/* Ovoz darajasi halqasi: mikrofon haqiqatan eshityaptimi — shundan bilinadi. */}
          {!voice.micMuted && voice.level > 0.04 && (
            <span
              className="absolute inset-0 rounded-full ring-2 ring-success transition-opacity"
              style={{ opacity: Math.min(1, 0.3 + voice.level) }}
              aria-hidden
            />
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {voice.peers.length === 0 ? (
            <p className="truncate text-xs text-muted-foreground">
              Siz suhbatdasiz — do'stingiz qo'shilishini kuting.
            </p>
          ) : (
            voice.peers.map((peer) => {
              const member = byId.get(peer.userId)
              const speaking = peer.phase === "live" && peer.level > 0.08

              return (
                <div key={peer.userId} className="flex min-w-0 items-center gap-1.5">
                  <div className="relative shrink-0">
                    <Avatar
                      className={cn(
                        "size-8 transition-all",
                        speaking && "ring-2 ring-success ring-offset-1 ring-offset-card",
                        peer.phase !== "live" && "opacity-50",
                      )}
                    >
                      {member?.photoUrl && <AvatarImage src={member.photoUrl} alt="" />}
                      <AvatarFallback className="text-[11px]">
                        {initials(member?.name ?? "?")}
                      </AvatarFallback>
                    </Avatar>

                    {member?.voiceMuted && peer.phase === "live" && (
                      <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-card">
                        <MicOff className="size-2.5 text-muted-foreground" />
                      </span>
                    )}
                  </div>

                  <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                    {peer.phase === "live"
                      ? speaking
                        ? `${short(member?.name ?? "Do'stingiz")} gapiryapti`
                        : short(member?.name ?? "Do'stingiz")
                      : peer.phase === "connecting"
                        ? "ulanmoqda…"
                        : "aloqa yo'q"}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={voice.stop}
          className="shrink-0 text-destructive"
          aria-label="Ovozli suhbatdan chiqish"
        >
          <PhoneOff className="size-4" />
        </Button>
      </div>

      {/*
        Ulanish uzilganda sababini aytamiz: WebRTC ba'zi tarmoqlarda
        (qattiq NAT, korporativ Wi-Fi) to'g'ridan-to'g'ri yo'l topolmaydi
        va bu foydalanuvchi uchun shunchaki "ishlamadi" bo'lib ko'rinardi.
      */}
      {voice.peers.some((p) => p.phase === "failed") && (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Ulanib bo'lmadi — tarmoq to'g'ridan-to'g'ri aloqaga ruxsat bermayotgan
          bo'lishi mumkin. Mobil internetga o'tib ko'ring.
        </p>
      )}

      {me?.voiceMuted && (
        <p className="text-[11px] text-muted-foreground">
          Mikrofoningiz o'chiq — sizni eshitishmaydi.
        </p>
      )}
    </Card>
  )
}
