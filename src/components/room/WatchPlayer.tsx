import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import {
  FastForward,
  Loader2,
  Lock,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  Volume2,
  VolumeX,
} from "lucide-react"

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
 * ## Yagona haqiqat manbai — uy holati
 *
 * Ilgari har bir mijoz o'z pleeridan o'qigan soniyani uyga qaytarib yozardi:
 * "men 100,2 daman" — "yo'q, men 99,8 daman". Ikki tomon bir-birining
 * o'lchovini ustiga yozar, video esa oldinga-orqaga sakrardi. Ekrandagi vaqt
 * ham pleerdan olingani uchun ikki ekranda ikki xil raqam turardi, pleer
 * qayta yuklanganda esa 0:00 ga tushib ketardi.
 *
 * Endi pleerdan o'qilgan hech narsa uyga ketmaydi. Uyga faqat **niyat**
 * yuboriladi — "o'ynat", "to'xtat", "shu soniyaga o't" — soniyasi esa har
 * doim uyning soatidan olinadi (`expectedPosition`). Ekrandagi vaqt ham,
 * chiziq ham o'sha soatdan chiziladi, shuning uchun ikkala ekranda bir xil
 * raqam turadi va u hech qachon orqaga sakramaydi.
 *
 * Pleer bu yerda quyi qurilma: uni `steer()` uy holatiga qarab yo'naltiradi.
 * Bosilgan tugma ham, do'stdan kelgan o'zgarish ham xuddi shu bitta yo'ldan
 * o'tadi — "kim boshladi" degan farq qolmadi, demak ikki tomon bir-birini
 * ustma-ust tuzatadigan holat ham qolmadi.
 *
 * ## Nega YouTube boshqaruvi yashirilgan
 *
 * Pleerning o'z tugmalari ochiq bo'lganda biz foydalanuvchi nima qilganini
 * taxmin qilardik: vaqt sakradimi — surgan, "PAUSED" keldimi — to'xtatgan.
 * Bufer ham, reklama ham, hali boshlanmagan video ham xuddi shunday
 * ko'rinadi. Endi iframe hodisalarni umuman qabul qilmaydi
 * (`pointer-events: none`, `tabindex="-1"`), boshqaruv esa butunlay bizniki.
 */

/** Uy soatidan shundan ko'proq og'ish bo'lsa video jimgina tenglashtiriladi (sekund). */
const DRIFT_TOLERANCE = 0.75

/** Ataylab qilingan harakatda (surish, o'ynatish) shu aniqlik talab qilinadi (sekund). */
const PRECISE = 0.35

/** Tuzatuvchi surishdan keyin keyingi tuzatishgacha (ms). */
const DRIFT_HOLD = 4000

/** Buyruq berilgandan keyin kuzatuv shuncha jim turadi (ms). */
const SEEK_HOLD = 1200
const LOAD_HOLD = 2500

/**
 * Pleer shuncha vaqt buferda qotib qolsa, video qaytadan yuklanadi (ms).
 *
 * Odatda bufer o'zi tugaydi va aralashish faqat zarar qiladi. Lekin u
 * ba'zan butunlay qotib qoladi — tarmoq uzilib qolganda, ko'rinmayotgan
 * oynada. O'shanda kutish cheksiz davom etardi.
 */
const STALL_TIMEOUT = 6000

/** Pleer holati uy holatiga shu oraliqda solishtiriladi (ms). */
const WATCH_TICK = 700

/** Ekrandagi vaqt uy soatidan shu oraliqda qayta chiziladi (ms). */
const CLOCK_TICK = 250

/** O'ynab turgan video buferga tushsa, parda shuncha kutib yonadi (ms). */
const VEIL_DELAY = 400

/** Bosilgan tugmaga javob kelmasa, shuncha vaqtdan keyin uy holatiga qaytamiz (ms). */
const PENDING_TTL = 5000

