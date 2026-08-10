import { Loader2, Volume2, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSpeech } from "@/lib/audio"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"

interface SpeakButtonProps {
  text: string
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "sm" | "default" | "lg" | "icon" | "icon-sm" | "icon-lg"
  className?: string
  /** Bir nechta tugma bitta hookdan foydalanmaydi — har biri mustaqil */
  speech?: ReturnType<typeof useSpeech>
  speakKey?: string
  /** Shu o'quvchiga xos matn — serverda keshlanmaydi */
  personal?: boolean
}

/** Matnni ovoz bilan o'qib beruvchi tugma (yuklanish va to'xtatish holatlari bilan). */
export function SpeakButton({
  text,
  label,
  variant = "outline",
  size = "default",
  className,
  speech,
  speakKey,
  personal = false,
}: SpeakButtonProps) {
  const own = useSpeech()
  const s = speech ?? own
  const key = speakKey ?? text
  const isActive = s.activeKey === key
  const isLoading = isActive && s.status === "loading"
  const isPlaying = isActive && s.status === "playing"

  const Icon = isLoading ? Loader2 : isPlaying ? Square : Volume2

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(isActive && "border-primary text-primary", className)}
      onClick={() => {
        haptic.impact("light")
        if (isPlaying) s.stop()
        else void s.play(text, { key, personal })
      }}
      aria-label={label ?? "Eshitish"}
    >
      <Icon className={cn(isLoading && "animate-spin")} />
      {label}
    </Button>
  )
}
