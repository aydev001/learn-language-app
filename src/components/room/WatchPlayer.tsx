import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Lock, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react"

import type { RoomStateView } from "@shared/types"
import { expectedPosition } from "@/lib/rooms"
import { haptic } from "@/lib/telegram"
import { cn } from "@/lib/utils"
import {
  YT_STATE,
  describeYouTubeError,
  formatVideoTime,
  loadYouTubeApi,
  type YTPlayer,
  type YTStateEvent,
} from "@/lib/youtube"

/**
 * Uy a'zolari uchun sinxron YouTube pleeri.
 *
 * ## Nega YouTube boshqaruvi yashirilgan
 *
 * Ilgari pleerning o'z tugmalari ochiq edi va biz foydalanuvchi nima
 * qilganini **taxmin** qilardik: vaqt sakrab ketdimi — demak surgan,
 * "PAUSED" hodisasi keldimi — demak to'xtatgan. Taxmin ishonchsiz: bufer
 * ham, reklama ham, hali boshlanmagan video ham xuddi shunday ko'rinardi.
 * Natijada uy noto'g'ri soniyaga sakrab ketardi.
 *
 * Endi iframe hodisalarni umuman qabul qilmaydi (`pointer-events: none`),
 * boshqaruv esa butunlay bizniki. Har bir harakat — bosilgan tugma, ya'ni
 * uning turi ham, aniq soniyasi ham ma'lum. Taxmin qilinadigan joy qolmadi.
 *
 * ## Pleer nega hali ham kuzatiladi
 *
 * Foydalanuvchi tegmasa ham video o'zi to'xtashi mumkin (bufer, reklama,
 * tarmoq uzilishi). Shuning uchun qisqa oraliqda pleer holati uy holatiga
 * solishtiriladi va farq bo'lsa jimgina to'g'rilanadi.
 */

/** Shu farqdan katta og'ish bo'lsa video tenglashtiriladi (sekund). */
const DRIFT_TOLERANCE = 1.5

/**
 * Tenglashtirishda shuncha oldinga suriladi (sekund).
 *
 * `seekTo` bir zumda bajarilmaydi: pleer yangi joyni buferlaguncha yarim
 * soniyacha ketadi va o'sha vaqtda uy soati oldinga siljib bo'ladi. Shu
 * qadar oldinga surmasak, har tuzatishdan keyin yana orqada qolaverardik.
 */
const SEEK_LEAD = 0.5

/** Harakat efirga chiqishidan oldin pleer joylashuvi shuncha kutiladi (ms). */
const SETTLE_TIMEOUT = 4000

/** To'xtatilgan videoda kutishga hojat yo'q — buferlanadigan narsa yo'q (ms). */
const SETTLE_TIMEOUT_PAUSED = 1500

/** Surish "yetib keldi" deb hisoblanadigan farq (sekund). */
const LANDED = 1

/**
 * Pleer shuncha vaqt buferda qotib qolsa, video qaytadan yuklanadi (ms).
 *
 * Odatda bufer o'zi tugaydi va aralashish faqat zarar qiladi. Lekin u
 * ba'zan butunlay qotib qoladi — brauzer ko'rinmayotgan oynada ovozli
 * videoni boshlamaydi, tarmoq uzilib qoladi va hokazo. O'shanda kutish
 * cheksiz davom etardi: uy soati ketaverar, ekranda esa 0:00 turardi.
 */
const STALL_TIMEOUT = 6000

/** Dasturiy buyruqdan keyin kuzatuv shuncha vaqt jim turadi (ms). */
const SUPPRESS_MS = 1200

/** Pleer holatini qanchalik tez-tez tekshiramiz (ms). */
const WATCH_TICK = 700

/** Vaqt ko'rsatkichi va chiziq shu oraliqda yangilanadi (ms). */
const DISPLAY_TICK = 500

const VOLUME_KEY = "room-volume"

