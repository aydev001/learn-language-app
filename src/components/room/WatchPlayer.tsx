import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Play } from "lucide-react"

import type { RoomStateView } from "@shared/types"
import { expectedPosition } from "@/lib/rooms"
import { haptic } from "@/lib/telegram"
import {
  YT_STATE,
  describeYouTubeError,
  loadYouTubeApi,
  type YTPlayer,
  type YTStateEvent,
} from "@/lib/youtube"

/**
 * Uy a'zolari uchun sinxron YouTube pleeri.
 *
 * ## Ikki tomonlama sinxron
 *
 * 1. **Serverdan** — `state.stateAt` o'zgarsa, kimdir boshqargan bo'ladi:
 *    videoni o'sha joyga o'tkazamiz va o'ynatamiz/to'xtatamiz.
 * 2. **Serverga** — foydalanuvchi pleerning o'z tugmalarini bossa, buni
 *    sezib, boshqalarga uzatamiz.
 *
 * ## Aks-sado muammosi
 *
 * Serverdan kelgan buyruqni bajarganda pleer ham "PLAYING" hodisasini
 * beradi — uni yana serverga yuborsak, cheksiz halqa hosil bo'ladi.
 * Shuning uchun har bir dasturiy buyruqdan keyin qisqa "jim" oyna
 * (`suppressUntil`) qo'yamiz va o'sha davrdagi hodisalarni e'tiborsiz
 * qoldiramiz.
 */

/** Shu farqdan katta og'ish bo'lsa video tenglashtiriladi (sekund). */
const DRIFT_TOLERANCE = 1.5

/** Foydalanuvchi o'zi surganini shu sakrashdan bilamiz (sekund). */
const SEEK_JUMP = 1.2

/** Dasturiy buyruqdan keyin hodisalar e'tiborsiz qoladigan vaqt (ms). */
const SUPPRESS_MS = 1200

/** Pleer holatini qanchalik tez-tez tekshiramiz (ms). */
const WATCH_TICK = 700

export interface WatchPlayerProps {
  state: RoomStateView
  /** Server soati bo'yicha hozirgi vaqt */
  serverNow: () => number
  /** Menikim — o'z harakatimni aks-sado sifatida qayta qo'llamaslik uchun */
  meId: number
  canControl: boolean
  /** 0..100 */
  volume: number
  /** Foydalanuvchi pleerni o'zi boshqardi */
  onAction: (isPlaying: boolean, positionSec: number) => void
  /** Ruxsatsiz boshqarishga urinildi */
  onBlocked: () => void
  onError: (message: string) => void
}