/**
 * `seekTo` bir zumda bajarilmaydi — pleer yangi joyni buferlaguncha vaqt
 * ketadi va o'sha vaqtda uy soati siljib bo'ladi. Shuning uchun surganda
 * biroz oldinga suramiz. Qancha oldinga — o'lchab bilamiz: tarmoq sekin
 * bo'lsa narx o'zi ko'payadi, tez bo'lsa kamayadi. Ilgari bu qiymat doimiy
 * 0,5 s edi va sekin tarmoqda har tuzatishdan keyin yana orqada qolinardi —
 * natijada tuzatish sikli, ya'ni uzluksiz qotish.
 */
const MIN_LEAD = 0.3
const MAX_LEAD = 2.5

/** Kino tugadi deb hisoblanadigan chegara (sekund). */
const END_EPSILON = 0.3


/**
 * Chiziq qo'yib yuborilgach markazga yuborishdan oldin shuncha kutiladi (ms).
 *
 * Brauzer `input` hodisasini `pointerup` dan keyin ham yuborishi mumkin;
 * klaviaturada esa tugma bosib turilganda o'nlab hodisa keladi. Kechikish
 * ularning hammasini bitta yuborishga jamlaydi.
 */
const SEEK_COMMIT_DELAY = 120
const VOLUME_KEY = "room-volume"

export interface WatchPlayerProps {
  state: RoomStateView
  /** Server soati bo'yicha hozirgi vaqt */
  serverNow: () => number
  /** O'zimizning id — o'z harakatimizning aks-sadosini ajratish uchun */
  meId: number
  /** Kino tugaganini uyga faqat uy egasi yozadi */
  isOwner: boolean
  canControl: boolean
  /** Foydalanuvchi boshqaruv tugmasini bosdi (niyat: nima va qaysi soniyada) */
  onAction: (isPlaying: boolean, positionSec: number) => void
  /** Ruxsatsiz boshqarishga urinildi */
  onBlocked: () => void
  onError: (message: string) => void
}