export interface WatchPlayerProps {
  state: RoomStateView
  /** Server soati bo'yicha hozirgi vaqt */
  serverNow: () => number
  canControl: boolean
  /** Foydalanuvchi boshqaruv tugmasini bosdi */
  onAction: (isPlaying: boolean, positionSec: number) => void
  /** Ruxsatsiz boshqarishga urinildi */
  onBlocked: () => void
  onError: (message: string) => void
}

export function WatchPlayer({
  state,
  serverNow,
  canControl,
  onAction,
  onBlocked,
  onError,
}: WatchPlayerProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  const [ready, setReady] = useState(false)
  /**
   * Brauzer ovozli videoni foydalanuvchi bosmaguncha o'ynatmaydi. Shuning
   * uchun birinchi teginishgacha hech narsa boshlamaymiz — aks holda mehmon
   * "nega ketmayapti" deb qolardi.
   */
  const [activated, setActivated] = useState(false)
  const [display, setDisplay] = useState<{
    time: number
    duration: number
    /** `YT_STATE` qiymatlaridan biri */
    playerState: number
  }>({ time: 0, duration: 0, playerState: YT_STATE.UNSTARTED })
  /** Foydalanuvchi chiziqni ushlab turibdi — o'sha paytda kuzatuv aralashmaydi */
  const [scrub, setScrub] = useState<number | null>(null)
  /**
   * Bosilgan, lekin hali efirga chiqmagan holat. Tugma darhol o'zgarishi
   * kerak — foydalanuvchi ikki soniya "hech narsa bo'lmadi" deb turmasin.
   */
  const [pendingPlay, setPendingPlay] = useState<boolean | null>(null)
  const [volume, setVolume] = useState(() => clampVolume(localStorage.getItem(VOLUME_KEY)))
  const [fullscreen, setFullscreen] = useState(false)

  /* Hodisa ishlovchilari bir marta yaratiladi, ular esa eng yangi qiymatlarni
     ko'rishi kerak — shuning uchun oynadagi qiymatlarni ref'da saqlaymiz. */
  const stateRef = useRef(state)
  const activatedRef = useRef(activated)
  const scrubbingRef = useRef(false)
  const nowRef = useRef(serverNow)
  const onActionRef = useRef(onAction)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    stateRef.current = state
    activatedRef.current = activated
    scrubbingRef.current = scrub !== null
    nowRef.current = serverNow
    onActionRef.current = onAction
    onErrorRef.current = onError
  })

  const suppressRef = useRef(0)
  /** Qo'llangan oxirgi server holati — takror qo'llamaslik uchun */
  const appliedAtRef = useRef(0)
  /** Efirga chiqishni kutayotgan harakat — eskisini bekor qilish uchun */
  const settleRef = useRef(0)
  /** Bufer qachondan beri davom etyapti (0 — buferda emas) */
  const stalledSinceRef = useRef(0)
  /** Pleerga hozir yuklangan video */
  const loadedVideoRef = useRef(state.videoId)

  const suppress = (ms = SUPPRESS_MS) => {
    suppressRef.current = Date.now() + ms
  }

  /**
   * Harakatni uyga xabar qiladi.
   *
   * **To'xtatish va surish** — natijasi darhol aniq: qaysi soniyada
   * to'xtaganimizni ham, qayerga surganimizni ham o'zimiz bilamiz. Ular
   * kutmasdan yuboriladi.
   *
   * **O'ynatish** boshqacha: bosilgandan keyin video darhol ketmaydi —
   * yuklanadi, buferlanadi, ba'zan reklama ko'rsatadi. Bosilgan lahzadagi
   * soniyani yuborsak, uy soati o'sha bir-ikki soniyaga oldinda ketadi va
   * do'stlar bir-biridan surilib qoladi. Shuning uchun pleer haqiqatan
   * o'ynay boshlaguncha kutamiz va o'shanda aniq soniyani yuboramiz.
   */
  const broadcast = useCallback((isPlaying: boolean, target: number, wait: boolean) => {
    const player = playerRef.current
    const token = ++settleRef.current

    if (!player || !wait) {
      onActionRef.current(isPlaying, target)
      return
    }

    const startedAt = Date.now()
    const limit = isPlaying ? SETTLE_TIMEOUT : SETTLE_TIMEOUT_PAUSED

    const attempt = () => {
      if (settleRef.current !== token) return // yangiroq harakat bo'ldi

      const time = player.getCurrentTime()
      /**
       * Ikki shart ham bajarilishi kerak:
       *
       * — **yetib keldi**: `seekTo` bir zumda bajarilmaydi va o'sha oraliqda
       *   `getCurrentTime` hali **eski** joyni qaytaradi. Ilgari shuni uyga
       *   yuborardik, natijada surilgan video hammada oldingi joyiga qaytib
       *   ketardi;
       * — **o'ynay boshladi**: bosilgan lahzadagi soniyani yuborsak, video
       *   yuklanguncha ketgan vaqt uy soatini oldinga surib yuborardi.
       */
      const landed = Math.abs(time - target) < LANDED
      const running = !isPlaying || player.getPlayerState() === YT_STATE.PLAYING

      if (landed && running) {
        onActionRef.current(isPlaying, time)
        return
      }

      // Pleer joylashmadi (bufer, sekin tarmoq, ko'rinmayotgan oyna). Uyni
      // kutkazib qo'ymaymiz — mo'ljallangan soniya bilan davom etamiz.
      if (Date.now() - startedAt > limit) {
        onActionRef.current(isPlaying, target)
        return
      }

      window.setTimeout(attempt, 120)
    }

    attempt()
  }, [])

  /**
   * Uy holatini pleerga qo'llaydi.
   *
   * Hali boshlanmagan video uchun `seekTo` emas, `loadVideoById` ishlatiladi:
   * `seekTo` bunday paytda ko'pincha e'tiborsiz qolib, video 0-soniyadan
   * boshlanardi — do'stlar bir-biridan yarim kino orqada qolardi.
   */
  const applyRemote = useCallback((target: RoomStateView) => {
    const player = playerRef.current
    if (!player || !activatedRef.current) return

    const position = expectedPosition(target, nowRef.current())
    const playerState = player.getPlayerState()
    const fresh = isFresh(playerState)

    suppress()

    if (target.isPlaying) {
      if (fresh) {
        player.loadVideoById({ videoId: target.videoId, startSeconds: position + SEEK_LEAD })
      } else {
        if (Math.abs(player.getCurrentTime() - position) > 0.4) {
          player.seekTo(position + SEEK_LEAD, true)
        }
        player.playVideo()
      }
    } else {
      if (fresh) {
        player.cueVideoById({ videoId: target.videoId, startSeconds: position })
      } else {
        if (Math.abs(player.getCurrentTime() - position) > 0.4) player.seekTo(position, true)
        player.pauseVideo()
      }
    }

    appliedAtRef.current = target.stateAt
  }, [])

  /**
   * Pleer hodisalari.
   *
   * Boshqaruv yashirilgani uchun bu yerda deyarli ish qolmadi: PLAYING va
   * PAUSED — bizning buyruqlarimizning aks-sadosi. Faqat video tugagani
   * muhim, aks holda hamma "o'ynayapti" holatida qotib qolardi.
   */
  const handlePlayerEvent = useCallback((event: YTStateEvent) => {
    if (!activatedRef.current) return
    if (event.data !== YT_STATE.ENDED) return
    if (!stateRef.current.isPlaying) return

    onActionRef.current(false, event.target.getDuration())
  }, [])

  /* ------------------------------------------------------------- pleerni ochish */

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return

    /**
     * YouTube API berilgan elementni iframe bilan **almashtiradi**. React
     * boshqaradigan tugunni bersak, ajratish paytida u tugunni topolmay
     * xato berardi — shuning uchun ichkariga o'zimiz qo'shgan, React
     * bilmaydigan tugunni beramiz.
     */
    const mount = document.createElement("div")
    mount.className = "size-full"
    host.appendChild(mount)

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return

        playerRef.current = new YT.Player(mount, {
          videoId: stateRef.current.videoId,
          playerVars: {
            // YouTube interfeysi butunlay o'chiriladi — boshqaruv bizniki.
            controls: 0,
            disablekb: 1,
            fs: 0,
            // Izohlar va oxirgi kadrdagi tavsiyalar ham kerak emas.
            iv_load_policy: 3,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            // Telegram WebView'da referrer bo'lmasligi mumkin — manzilni o'zimiz aytamiz.
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!cancelled) setReady(true)

              /**
               * Sinov uchun: dev rejimida pleerni konsoldan tekshirish mumkin
               * (`__ytPlayer.getPlayerState()`, `.getCurrentTime()`).
               * Sinxron muammolarini boshqa yo'l bilan aniqlab bo'lmaydi —
               * iframe ichidagi holat tashqaridan ko'rinmaydi.
               * Production qurilishida bu satr butunlay olib tashlanadi.
               */
              if (import.meta.env.DEV) {
                ;(window as unknown as Record<string, unknown>).__ytPlayer = playerRef.current
              }
            },
            onStateChange: handlePlayerEvent,
            onError: (event) => onErrorRef.current(describeYouTubeError(event.data)),
          },
        })
      })
      .catch((err: Error) => onErrorRef.current(err.message))

    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy()
      } catch {
        /* pleer allaqachon yo'q — muhim emas */
      }
      playerRef.current = null
      host.replaceChildren()
    }
    // Pleer bir marta yaratiladi: video almashsa quyidagi effekt qayta yuklaydi.
  }, [handlePlayerEvent])

  /* ------------------------------------------------------------ video almashsa */

  useEffect(() => {
    const player = playerRef.current
    if (!ready || !player) return
    if (loadedVideoRef.current === state.videoId) return

    loadedVideoRef.current = state.videoId
    suppress()
    player.cueVideoById({ videoId: state.videoId, startSeconds: 0 })
    appliedAtRef.current = 0
    setDisplay({ time: 0, duration: 0, playerState: YT_STATE.UNSTARTED })
  }, [state.videoId, ready])

  /* ------------------------------------------------- serverdagi o'zgarishlar */

  useEffect(() => {
    if (!ready || !activated) return
    if (state.stateAt <= appliedAtRef.current) return

    setPendingPlay(null)
    applyRemote(state)
  }, [state, ready, activated, applyRemote])

  /* ------------------------------------------------------ kuzatuv: og'ishlar */

  useEffect(() => {
    if (!ready || !activated) return

    const timer = window.setInterval(() => {
      const player = playerRef.current
      if (!player || scrubbingRef.current) return
      if (Date.now() < suppressRef.current) return

      const room = stateRef.current
      const playerState = player.getPlayerState()
      const at = Date.now()

      /**
       * Bufer odatda o'zi tugaydi, shuning uchun aralashmaymiz. Lekin u
       * qotib qolishi ham mumkin (ko'rinmayotgan oyna, uzilgan tarmoq) —
       * o'shanda videoni kerakli joydan qaytadan yuklaymiz.
       */
      if (playerState === YT_STATE.BUFFERING) {
        stalledSinceRef.current ||= at
        if (at - stalledSinceRef.current < STALL_TIMEOUT) return
        // Ko'rinmayotgan sahifada brauzer videoni boshlamaydi — qaytib
        // kelganda `visibilitychange` o'zi tiklaydi.
        if (document.hidden) return

        stalledSinceRef.current = 0
        suppress(2000)
        const target = room.isPlaying
          ? expectedPosition(room, nowRef.current()) + SEEK_LEAD
          : room.positionSec

        if (room.isPlaying) player.loadVideoById({ videoId: room.videoId, startSeconds: target })
        else player.cueVideoById({ videoId: room.videoId, startSeconds: target })
        return
      }

      stalledSinceRef.current = 0
      const fresh = isFresh(playerState)

      if (room.isPlaying) {
        const target = expectedPosition(room, nowRef.current())

        // Video o'zi to'xtab qolgan (reklama, tarmoq) — davom ettiramiz.
        if (fresh || playerState === YT_STATE.PAUSED) {
          if (document.hidden) return
          suppress()
          if (fresh) {
            player.loadVideoById({ videoId: room.videoId, startSeconds: target + SEEK_LEAD })
          } else {
            player.seekTo(target + SEEK_LEAD, true)
            player.playVideo()
          }
          return
        }

        if (Math.abs(player.getCurrentTime() - target) > DRIFT_TOLERANCE) {
          suppress(1500)
          player.seekTo(target + SEEK_LEAD, true)
        }
        return
      }

      /* Uy to'xtatilgan */
      if (playerState === YT_STATE.PLAYING) {
        suppress(900)
        player.pauseVideo()
        return
      }
      if (!fresh && Math.abs(player.getCurrentTime() - room.positionSec) > DRIFT_TOLERANCE) {
        suppress(900)
        player.seekTo(room.positionSec, true)
      }
    }, WATCH_TICK)

    return () => window.clearInterval(timer)
  }, [ready, activated])

  /**
   * Ilovaga qaytilganda darhol tiklanadi.
   *
   * Ko'rinmayotgan sahifada brauzer o'ynatishni boshlamaydi, shuning uchun
   * fonda turgan uy "to'xtab" qoladi. Qaytib kelgan zahoti uy holatini
   * qayta qo'llaymiz — foydalanuvchi kutib o'tirmasin.
   */
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden || !activatedRef.current) return
      stalledSinceRef.current = 0
      applyRemote(stateRef.current)
    }

    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [applyRemote])

  /* ------------------------------------------------------ vaqt ko'rsatkichi */

  useEffect(() => {
    if (!ready) return

    const timer = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return

      const time = player.getCurrentTime()
      const duration = player.getDuration()
      const playerState = player.getPlayerState()

      // Qiymat sezilarli o'zgarmasa qayta chizmaymiz.
      setDisplay((prev) =>
        Math.abs(prev.time - time) < 0.25 &&
        prev.duration === duration &&
        prev.playerState === playerState
          ? prev
          : { time, duration, playerState },
      )
    }, DISPLAY_TICK)

    return () => window.clearInterval(timer)
  }, [ready])

  /* --------------------------------------------------------------------- ovoz */

  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, String(volume))

    const player = playerRef.current
    if (!ready || !player) return

    if (volume <= 0) player.mute()
    else {
      player.unMute()
      player.setVolume(volume)
    }
  }, [volume, ready])

  /* --------------------------------------------------------------- to'liq ekran */

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggleFullscreen = () => {
    const wrap = wrapRef.current
    if (!wrap) return

    // Telegram WebView'da to'liq ekran har doim ham ruxsat etilmaydi.
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    else void wrap.requestFullscreen?.().catch(() => {})
  }

  /* ------------------------------------------------------------------ amallar */

  const duration = display.duration
  const covered = !ready || !activated

  /**
   * Ekranda ko'rinadigan va boshqaruv tayanadigan soniya.
   *
   * Pleer yuklanayotganda yoki qayta yuklanganda `getCurrentTime()` nolni
   * qaytaradi. O'shanda uning o'rniga uyning soati ko'rsatiladi: aks holda
   * "0:00" yonib turar, "+10 soniya" esa noldan hisoblab, hammani kino
   * boshiga tortib ketardi.
   */
  const playerLive =
    display.playerState === YT_STATE.PLAYING || display.playerState === YT_STATE.PAUSED
  const position = scrub ?? (playerLive ? display.time : expectedPosition(state, serverNow()))
  /** Tugmalar uchun: hali efirga chiqmagan bosish ham hisobga olinadi */
  const showPlaying = pendingPlay ?? state.isPlaying

  /**
   * Video haqiqatan ketayotgan lahzadan boshqa paytda pleer o'z parda bilan
   * yopiladi.
   *
   * YouTube boshqaruvini o'chirib bo'lsa ham, u yuklanish paytida sarlavha
   * bilan brend qatorini, to'xtatilganda esa "More videos" tavsiyalarini
   * ko'rsatishda davom etadi. Bosish o'tmasa ham bu ko'zga tashlanadi:
   * do'stingiz videoni yoqqanda sizda bir zum begona ramka yonib o'chardi.
   */
  const starting = showPlaying && display.playerState !== YT_STATE.PLAYING
  const veiled = !covered && (starting || !showPlaying)

  const activate = () => {
    haptic.impact("medium")
    setActivated(true)
    activatedRef.current = true
    // Teginish paytida chaqiramiz — brauzer ovozli o'ynatishga faqat shunda ruxsat beradi.
    applyRemote(stateRef.current)
  }

  /** Boshqarishga ruxsati bormi; bo'lmasa sababini ko'rsatadi. */
  const allowed = (): boolean => {
    if (canControl) return true
    onBlocked()
    return false
  }

  const togglePlay = () => {
    if (!allowed()) return
    const player = playerRef.current
    if (!player) return

    const next = !showPlaying
    haptic.impact("medium")
    setPendingPlay(next)

    // Avval o'z pleerimizni boshqaramiz — javob darhol sezilsin. Uyga esa
    // pleer haqiqatan o'sha holatga o'tgach xabar beriladi.
    const from = playerLive ? player.getCurrentTime() : position
    suppress(SETTLE_TIMEOUT + 500)
    if (next) player.playVideo()
    else player.pauseVideo()

    // To'xtatish darhol ma'lum, o'ynatish esa yuklanishni kutadi.
    broadcast(next, from, next)
  }

  /** Vaqt chizig'i qo'yib yuborilganda. */
  const commitSeek = (value: number) => {
    setScrub(null)
    if (!allowed()) return

    const player = playerRef.current
    if (!player) return

    haptic.select()
    suppress(SETTLE_TIMEOUT + 500)
    player.seekTo(value, true)
    broadcast(showPlaying, value, true)
  }

  const step = (delta: number) => {
    if (!allowed()) return
    const player = playerRef.current
    if (!player) return

    const limit = display.duration || Number.MAX_SAFE_INTEGER
    const next = Math.max(0, Math.min(limit, position + delta))

    haptic.select()
    setScrub(next)
    // Pleer yangi joyni ko'rsatguncha raqam orqaga sakramasin.
    window.setTimeout(() => setScrub(null), 1200)
    suppress(SETTLE_TIMEOUT + 500)
    player.seekTo(next, true)
    broadcast(showPlaying, next, true)
  }

  /* ---------------------------------------------------------------- ko'rinish */

  return (
    <div ref={wrapRef} className="overflow-hidden rounded-2xl bg-black">
      <div className="relative aspect-video w-full">
        {/* iframe hodisalarni qabul qilmaydi: YouTube'ning yashirin menyulari
            ham, bosib o'tkazish ham ishlamasin. */}
        <div ref={hostRef} className="pointer-events-none size-full [&>iframe]:size-full" />

        {/* Videoning o'zini bosish — o'ynatish/to'xtatish. Ayni paytda bu
            YouTube ko'rsatmoqchi bo'lgan narsani yopadigan parda. */}
        {!covered && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={showPlaying ? "To'xtatish" : "O'ynatish"}
            className={cn(
              "absolute inset-0 grid place-items-center transition-opacity duration-200",
              veiled ? "bg-black/95 backdrop-blur-sm" : "bg-transparent",
            )}
          >
            {starting ? (
              <span className="flex flex-col items-center gap-2 text-white/80">
                <Loader2 className="size-6 animate-spin" />
                <span className="text-xs">Yuklanmoqda…</span>
              </span>
            ) : (
              !showPlaying && (
                <span className="flex flex-col items-center gap-2">
                  <span className="grid size-14 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
                    <Play className="size-6 translate-x-0.5 fill-white text-white" />
                  </span>
                  <span className="text-xs text-white/70">
                    {state.stateByName ? `${state.stateByName} to'xtatdi` : "To'xtatilgan"}
                  </span>
                </span>
              )
            )}
          </button>
        )}

        {covered && (
          <div className="absolute inset-0 grid place-items-center bg-black/75 backdrop-blur-[2px]">
            {!ready ? (
              <div className="flex flex-col items-center gap-2 text-white/80">
                <Loader2 className="size-6 animate-spin" />
                <span className="text-xs">Pleer yuklanmoqda…</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={activate}
                className="tap flex flex-col items-center gap-2.5 px-6 text-center text-white"
              >
                <span className="grid size-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur">
                  <Play className="size-7 translate-x-0.5 fill-white" />
                </span>
                <span className="text-sm font-semibold">Birga ko'rishni boshlash</span>
                <span className="max-w-60 text-[11px] leading-snug text-white/70">
                  Bir marta bosing — shundan keyin video hammada bir vaqtda ketadi
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- o'z boshqaruvimiz --- */}
      <div className="space-y-1 bg-black px-2.5 pt-1.5 pb-2 text-white">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.5}
          value={Math.min(position, Math.max(duration, 1))}
          disabled={covered || !duration}
          onChange={(e) => setScrub(Number(e.target.value))}
          onPointerUp={(e) => commitSeek(Number(e.currentTarget.value))}
          onKeyUp={(e) => commitSeek(Number(e.currentTarget.value))}
          aria-label="Video vaqti"
          className="h-1 w-full accent-primary disabled:opacity-40"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            disabled={covered}
            aria-label={showPlaying ? "To'xtatish" : "O'ynatish"}
            className="tap grid size-8 shrink-0 place-items-center rounded-full bg-white/15 disabled:opacity-40"
          >
            {showPlaying ? (
              <Pause className="size-4 fill-white" />
            ) : (
              <Play className="size-4 translate-x-px fill-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => step(-10)}
            disabled={covered}
            className="tap shrink-0 text-[11px] font-medium text-white/70 disabled:opacity-40"
          >
            −10s
          </button>
          <button
            type="button"
            onClick={() => step(10)}
            disabled={covered}
            className="tap shrink-0 text-[11px] font-medium text-white/70 disabled:opacity-40"
          >
            +10s
          </button>

          <span className="shrink-0 text-[11px] tabular-nums text-white/80">
            {formatVideoTime(position)}
            {duration > 0 && ` / ${formatVideoTime(duration)}`}
          </span>

          <div className="flex-1" />

          {!canControl && (
            <span className="flex shrink-0 items-center gap-1 text-[10px] text-white/60">
              <Lock className="size-3" />
              uy egasi
            </span>
          )}

          <button
            type="button"
            onClick={() => setVolume(volume > 0 ? 0 : 100)}
            aria-label={volume > 0 ? "Ovozni o'chirish" : "Ovozni yoqish"}
            className="tap shrink-0 text-white/80"
          >
            {volume > 0 ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Kino ovozi"
            className="h-1 w-14 shrink-0 accent-primary"
          />

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Oynadan chiqish" : "To'liq ekran"}
            className="tap shrink-0 text-white/80"
          >
            {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Video hali boshlanmagan (yoki tugagan) — bunda `seekTo` ishonchsiz. */
const isFresh = (playerState: number) =>
  playerState === YT_STATE.UNSTARTED ||
  playerState === YT_STATE.CUED ||
  playerState === YT_STATE.ENDED

function clampVolume(raw: string | null): number {
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 100
}