export function WatchPlayer({
  state,
  serverNow,
  meId,
  canControl,
  volume,
  onAction,
  onBlocked,
  onError,
}: WatchPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  const [ready, setReady] = useState(false)
  /**
   * Brauzer ovozli videoni foydalanuvchi bosmaguncha o'ynatmaydi. Shuning
   * uchun birinchi teginishgacha hech narsa boshlamaymiz — aks holda mehmon
   * "nega ketmayapti" deb qolardi.
   */
  const [activated, setActivated] = useState(false)

  /* Hodisa ishlovchilari bir marta yaratiladi, ular esa eng yangi qiymatlarni
     ko'rishi kerak — shuning uchun oynadagi qiymatlarni ref'da saqlaymiz. */
  const stateRef = useRef(state)
  const canControlRef = useRef(canControl)
  const activatedRef = useRef(activated)
  const nowRef = useRef(serverNow)
  const onActionRef = useRef(onAction)
  const onBlockedRef = useRef(onBlocked)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    stateRef.current = state
    canControlRef.current = canControl
    activatedRef.current = activated
    nowRef.current = serverNow
    onActionRef.current = onAction
    onBlockedRef.current = onBlocked
    onErrorRef.current = onError
  })

  const suppressRef = useRef(0)
  /** Qo'llangan oxirgi server holati — takror qo'llamaslik uchun */
  const appliedAtRef = useRef(0)
  /** Surishni aniqlash uchun: oxirgi o'lchov */
  const lastTickRef = useRef({ time: 0, at: 0 })
  /** Pleerga hozir yuklangan video — faqat haqiqatan almashganda qayta yuklaymiz */
  const loadedVideoRef = useRef(state.videoId)

  const suppress = (ms = SUPPRESS_MS) => {
    suppressRef.current = Date.now() + ms
  }

  /**
   * Pleerning o'z tugmalari bosilganda.
   *
   * Bu ishlovchi pleer yaratilganda bir marta ulanadi, shuning uchun ichkarida
   * faqat ref'lardagi eng yangi qiymatlar ishlatiladi.
   */
  const handlePlayerEvent = useCallback((event: YTStateEvent) => {
    if (Date.now() < suppressRef.current) return
    if (!activatedRef.current) return

    const room = stateRef.current
    const player = event.target
    const playing = event.data === YT_STATE.PLAYING
    const paused = event.data === YT_STATE.PAUSED
    const ended = event.data === YT_STATE.ENDED

    if (!playing && !paused && !ended) return
    // Holat allaqachon shunday — bu bizning buyruqning aks-sadosi.
    if (playing === room.isPlaying && !ended) return

    if (!canControlRef.current) {
      onBlockedRef.current()
      // Uy holatiga qaytaramiz.
      const position = expectedPosition(room, nowRef.current())
      suppress()
      player.seekTo(position, true)
      if (room.isPlaying) player.playVideo()
      else player.pauseVideo()
      return
    }

    if (ended) onActionRef.current(false, player.getDuration())
    else onActionRef.current(playing, player.getCurrentTime())
  }, [])

  /** Server holatini pleerga qo'llaydi. */
  const applyRemote = useCallback((target: RoomStateView) => {
    const player = playerRef.current
    if (!player || !activatedRef.current) return

    const position = expectedPosition(target, nowRef.current())
    // Keraksiz surish qilmaymiz: hali boshlanmagan videoni surish YouTube'da
    // qora ekran chiqaradi va poster yo'qoladi.
    const needsSeek = Math.abs(player.getCurrentTime() - position) > 0.6

    suppress()

    if (target.isPlaying) {
      // Avval o'ynatib, keyin suramiz: hali boshlanmagan videoda teskari
      // tartib ishlamaydi — `seekTo` uni yuklashga qo'yadi va keyingi
      // `playVideo` e'tiborsiz qoladi.
      player.playVideo()
      if (needsSeek) player.seekTo(position, true)
    } else {
      if (needsSeek) player.seekTo(position, true)
      player.pauseVideo()
    }

    appliedAtRef.current = target.stateAt
    // Keyingi o'lchov uchun tayanch nuqta yo'q: surish haqiqatan bajarilgani
    // noma'lum, taxmin qilsak buni "foydalanuvchi surdi" deb o'qib qolamiz.
    lastTickRef.current = { time: player.getCurrentTime(), at: 0 }
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
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            // Telegram WebView'da referrer bo'lmasligi mumkin — manzilni o'zimiz aytamiz.
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!cancelled) setReady(true)
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
    // Pleer bir marta yaratiladi: video almashsa `cueVideoById` ishlaydi.
  }, [handlePlayerEvent])

  /* ------------------------------------------------------------ video almashsa */

  useEffect(() => {
    const player = playerRef.current
    if (!ready || !player) return
    // Pleer shu video bilan yaratilgan — birinchi safar qayta yuklash shart
    // emas, aks holda poster o'rniga qora ekran chiqadi.
    if (loadedVideoRef.current === state.videoId) return

    loadedVideoRef.current = state.videoId
    suppress()
    player.cueVideoById(state.videoId, 0)
    appliedAtRef.current = 0
    lastTickRef.current = { time: 0, at: 0 }
  }, [state.videoId, ready])

  /* ------------------------------------------------- serverdagi o'zgarishlar */

  useEffect(() => {
    if (!ready || !activated) return
    if (state.stateAt <= appliedAtRef.current) return

    const player = playerRef.current
    if (!player) return

    // O'zim boshlagan o'zgarish bo'lsa va pleer allaqachon o'sha joyda —
    // qayta surmaymiz, aks holda video sezilarli "sakrab" qo'yardi.
    const position = expectedPosition(state, serverNow())
    const mine = state.stateBy === meId
    if (mine && Math.abs(player.getCurrentTime() - position) < DRIFT_TOLERANCE) {
      appliedAtRef.current = state.stateAt
      return
    }

    applyRemote(state)
  }, [state, ready, activated, meId, serverNow, applyRemote])

  /* ------------------------------------------------- kuzatuv: og'ish va surish */

  useEffect(() => {
    if (!ready || !activated) return

    const timer = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return

      const at = Date.now()
      const time = player.getCurrentTime()
      const playerState = player.getPlayerState()
      const room = stateRef.current

      /**
       * `at: 0` — "oldingi o'lchov ishonchsiz". Bu muhim: hali boshlanmagan
       * yoki buferlanayotgan pleerning vaqti sakrab turadi, uni foydalanuvchi
       * surgani deb hisoblasak, butun uyni noto'g'ri joyga tortib ketamiz.
       */
      if (at < suppressRef.current) {
        lastTickRef.current = { time, at: 0 }
        return
      }

      /* Pleer barqaror holatdami? */
      if (playerState !== YT_STATE.PLAYING && playerState !== YT_STATE.PAUSED) {
        lastTickRef.current = { time, at: 0 }

        // Uy o'ynayapti, pleer esa hali turibdi — turtki beramiz. Buyruq
        // yo'qolib qolishi mumkin (masalan seekTo bilan bir vaqtda kelsa).
        if (
          room.isPlaying &&
          (playerState === YT_STATE.CUED || playerState === YT_STATE.UNSTARTED)
        ) {
          suppress(1500)
          player.playVideo()
          player.seekTo(expectedPosition(room, nowRef.current()), true)
        }
        return
      }

      const previous = lastTickRef.current
      lastTickRef.current = { time, at }

      /* 1. Foydalanuvchi vaqt chizig'ini surdimi?
         Odatdagi o'tishda vaqt real vaqt qadar oshadi; sakrash bo'lsa — surilgan. */
      if (previous.at) {
        const elapsed = playerState === YT_STATE.PLAYING ? (at - previous.at) / 1000 : 0
        const jump = time - previous.time - elapsed

        if (Math.abs(jump) > SEEK_JUMP) {
          if (!canControlRef.current) {
            onBlockedRef.current()
            applyRemote(room)
            return
          }
          suppress(600)
          onActionRef.current(playerState !== YT_STATE.PAUSED, time)
          return
        }
      }

      /* 2. Sekin-asta og'ib ketganini tenglashtiramiz (bufer, sekin internet). */
      const target = expectedPosition(room, nowRef.current())
      if (Math.abs(time - target) > DRIFT_TOLERANCE) {
        suppress(800)
        player.seekTo(target, true)
        lastTickRef.current = { time: target, at }
      }

      /* 3. O'ynash holati mos kelmasa (masalan reklama tugadi) — to'g'rilaymiz. */
      const playing = playerState === YT_STATE.PLAYING
      if (playing !== room.isPlaying) {
        suppress(800)
        if (room.isPlaying) player.playVideo()
        else player.pauseVideo()
      }
    }, WATCH_TICK)

    return () => window.clearInterval(timer)
  }, [ready, activated, applyRemote])

  /* --------------------------------------------------------------------- ovoz */

  useEffect(() => {
    const player = playerRef.current
    if (!ready || !player) return

    if (volume <= 0) player.mute()
    else {
      player.unMute()
      player.setVolume(volume)
    }
  }, [volume, ready])

  /* ------------------------------------------------------------------ ko'rinish */

  const activate = () => {
    haptic.impact("medium")
    setActivated(true)
    activatedRef.current = true
    // Teginish paytida chaqiramiz — brauzer ovozli o'ynatishga faqat shunda ruxsat beradi.
    applyRemote(stateRef.current)
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {/* YouTube ichkaridagi tugunni iframe bilan almashtiradi va klasslarni
          saqlamaydi — o'lchamni ota-elementdan beramiz. */}
      <div ref={hostRef} className="size-full [&>iframe]:size-full" aria-label="Video" />

      {(!ready || !activated) && (
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
  )
}