export function WatchPlayer({
  state,
  serverNow,
  meId,
  isOwner,
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
  /**
   * Pleerning holati. Ilgari u 500 ms da bir marta so'ralardi va parda
   * kechikib o'chardi; endi hodisadan keladi, ya'ni o'sha zahoti.
   */
  const [playerState, setPlayerState] = useState<number>(YT_STATE.UNSTARTED)
  const [duration, setDuration] = useState(0)
  /** Foydalanuvchi chiziqni ushlab turibdi — o'sha paytda kuzatuv aralashmaydi */
  const [scrub, setScrub] = useState<number | null>(null)
  /**
   * Bosilgan, lekin hali uyga yetib bormagan holat. Tugma darhol o'zgarishi
   * kerak — foydalanuvchi javob kutib turmasin.
   */
  const [pendingPlay, setPendingPlay] = useState<boolean | null>(null)
  /**
   * Mayda bufer tugaguncha parda ushlab turiladi.
   *
   * Tarmoq bir zum cho'kkanda ekran qorayib-yorishib turmasin. Faqat
   * o'zimiz surmagan buferga beriladi: o'z surishimizdan keyin YouTube
   * baribir sarlavhasini ko'rsatadi, uni yopish kerak.
   */
  const [graceUntil, setGraceUntil] = useState(0)
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
  const isOwnerRef = useRef(isOwner)
  const durationRef = useRef(0)
  /** Pleerning oldingi holati — bufer qayerdan kelganini bilish uchun */
  const prevPlayerStateRef = useRef(YT_STATE.UNSTARTED as number)

  useEffect(() => {
    stateRef.current = state
    activatedRef.current = activated
    scrubbingRef.current = scrub !== null
    nowRef.current = serverNow
    onActionRef.current = onAction
    onErrorRef.current = onError
    isOwnerRef.current = isOwner
  })

  /** Buyruq berilgan — pleer unga yetib borguncha kuzatuv aralashmaydi. */
  const holdRef = useRef(0)
  /** Og'ish oxirgi marta qachon tuzatilgan — tuzatishlar ketma-ket kelmasin. */
  const driftHoldRef = useRef(0)
  /** Pleerga qo'llangan oxirgi uy holati — takror qo'llamaslik uchun */
  const appliedAtRef = useRef(0)
  /** Bufer qachondan beri davom etyapti (0 — buferda emas) */
  const stalledSinceRef = useRef(0)
  /** Pleerga hozir yuklangan video */
  const loadedVideoRef = useRef(state.videoId)
  /** Surish boshlangan lahza — narxini o'lchash uchun */
  const seekStartedAtRef = useRef(0)
  /** O'lchangan surish narxi (sekund) */
  const leadRef = useRef(0.6)
  /** Kino tugagani uyga bir marta yozilsin */
  const endReportedRef = useRef(false)
  /** Vaqt chizig'i barmoq/sichqoncha ostida */
  const draggingRef = useRef(false)
  /** Markazga yuborilishi kutilayotgan soniya */
  const pendingSeekRef = useRef<number | null>(null)
  const seekTimerRef = useRef(0)

  const hold = useCallback((ms: number) => {
    holdRef.current = Date.now() + ms
  }, [])

  /**
   * Pleerni buferga tushiradigan buyruq.
   *
   * `measure` — buyruq o'ynatish bilan tugaydimi. To'xtatilgan videoni
   * yuklashda o'lchov boshlanmasligi kerak: u o'ynay boshlagunga qadar
   * odam bir soat kutishi mumkin va o'sha soat "surish narxi" bo'lib
   * qolardi.
   */
  const beginSeek = useCallback((ms: number, measure = true) => {
    seekStartedAtRef.current = measure ? Date.now() : 0
    stalledSinceRef.current = 0
    holdRef.current = Date.now() + ms
  }, [])

  /* --------------------------------------------------------------- steer */

  /**
   * Pleerni uy holatiga yo'naltiradi.
   *
   * Bu — pleerga tegadigan yagona joy. Tugma bosilishi ham, do'stdan kelgan
   * o'zgarish ham, kuzatuvning jimgina tuzatishi ham shu funksiyadan o'tadi.
   * Hech qayerda pleerdan o'qilgan qiymat uyga qaytmaydi: mo'ljal har doim
   * uyning soatidan (`expectedPosition`) hisoblanadi.
   *
   * `force` — ataylab qilingan harakat (kimdir tugma bosdi). Bunda kutish
   * davri e'tiborga olinmaydi va aniqlik talabi qattiqroq bo'ladi: surilgan
   * joy aniq bo'lishi kerak. Oddiy kuzatuvda esa aksincha — mayda og'ish
   * uchun videoni bezovta qilmaymiz.
   */
  const steer = useCallback((room: RoomStateView, force = false) => {
    const player = playerRef.current
    if (!player || !activatedRef.current) return
    if (!force && Date.now() < holdRef.current) return

    const live = player.getPlayerState()
    const fresh = isFresh(live)
    const total = durationRef.current
    const lead = leadRef.current

    let target = expectedPosition(room, nowRef.current())
    if (total > 0) target = Math.min(target, total)

    /* --- uy to'xtatilgan --- */
    if (!room.isPlaying) {
      if (fresh) {
        beginSeek(LOAD_HOLD, false)
        player.cueVideoById({ videoId: room.videoId, startSeconds: target })
        return
      }
      if (live === YT_STATE.PLAYING || live === YT_STATE.BUFFERING) {
        hold(SEEK_HOLD)
        player.pauseVideo()
      }
      if (Math.abs(player.getCurrentTime() - target) > PRECISE) {
        hold(SEEK_HOLD)
        player.seekTo(target, true)
      }
      return
    }

    /* --- kino oxiriga yetdi: quvishning ma'nosi yo'q --- */
    if (total > 0 && target >= total - END_EPSILON) {
      if (live === YT_STATE.PLAYING) player.pauseVideo()
      return
    }

    /* --- uy o'ynayapti --- */

    /**
     * Ko'rinmayotgan sahifada brauzer o'ynatishni umuman boshlamaydi.
     * Urinaversak, pleer har safar qaytadan yuklanib, hech qachon ketmaydigan
     * halqaga tushardi. Qaytib kelganda `visibilitychange` o'zi tiklaydi.
     */
    if (document.hidden) return

    // Hali boshlanmagan videoda `seekTo` ishonchsiz: u ko'pincha e'tiborsiz
    // qolib, video 0-soniyadan boshlanardi.
    if (fresh) {
      beginSeek(LOAD_HOLD)
      player.loadVideoById({ videoId: room.videoId, startSeconds: target + lead })
      return
    }

    if (live === YT_STATE.PAUSED) {
      beginSeek(LOAD_HOLD)
      player.seekTo(target + lead, true)
      player.playVideo()
      return
    }

    // Bufer o'zi tugashi kerak — o'rtasida surish uni faqat cho'zadi.
    if (live === YT_STATE.BUFFERING) return

    const drift = player.getCurrentTime() - target
    const limit = force ? PRECISE : DRIFT_TOLERANCE
    if (Math.abs(drift) <= limit) return
    if (!force && Date.now() < driftHoldRef.current) return

    beginSeek(SEEK_HOLD)
    driftHoldRef.current = Date.now() + DRIFT_HOLD
    player.seekTo(target + lead, true)
  }, [beginSeek, hold])

  /**
   * Uyga niyat yuboradi va pleerni o'sha niyat bo'yicha darhol yo'naltiradi.
   *
   * Pleerga darhol tegish ikki sababga ko'ra zarur: javob kutilmasin va
   * `playVideo()` foydalanuvchi bosgan lahzada chaqirilsin — brauzer ovozli
   * videoni faqat shunda boshlaydi.
   *
   * Yuboriladigan soniya pleerdan emas, uy soatidan olinadi.
   */
  const commit = useCallback(
    (isPlaying: boolean, wanted: number) => {
      /**
       * O'ynatishda uy soati biroz orqadan qo'yiladi.
       *
       * Pleer buyruqdan keyin darhol ketmaydi — avval buferlaydi. Soatni
       * "hozir"dan boshlasak, o'sha buferlash vaqti kinodan tushib qolardi:
       * to'xtatilgan joydan davom etgan odam gapning o'rtasini eshitmasdi.
       * Shuning uchun o'lchangan surish narxi chegirib yuboriladi — pleer
       * haqiqatan ketgan lahzada uy soati aynan kerakli soniyada bo'ladi.
       */
      const target = Math.max(0, isPlaying ? wanted - leadRef.current : wanted)

      setPendingPlay(isPlaying)
      endReportedRef.current = false
      driftHoldRef.current = 0
      // Uy soati serverda yangilanadi; shu paytgacha o'zimiznikini ishlatamiz.
      steer({ ...stateRef.current, isPlaying, positionSec: target, stateAt: nowRef.current() }, true)
      onActionRef.current(isPlaying, target)
    },
    [steer],
  )

  /* ------------------------------------------------------------- pleerni ochish */

  const handlePlayerEvent = useCallback((event: YTStateEvent) => {
    const next = event.data
    const prev = prevPlayerStateRef.current
    prevPlayerStateRef.current = next
    setPlayerState(next)

    /**
     * O'ynab turgan video buferga tushdi va buni biz qilmadik (tarmoq bir
     * zum cho'kdi) — parda darhol yonmasin. O'z surishimizdan keyingi bufer
     * boshqa gap: YouTube o'shanda sarlavhasini ko'rsatadi, ya'ni yopish kerak.
     */
    if (next === YT_STATE.BUFFERING && prev === YT_STATE.PLAYING && !seekStartedAtRef.current) {
      setGraceUntil(Date.now() + VEIL_DELAY)
    }

    // Buyruq o'ynatish bilan tugamadi — surish narxi o'lchovi bekor bo'ladi.
    if (next === YT_STATE.PAUSED || next === YT_STATE.CUED) seekStartedAtRef.current = 0

    const total = event.target.getDuration()
    if (total > 0 && total !== durationRef.current) {
      durationRef.current = total
      setDuration(total)
    }

    if (next === YT_STATE.PLAYING) {
      stalledSinceRef.current = 0
      /**
       * Surish qancha vaqt olgani — keyingi safar shuncha oldinga suramiz.
       * Yumshoq o'rtacha: bitta sekin yuklanish o'lchovni butunlay buzib
       * yubormasin.
       */
      if (seekStartedAtRef.current) {
        const cost = (Date.now() - seekStartedAtRef.current) / 1000
        seekStartedAtRef.current = 0
        leadRef.current = clamp((leadRef.current + cost) / 2, MIN_LEAD, MAX_LEAD)
      }
    }
  }, [])

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
            onReady: (event) => {
              if (cancelled) return
              setReady(true)

              /**
               * Sichqoncha iframe'ga o'tmaydi (`pointer-events: none`), lekin
               * klaviatura o'tishi mumkin edi: Tab bilan fokus iframe'ga
               * tushsa, YouTube o'z tugmalarini ko'rsatib yuborardi.
               */
              const frame = (
                event.target as unknown as { getIframe?: () => HTMLIFrameElement }
              ).getIframe?.()
              frame?.setAttribute("tabindex", "-1")
              frame?.setAttribute("aria-hidden", "true")

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
    durationRef.current = 0
    endReportedRef.current = false
    appliedAtRef.current = 0
    setDuration(0)
    beginSeek(LOAD_HOLD, false)
    player.cueVideoById({ videoId: state.videoId, startSeconds: 0 })
  }, [state.videoId, ready, beginSeek])

  /* ------------------------------------------------- markazdagi o'zgarishlar */

  useEffect(() => {
    if (!ready || !activated) return
    if (state.stateAt <= appliedAtRef.current) return

    appliedAtRef.current = state.stateAt
    setPendingPlay(null)
    endReportedRef.current = false

    /**
     * O'z harakatimizning aks-sadosi bo'lsa pleerga majburan tegmaymiz: uni
     * `commit()` allaqachon yo'naltirgan, hozir esa u yangi joyni
     * buferlayapti. Ilgari shu aks-sado ustiga yana bir surish tushar va
     * bosgan odamning o'zi bir zum orqaga tortilardi.
     */
    steer(state, state.stateBy !== meId)
  }, [state, ready, activated, meId, steer])

  /* -------------------------------------------------- kuzatuv: pleer va uy */

  useEffect(() => {
    if (!ready || !activated) return

    const timer = window.setInterval(() => {
      const player = playerRef.current
      if (!player || scrubbingRef.current) return

      const room = stateRef.current
      const at = Date.now()

      // Hodisa yo'qolib qolishi mumkin — holatni vaqti-vaqti bilan solishtiramiz.
      const live = player.getPlayerState()
      prevPlayerStateRef.current = live
      setPlayerState((prev) => (prev === live ? prev : live))

      const total = player.getDuration()
      if (total > 0 && total !== durationRef.current) {
        durationRef.current = total
        setDuration(total)
      }

      /**
       * Kino tugadi. Uyga buni faqat uy egasi yozadi — aks holda har bir
       * a'zo bir vaqtda yozib, uy holati ustma-ust almashardi.
       */
      if (room.isPlaying && durationRef.current > 0) {
        const clock = expectedPosition(room, nowRef.current())
        if (clock >= durationRef.current - END_EPSILON) {
          if (live === YT_STATE.PLAYING) player.pauseVideo()
          if (isOwnerRef.current && !endReportedRef.current) {
            endReportedRef.current = true
            onActionRef.current(false, durationRef.current)
          }
          return
        }
      }

      /**
       * Bufer odatda o'zi tugaydi, shuning uchun aralashmaymiz. Lekin u
       * qotib qolishi ham mumkin — o'shanda videoni kerakli joydan
       * qaytadan yuklaymiz.
       */
      if (live === YT_STATE.BUFFERING) {
        stalledSinceRef.current ||= at
        if (at - stalledSinceRef.current < STALL_TIMEOUT) return
        if (document.hidden) return

        stalledSinceRef.current = 0
        holdRef.current = 0
        // Qotib qolgan bufer — surish narxi haqiqatan qimmat ekan.
        leadRef.current = clamp(leadRef.current * 1.5, MIN_LEAD, MAX_LEAD)
        beginSeek(LOAD_HOLD, room.isPlaying)

        if (room.isPlaying) {
          const target = expectedPosition(room, nowRef.current()) + leadRef.current
          player.loadVideoById({ videoId: room.videoId, startSeconds: target })
        } else {
          player.cueVideoById({ videoId: room.videoId, startSeconds: room.positionSec })
        }
        return
      }

      stalledSinceRef.current = 0
      steer(room)
    }, WATCH_TICK)

    return () => window.clearInterval(timer)
  }, [ready, activated, steer, beginSeek])

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
      holdRef.current = 0
      driftHoldRef.current = 0
      steer(stateRef.current, true)
    }

    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [steer])

  /* ------------------------------------------------------ uy soati (ekran) */

  /**
   * Ekrandagi vaqt pleerdan emas, uy soatidan chiziladi — shuning uchun uni
   * sanab turish uchun qayta chizish kerak. Video to'xtatilgan bo'lsa soat
   * ham to'xtaydi, ya'ni bekorga chizmaymiz.
   */
  const [, tick] = useState(0)
  useEffect(() => {
    if (!state.isPlaying) return
    const timer = window.setInterval(() => tick((n) => n + 1), CLOCK_TICK)
    return () => window.clearInterval(timer)
  }, [state.isPlaying])

  /* ------------------------------------------------------------- parda */

  /**
   * Bufer imtiyozi tugaganda ekranni qayta chizamiz.
   *
   * Parda `graceUntil` ga qarab chiziladi, ya'ni u o'tganda hech qanday
   * holat o'zgarmaydi — taymer bo'lmasa ekran eski ko'rinishida qolib
   * ketardi.
   */
  useEffect(() => {
    if (!graceUntil) return
    const timer = window.setTimeout(() => setGraceUntil(0), Math.max(0, graceUntil - Date.now()))
    return () => window.clearTimeout(timer)
  }, [graceUntil])

  /* --------------------------------------------- javobsiz qolgan bosish */

  useEffect(() => {
    if (pendingPlay === null) return
    const timer = window.setTimeout(() => setPendingPlay(null), PENDING_TTL)
    return () => window.clearTimeout(timer)
  }, [pendingPlay])

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

  /**
   * Ekranda ko'rinadigan va boshqaruv tayanadigan soniya — uy soatidan.
   *
   * Bu qiymat hamma a'zoda bir xil: u serverdagi `positionSec` va `stateAt`
   * dan hisoblanadi, mijoz esa soat farqini `serverNow()` orqali tuzatib
   * oladi. Pleer yuklanayotganda ham, qayta yuklanganda ham raqam o'z
   * yo'lida davom etadi — ilgari o'sha paytda 0:00 yonib turardi.
   */
  const clock = expectedPosition(state, serverNow())
  const roomPosition = duration > 0 ? Math.min(clock, duration) : clock
  const position = scrub ?? roomPosition
  const ended = duration > 0 && clock >= duration - END_EPSILON

  const covered = !ready || !activated
  /** Tugmalar uchun: hali uyga yetib bormagan bosish ham hisobga olinadi */
  const showPlaying = (pendingPlay ?? state.isPlaying) && !ended
  /**
   * Parda: video haqiqatan ketayotgan lahzadan boshqa paytda pleer yopiladi.
   *
   * Boshqaruvni o'chirib bo'lsa ham, YouTube yuklanish paytida sarlavha
   * bilan brend qatorini, to'xtatilganda esa "More videos" tavsiyalarini
   * ko'rsatishda davom etadi — do'stingiz videoni yoqqanda sizda bir zum
   * begona ramka yonib o'chardi.
   */
  const grace = graceUntil > 0 && playerState === YT_STATE.BUFFERING
  const loading = showPlaying && playerState !== YT_STATE.PLAYING && !grace
  const veiled = !covered && (loading || !showPlaying)

  /** Chiziqning to'lgan qismi (%) — CSS shu qiymatga qarab chiziladi. */
  const progress = duration > 0 ? clamp((position / duration) * 100, 0, 100) : 0

  const activate = () => {
    haptic.impact("medium")
    setActivated(true)
    activatedRef.current = true
    // Teginish paytida chaqiramiz — brauzer ovozli o'ynatishga faqat shunda ruxsat beradi.
    steer(stateRef.current, true)
  }

  /** Boshqarishga ruxsati bormi; bo'lmasa sababini ko'rsatadi. */
  const allowed = (): boolean => {
    if (canControl) return true
    onBlocked()
    return false
  }

  const togglePlay = () => {
    if (covered || !allowed()) return
    haptic.impact("medium")
    // Kino tugagan bo'lsa "o'ynatish" uni boshidan boshlaydi.
    if (ended) commit(true, 0)
    else commit(!showPlaying, roomPosition)
  }

  /**
   * Vaqt chizig'i.
   *
   * Ushlab turilgan qiymat (`scrub`) ekranda ko'rinadi, lekin markazga
   * darhol yuborilmaydi. Qo'yib yuborilgach yuborish bir oz kechiktiriladi
   * va shu oraliqda kelgan yangi qiymat eskisini almashtiradi.
   *
   * Kechiktirish zarur: brauzer `input` hodisasini `pointerup` dan **keyin**
   * ham yuborishi mumkin. Ilgari qo'yib yuborilgan zahoti yuborardik va
   * kechikkan qiymat `scrub` ni qayta yoqib qo'yardi — chiziq o'sha joyda
   * abadiy qotib qolar, markaz esa ketaverardi. Ba'zan esa aksincha:
   * markazga hali yangilanmagan **eski** soniya ketib, video o'sha yerdan
   * davom etardi.
   */
  const sendSeek = () => {
    window.clearTimeout(seekTimerRef.current)
    seekTimerRef.current = window.setTimeout(() => {
      const value = pendingSeekRef.current
      pendingSeekRef.current = null
      setScrub(null)
      if (value === null || !allowed()) return
      haptic.select()
      commit(showPlaying, duration > 0 ? clamp(value, 0, duration) : Math.max(0, value))
    }, SEEK_COMMIT_DELAY)
  }

  /** Chiziq qiymati o'zgardi — surish davomida ham, klaviaturada ham. */
  const onSlide = (value: number) => {
    pendingSeekRef.current = value
    if (draggingRef.current) setScrub(value)
    else sendSeek()
  }

  /**
   * Barmoq yoki sichqoncha chiziqdan tashqarida qo'yib yuborilishi mumkin —
   * o'shanda elementning o'zida `pointerup` bo'lmaydi va chiziq ushlangan
   * qiymatida qotib qolardi. Shuning uchun oyna darajasida kuzatamiz.
   */
  const sendSeekRef = useRef(sendSeek)
  useEffect(() => {
    sendSeekRef.current = sendSeek
  })

  useEffect(() => {
    const stop = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      sendSeekRef.current()
    }

    window.addEventListener("pointerup", stop)
    window.addEventListener("pointercancel", stop)
    return () => {
      window.removeEventListener("pointerup", stop)
      window.removeEventListener("pointercancel", stop)
      window.clearTimeout(seekTimerRef.current)
    }
  }, [])

  const step = (delta: number) => {
    if (!allowed()) return
    const next = position + delta
    haptic.select()
    commit(showPlaying, duration > 0 ? clamp(next, 0, duration) : Math.max(0, next))
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
            {loading ? (
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
                    {ended
                      ? "Kino tugadi — boshidan ko'rish"
                      : state.stateByName
                        ? `${state.stateByName} to'xtatdi`
                        : "To'xtatilgan"}
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
                  {state.isPlaying
                    ? `Kino ${formatVideoTime(roomPosition)} da ketyapti — bosing va qo'shiling`
                    : "Bir marta bosing — shundan keyin video hammada bir vaqtda ketadi"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- o'z boshqaruvimiz --- */}
      <div className="bg-black px-1.5 pt-0.5 pb-1 text-white">
        {/*
          Chiziq alohida qatorda va deyarli chetdan chetgacha cho'ziladi:
          telefonda uni barmoq bilan aniq ushlash kerak. Balandligi 24 px —
          ko'rinadigan chiziq ingichka bo'lsa ham teginish maydoni keng.

          `block` — inline element ostida matn tagligi uchun ~6 px bo'sh joy
          qolardi va u qatorni pastga surardi.
        */}
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.5}
          value={duration > 0 ? Math.min(position, duration) : 0}
          disabled={covered || !duration}
          onPointerDown={() => {
            draggingRef.current = true
          }}
          onChange={(e) => onSlide(Number(e.target.value))}
          aria-label="Video vaqti"
          className="range-track block w-full"
          style={{ "--seek": `${progress}%` } as CSSProperties}
        />

        {/*
          Qator chiziqqa yaqin tortilgan: chiziq elementi 24 px, ko'rinadigan
          qismi esa 5 px — orada bo'sh joy qoladi va u qatorni bekorga
          pastga surardi.

          Uch ustunli grid: yon ustunlar teng (`1fr`), shuning uchun asosiy
          uchlik har doim aniq markazda turadi. Mutlaq joylashuv bilan ham
          markazlash mumkin edi, lekin o'shanda ovoz chizig'i ochilganda
          tugmalar bir-birining ustiga chiqib ketardi — gridda ustunlar
          hech qachon ustma-ust tushmaydi.
        */}
        <div className="-mt-1 grid grid-cols-[1fr_auto_1fr] items-center px-0.5">
          <span className="justify-self-start text-[11px] tabular-nums text-white/70">
            {formatVideoTime(position)}
            {duration > 0 && (
              <span className="text-white/40"> / {formatVideoTime(duration)}</span>
            )}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => step(-10)}
              disabled={covered}
              aria-label="10 soniya orqaga"
              className="tap grid size-9 place-items-center rounded-full text-white/80 disabled:opacity-40"
            >
              <Rewind className="size-5" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              disabled={covered}
              aria-label={showPlaying ? "To'xtatish" : "O'ynatish"}
              className="tap grid size-11 place-items-center rounded-full bg-white/15 disabled:opacity-40"
            >
              {showPlaying ? (
                <Pause className="size-5 fill-white" />
              ) : (
                <Play className="size-5 translate-x-px fill-white" />
              )}
            </button>

            <button
              type="button"
              onClick={() => step(10)}
              disabled={covered}
              aria-label="10 soniya oldinga"
              className="tap grid size-9 place-items-center rounded-full text-white/80 disabled:opacity-40"
            >
              <FastForward className="size-5" />
            </button>
          </div>

          <div className="flex items-center justify-self-end gap-0.5">
            {/*
              Ovoz darajasi telefonda qurilma tugmalari bilan boshqariladi,
              shuning uchun u yerda faqat ovozni o'chirish qoladi. Kengroq
              ekranda chiziq ham ko'rinadi.
            */}
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 100)}
              aria-label={volume > 0 ? "Ovozni o'chirish" : "Ovozni yoqish"}
              className="tap grid size-8 place-items-center rounded-full text-white/80"
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
              data-thin
              className="range-track hidden w-16 sm:block"
              style={{ "--seek": `${volume}%` } as CSSProperties}
            />

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Oynadan chiqish" : "To'liq ekran"}
              className="tap grid size-8 place-items-center rounded-full text-white/80"
            >
              {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>

        {/* Qulf yopiq — mehmon nega boshqara olmasligini bilsin. */}
        {!canControl && (
          <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-white/50">
            <Lock className="size-3" />
            Videoni hozir faqat uy egasi boshqaradi
          </p>
        )}
      </div>
    </div>
  )
}

/** Video hali boshlanmagan (yoki tugagan) — bunda `seekTo` ishonchsiz. */
const isFresh = (playerState: number) =>
  playerState === YT_STATE.UNSTARTED ||
  playerState === YT_STATE.CUED ||
  playerState === YT_STATE.ENDED

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function clampVolume(raw: string | null): number {
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 100
}
