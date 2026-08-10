import { Fragment } from "react"
import { graphemes, hideStress, isStressedGrapheme, syllabify, tokenize } from "@shared/stress"
import type { WordStatus } from "@shared/types"
import { cn } from "@/lib/utils"

/**
 * Rus so'zini urg'usi ajratilgan holda chiqaradi.
 * Urg'uli unli iliq amber rangda va biroz qalinroq — ko'z darhol ilib oladi.
 */
export function StressWord({ word, className }: { word: string; className?: string }) {
  const parts = graphemes(word)
  return (
    <span className={className}>
      {parts.map((g, i) =>
        isStressedGrapheme(g) ? (
          <span key={i} className="font-bold text-stress">
            {g}
          </span>
        ) : (
          <Fragment key={i}>{g}</Fragment>
        ),
      )}
    </span>
  )
}

const STATUS_STYLES: Record<WordStatus, string> = {
  ok: "bg-success-soft text-success-foreground dark:text-success",
  stress: "bg-stress-soft text-stress-foreground dark:text-stress",
  sound: "bg-destructive/12 text-destructive",
  missing: "bg-muted text-muted-foreground line-through decoration-2",
  extra: "bg-destructive/12 text-destructive italic",
}

/**
 * Butun matn. `activeIndex` — hozir o'qilayotgan so'z,
 * `statuses` — tahlildan keyingi so'z-baholari.
 */
export function StressText({
  text,
  className,
  activeIndex,
  statuses,
  onWordClick,
}: {
  text: string
  className?: string
  activeIndex?: number
  statuses?: Record<number, WordStatus>
  onWordClick?: (word: string, index: number) => void
}) {
  const tokens = tokenize(text)

  return (
    <p className={cn("leading-[2.1]", className)}>
      {tokens.map((token) => {
        const status = statuses?.[token.index]
        const interactive = Boolean(onWordClick)

        return (
          <Fragment key={token.index}>
            <span
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => onWordClick?.(token.word, token.index) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onWordClick?.(token.word, token.index)
                      }
                    }
                  : undefined
              }
              className={cn(
                "rounded-md px-0.5 transition-colors",
                interactive && "cursor-pointer hover:bg-accent",
                status && `${STATUS_STYLES[status]} px-1`,
                activeIndex === token.index && "animate-word-glow",
              )}
            >
              <StressWord word={token.word} />
            </span>
            {token.trailing}
          </Fragment>
        )
      })}
    </p>
  )
}

/**
 * Bo'g'inlarni chip ko'rinishida chiqaradi.
 * Urg'u mashqida o'quvchi to'g'ri bo'g'inni tanlaydi.
 */
export function SyllableChips({
  word,
  selected,
  correct,
  revealed,
  onSelect,
  className,
}: {
  word: string
  selected?: number | null
  /** To'g'ri javob indeksi */
  correct: number
  /** Javob ochilganmi */
  revealed?: boolean
  onSelect?: (index: number) => void
  className?: string
}) {
  const syllables = syllabify(word)

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {syllables.map((syl, i) => {
        const isSelected = selected === i
        const isCorrect = i === correct
        const showAsCorrect = revealed && isCorrect
        const showAsWrong = revealed && isSelected && !isCorrect

        return (
          <button
            key={i}
            type="button"
            disabled={!onSelect || revealed}
            onClick={() => onSelect?.(i)}
            className={cn(
              "tap min-w-14 rounded-xl border-2 px-3.5 py-2.5 text-xl font-semibold tabular-nums",
              "border-border bg-card disabled:cursor-default",
              onSelect && !revealed && "hover:border-primary/60 hover:bg-accent",
              isSelected && !revealed && "border-primary bg-accent",
              showAsCorrect && "border-success bg-success-soft text-success",
              showAsWrong && "border-destructive bg-destructive/10 text-destructive",
            )}
          >
            {/* Javob ochilmaguncha urg'u ishoralari yashirin turadi */}
            {revealed ? <StressWord word={syl} /> : hideStress(syl)}
          </button>
        )
      })}
    </div>
  )
}
