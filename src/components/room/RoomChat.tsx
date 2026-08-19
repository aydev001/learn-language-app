import { useEffect, useRef, useState } from "react"
import { SendHorizonal } from "lucide-react"

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
        className="min-h-32 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-muted/40 p-3"
      >
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Hali xabar yo'q. Kino haqida fikringizni yozing 🍿
          </p>
        )}

        {messages.map((message) =>
          message.kind === "system" ? (
            <p key={message.id} className="py-0.5 text-center text-[11px] text-muted-foreground">
              {message.text}
            </p>
          ) : (
            <Bubble key={message.id} message={message} mine={message.userId === meId} />
          ),
        )}
      </div>

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
          className="max-h-24 min-h-9 flex-1 resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring md:text-sm dark:bg-input/30"
        />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={!text.trim() || sending}
          aria-label="Yuborish"
        >
          <SendHorizonal className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function Bubble({ message, mine }: { message: RoomMessageView; mine: boolean }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-1.5 text-sm break-words",
          mine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-card text-card-foreground shadow-xs",
        )}
      >
        {!mine && (
          <div className="text-[11px] font-semibold text-primary">{message.name}</div>
        )}
        <div className="whitespace-pre-wrap">{message.text}</div>
        <div className={cn("mt-0.5 text-[10px]", mine ? "text-white/70" : "text-muted-foreground")}>
          {new Date(message.at).toLocaleTimeString("uz-UZ", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  )
}
