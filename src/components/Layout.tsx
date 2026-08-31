import { useEffect } from "react"
import { NavLink, Outlet, useNavigate } from "react-router"
import { ChevronLeft, GraduationCap, Popcorn, Trophy, UserRound } from "lucide-react"
import { haptic, isTelegram, setBackButton } from "@/lib/telegram"
import { stopSpeech } from "@/lib/audio"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------- tab layout */

const TABS = [
  { to: "/", label: "Vazifa", icon: GraduationCap },
  { to: "/rooms", label: "Kino", icon: Popcorn },
  { to: "/rating", label: "Reyting", icon: Trophy },
  { to: "/profile", label: "Profil", icon: UserRound },
]

export function TabLayout() {
  // Asosiy ekranlarda Telegram'ning orqaga tugmasi kerak emas.
  useEffect(() => setBackButton(null), [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg border-t border-border bg-card/90 px-2 pt-1.5 backdrop-blur-lg">
        <ul className="flex items-stretch justify-around">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === "/"}
                onClick={() => haptic.select()}
                className={({ isActive }) =>
                  cn(
                    "tap flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("size-5", isActive && "scale-110 transition-transform")} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

/* ----------------------------------------------------------- ichki ekranlar */

interface ScreenProps {
  title: string
  subtitle?: string
  /** Sarlavha yonidagi qo'shimcha element (masalan progress) */
  action?: React.ReactNode
  /** Orqaga qaytish manzili — berilmasa tarixda bir qadam orqaga */
  backTo?: string
  children: React.ReactNode
  /** Pastdagi yopishqoq panel (masalan «Keyingisi» tugmasi) */
  footer?: React.ReactNode
}

/**
 * Ichki ekran karkasi.
 * Telegram ichida tizim "orqaga" tugmasi ishlatiladi, brauzerda — o'z strelkamiz.
 */
export function Screen({ title, subtitle, action, backTo, children, footer }: ScreenProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const goBack = () => {
      stopSpeech()
      if (backTo) navigate(backTo)
      else navigate(-1)
    }
    return setBackButton(goBack)
  }, [backTo, navigate])

  // Ekran almashganda yangrab turgan ovoz to'xtasin.
  useEffect(() => stopSpeech, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/85 px-4 pb-3 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          {!isTelegram && (
            <button
              type="button"
              onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
              className="tap -ml-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Orqaga"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base leading-tight font-semibold">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      </header>

      <main className={cn("flex-1 px-4 py-4", footer && "pb-28")}>{children}</main>

      {footer && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg border-t border-border bg-card/90 px-4 pt-3 backdrop-blur-lg">
          {footer}
        </div>
      )}
    </div>
  )
}
