import { useEffect, useRef, useState } from "react"
import { MessagesSquare, SendHorizonal } from "lucide-react"

import type { RoomMessageView } from "@shared/types"
import { Button } from "@/components/ui/button"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"

const MAX_LENGTH = 400

interface RoomChatProps {
  messages: RoomMessageView[]
  meId: number
  sending: boolean
  onSend: (text: string) => void
}

/**
 * Uy suhbati.
 *
 * Yangi xabarlar `sync` javobida keladi, o'zimizniki esa darhol ko'rinadi —
 * shuning uchun yozganingiz bilan ro'yxatga tushadi, javob kutilmaydi.
 */
export function RoomChat({ messages, meId, sending, onSend }: RoomChatProps) {
  const [text, setText] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)

  // Foydalanuvchi tepaga qarab eski xabarlarni o'qiyotgan bo'lsa, yangi xabar
  // uni pastga sudrab tushirmasin.
  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  useEffect(() => {
    const el = listRef.current
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const submit = () => {
    const value = text.trim()
    if (!value || sending) return
    haptic.impact("light")
    onSend(value.slice(0, MAX_LENGTH))
    setText("")
    pinnedRef.current = true
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        onScroll={onScroll}
        className="min-h-20 flex-1 space-y-1.5 overflow-y-auto rounded-2xl bg-muted/50 p-3"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-6 py-6 text-center">
            <MessagesSquare className="size-5 text-muted-foreground/60" />
            <p className="text-xs font-medium text-muted-foreground">Suhbat shu yerda</p>
            <p className="text-[11px] leading-snug text-muted-foreground/80">
              Kino ketayotganda yozishingiz mumkin — video to'xtamaydi.
            </p>
          </div>
        )}

        {messages.map((message) =>
          message.kind === "system" ? (
            <p
              key={message.id}
              className="py-1 text-center text-[11px] text-muted-foreground/80"
            >
              {message.text}
            </p>
          ) : (
            <Bubble key={message.id} message={message} mine={message.userId === meId} />
          ),
        )}
      </div>

      {/*
        Yozish maydoni: dumaloq va baland (40 px), tugma esa doim ko'rinadi.
        Ilgari tugma matn yozilmaguncha o'chiq turar va qatorda nima bilan
        nima qilinishi darrov tushunarli emas edi.
      */}
      <div className="mt-2 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          placeholder="Xabar yozing…"
          className="max-h-24 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-base leading-tight outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring md:text-sm dark:bg-input/30"
        />
        <Button
          type="button"
          size="icon-lg"
          onClick={submit}
          disabled={!text.trim() || sending}
          aria-label="Yuborish"
          className="tap shrink-0 rounded-full"
        >
          <SendHorizonal className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Xabar puffagi.
 *
 * Vaqt matn bilan bir qatorda turadi — alohida qatorda bo'lganda har bir
 * xabar bir yo'l balandroq bo'lar va telefon ekraniga kam xabar sig'ardi.
 */
function Bubble({ message, mine }: { message: RoomMessageView; mine: boolean }) {
  const time = new Date(message.at).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3 py-1.5 text-sm break-words",
          mine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-card text-card-foreground shadow-xs",
        )}
      >
        {!mine && (
          <div className="text-[11px] leading-tight font-semibold text-primary">{message.name}</div>
        )}
        <div className="flex items-end gap-2">
          <span className="min-w-0 whitespace-pre-wrap">{message.text}</span>
          <span
            className={cn(
              "shrink-0 translate-y-0.5 text-[10px] tabular-nums",
              mine ? "text-primary-foreground/60" : "text-muted-foreground",
            )}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  )
}
