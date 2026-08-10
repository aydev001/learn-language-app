import { cn } from "@/lib/utils"

interface ProgressRingProps {
  /** 0..1 */
  value: number
  size?: number
  thickness?: number
  className?: string
  trackClassName?: string
  children?: React.ReactNode
}

/** Aylanma progress — dars bajarilishi va natijalarda ishlatiladi. */
export function ProgressRing({
  value,
  size = 56,
  thickness = 5,
  className,
  trackClassName,
  children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, value))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className={cn("stroke-muted", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn("stroke-primary transition-[stroke-dashoffset] duration-700 ease-out", className)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
