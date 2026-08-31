import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
  DoorOpen,
  Link2,
  Loader2,
  Lock,
  LockOpen,
  EyeOff,
  Globe,
  Settings2,
  ShieldBan,
  UserRoundCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  BlockedList,
  JoinRequests,
  MemberList,
  WatchingBar,
} from "@/components/room/RoomMembers"
import { RoomChat } from "@/components/room/RoomChat"
import { VoiceBar } from "@/components/room/VoiceBar"
import { WatchPlayer } from "@/components/room/WatchPlayer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, useMe } from "@/lib/api"
import { cn } from "@/lib/utils"
import { roomApi, useRoomSync } from "@/lib/rooms"
import { useVoiceChat } from "@/lib/voice"
import { haptic, setBackButton, shareLink } from "@/lib/telegram"
import type { RoomMemberAction, RoomMemberView, RoomVisibility } from "@shared/types"

/**
 * Kino uyi ichi.
 *
 * Ekran uch qismdan iborat: pleer (tepada), boshqaruv qatori va chat
 * (qolgan joyni to'ldiradi). Barcha o'zgarishlar `useRoomSync` orqali
 * keladi — u serverni qisqa oraliqda so'rab turadi.
 */
export function RoomScreen() {
  const { code = "" } = useParams()
  const navigate = useNavigate()
  const me = useMe()
  const api = useMemo(() => roomApi(code), [code])

  const {
    sync,
    messages,
    signals,
    error,
    loading,
    serverNow,
    refresh,
    predictState,
    applyState,
    abortAction,
    appendMessage,
    applyAccess,
    setVoice,
  } = useRoomSync(code)

  const meId = me.data?.id ?? 0

  /**
   * Ovozli suhbat.
   *
   * Kimga ulanish kerakligini uy holati aytadi: mikrofoni yoqilgan har bir
   * a'zo bilan to'g'ridan-to'g'ri ulanish quriladi. Signallar `sync`
   * javobida keladi va o'sha yo'l bilan qaytadi — ovozli suhbat uchun
   * alohida server ham, doimiy ulanish ham kerak emas.
   */
  const voiceMembers = useMemo(
    () =>
      (sync?.members ?? [])
        .filter((member) => member.userId !== meId && member.voice)
        .map((member) => member.userId),
    [sync?.members, meId],
  )

  const voice = useVoiceChat({
    code,
    meId,
    voiceMembers,
    signals,
    sendSignal: api.signal,
    setVoice,
    refresh,
  })

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [joining, setJoining] = useState(false)
  const [sending, setSending] = useState(false)
  /**
   * Pleer xatosi qaysi videoga tegishli ekani ham saqlanadi — kino
   * almashtirilganda eski xato ekranda qolib ketmasin.
   */
  const [videoError, setVideoError] = useState<{ videoId: string; message: string } | null>(null)


  /**
   * Boshqa uyga o'tilganda ekran holati qolib ketmasin.
   *
   * Marshrut naqshi bir xil (`/room/:code`), shuning uchun React komponentni
   * qayta yaratmaydi — faqat `code` o'zgaradi. Ochiq turgan sozlamalar oynasi
   * yangi uyga o'tib ketardi, u yerdagi «rostdan yopilsinmi?» tasdig'i esa
   * allaqachon bosilgan holda qolardi: keyingi bosish butunlay boshqa uyni
   * yopib yuborishi mumkin edi.
   *
   * Tozalash effektda emas, render paytida bajariladi — effekt bir kadr
   * kechikadi va o'sha kadrda oyna hali eski holatda ko'rinib turardi.
   */
  const [openCode, setOpenCode] = useState(code)
  if (openCode !== code) {
    setOpenCode(code)
    setSettingsOpen(false)
    setVideoError(null)
    setBusyId(null)
  }
  useEffect(() => setBackButton(() => navigate("/rooms")), [navigate])

  /* ------------------------------------------------------------ boshqaruv */

  /**
   * Pleer harakatini markazga yuboradi.
   *
   * Uch qadamdan iborat:
   *
   * 1. Kutilayotgan holat ekranga darhol qo'yiladi (`predictState`) va shu
   *    lahzadan boshlab yo'ldagi `sync` javoblari yopiladi — ular tugma
   *    bosilishidan oldin chiqqan va eskirgan soniyani olib qaytadi.
   * 2. So'rov ketadi. Bir vaqtda ikkitasi ketmaydi: yo'lda so'rov bo'lsa,
   *    oxirgi holat navbatda kutadi. Aks holda chiziqni surganda o'nlab
   *    so'rov ketardi.
   * 3. Markaz javobi kelgach sinxronlash qayta ochiladi. Javob eskirgan
   *    bo'lsa (undan keyin yana bosilgan) `applyState` uni o'zi tashlaydi.
   */
  const inflightRef = useRef(false)
  const queuedRef = useRef<{ isPlaying: boolean; positionSec: number; seq: number } | null>(null)

  const meName = [me.data?.firstName, me.data?.lastName].filter(Boolean).join(" ").trim()

  const pushState = useCallback(
    async (isPlaying: boolean, positionSec: number) => {
      const seq = predictState({
        isPlaying,
        positionSec,
        stateBy: me.data?.id ?? 0,
        stateByName: meName,
      })

      queuedRef.current = { isPlaying, positionSec, seq }
      if (inflightRef.current) return

      inflightRef.current = true
      try {
        while (queuedRef.current) {
          const next = queuedRef.current
          queuedRef.current = null
          try {
            const { state } = await api.setState(next.isPlaying, next.positionSec)
            applyState(state, next.seq)
          } catch (err) {
            abortAction(next.seq)
            if (err instanceof ApiError && err.status === 403) toast.info(err.message)
            else toast.error("Harakat yuborilmadi — aloqani tekshiring.")
            refresh()
          }
        }
      } finally {
        inflightRef.current = false
      }
    },
    [api, applyState, abortAction, predictState, refresh, me.data?.id, meName],
  )

  const decide = async (userId: number, action: RoomMemberAction) => {
    setBusyId(userId)
    try {
      await api.member(userId, action)
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Bajarilmadi.")
    } finally {
      setBusyId(null)
    }
  }

  const send = async (text: string) => {
    setSending(true)
    try {
      const { message } = await api.sendMessage(text)
      appendMessage(message)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Xabar yuborilmadi.")
    } finally {
      setSending(false)
    }
  }

  const join = async () => {
    setJoining(true)
    haptic.impact("medium")
    try {
      /*
        Javobni darhol qo'llaymiz. Ilgari ekran keyingi `sync` ni kutardi
        (uch soniyagacha) va o'sha vaqt ichida tugma o'zgarmasdi — odam
        so'rov ketmadi deb o'ylab yana bosardi.
      */
      const { access } = await api.join()
      applyAccess(access)
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "So'rov yuborilmadi.")
    } finally {
      setJoining(false)
    }
  }

  const invite = async () => {
    if (!sync?.inviteUrl) return
    const result = await shareLink(
      sync.inviteUrl,
      `Birga kino ko'ramizmi? «${sync.title}»`,
    ).catch(() => null)

    if (result === "copied") toast.success("Havola nusxalandi")
    else if (result === null) toast.error("Havolani ulashib bo'lmadi")
  }

  /* --------------------------------------------------------------- holatlar */

  if (loading && !sync) return <RoomSkeleton />

  if (error && !sync) {
    const message =
      error.status === 404
        ? "Bunday uy topilmadi. Kod noto'g'ri yoki uy yopilgan."
        : "Uyni ochib bo'lmadi. Internetni tekshiring."
    return <Notice title="Uy ochilmadi" text={message} onBack={() => navigate("/rooms")} />
  }

  if (!sync) return <RoomSkeleton />

  if (sync.closed) {
    return (
      <Notice
        title="Uy yopilgan"
        text={`${sync.ownerName} bu uyni yopdi.`}
        onBack={() => navigate("/rooms")}
      />
    )
  }

  if (sync.access === "blocked") {
    return (
      <Notice
        title="Ruxsat berilmadi"
        text={`${sync.ownerName} sizni bu uyga qo'shmadi.`}
        onBack={() => navigate("/rooms")}
      />
    )
  }

  if (sync.access === "none" || sync.access === "pending") {
    return (
      <JoinGate
        title={sync.title}
        ownerName={sync.ownerName}
        pending={sync.access === "pending"}
        busy={joining}
        onJoin={join}
        onBack={() => navigate("/rooms")}
      />
    )
  }

  /* --------------------------------------------------------------- uy ichi */

  const state = sync.state!
  const members = sync.members ?? []
  const pending = sync.pending ?? []
  const canControl = !state.controlLocked || sync.isOwner

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden">
      {/*
        Sarlavha ixcham: ekranning asosiy qismi videoga va suhbatga qolishi
        kerak. Taklif qilish belgichasi bu yerdan olib tashlandi — u endi
        pleer ostida, matni bilan turadi va uyda yolg'iz odam uni albatta
        ko'radi.
      */}
      <header className="safe-top flex items-center gap-2 px-3 pb-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm leading-tight font-semibold">{sync.title}</h1>
          <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <span className="truncate">
              {sync.isOwner ? "Sizning uyingiz" : `${sync.ownerName}ning uyi`}
            </span>
            {/* Uy maxfiyligi ko'rinib tursin — egasi buni esdan chiqarmasin. */}
            {sync.visibility === "private" && (
              <span className="flex shrink-0 items-center gap-0.5 text-muted-foreground/80">
                <EyeOff className="size-3" />
                maxfiy
              </span>
            )}
          </p>
        </div>

        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setSettingsOpen(true)}
          aria-label="Uy sozlamalari"
        >
          <Settings2 className="size-4" />
        </Button>
      </header>

      <div className="px-3">
        <WatchPlayer
          state={state}
          serverNow={serverNow}
          meId={meId}
          isOwner={sync.isOwner}
          canControl={canControl}
          /* Kimdir gapirganda kino ovozi pasayadi — baqirishga hojat qolmasin. */
          duck={voice.someoneSpeaking}
          onAction={pushState}
          onBlocked={() => toast.info("Hozir videoni faqat uy egasi boshqaradi.")}
          onError={(message) => setVideoError({ videoId: state.videoId, message })}
        />

        {videoError?.videoId === state.videoId && (
          <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {videoError.message}
          </p>
        )}

        {pending.length > 0 && (
          <div className="mt-2.5">
            <JoinRequests pending={pending} busyId={busyId} onDecide={decide} />
          </div>
        )}

        <div className="mt-2.5">
          <WatchingBar members={members} meId={meId} onInvite={invite} />
        </div>

        {/*
          Ovozli suhbat pleer bilan chat orasida turadi: kino ko'rayotganda
          yozib o'tirish noqulay, gapirish esa tabiiy.
        */}
        <div className="mt-2.5">
          <VoiceBar voice={voice} members={members} meId={meId} />
        </div>
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 flex-col px-3 pb-3">
        <RoomChat messages={messages} meId={meId} sending={sending} onSend={send} />
      </div>

      <RoomSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        code={code}
        inviteUrl={sync.inviteUrl ?? ""}
        isOwner={sync.isOwner}
        locked={state.controlLocked}
        visibility={sync.visibility}
        members={members}
        blocked={sync.blocked ?? []}
        meId={meId}
        busyId={busyId}
        onDecide={decide}
        onInvite={invite}
        onToggleLock={async (locked) => {
          try {
            await api.setLock(locked)
            refresh()
          } catch {
            toast.error("O'zgartirib bo'lmadi.")
          }
        }}
        onToggleVisibility={async (next) => {
          try {
            await api.setVisibility(next)
            refresh()
            toast.success(
              next === "private"
                ? "Uy maxfiy — endi faqat havola orqali kiriladi"
                : "Uy ochiq ro'yxatga qo'shildi",
            )
          } catch {
            toast.error("O'zgartirib bo'lmadi.")
          }
        }}
        onChangeVideo={async (url) => {
          try {
            const { state: next } = await api.changeVideo(url)
            applyState(next)
            setSettingsOpen(false)
            toast.success("Yangi kino qo'yildi")
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Kino almashtirilmadi.")
          }
        }}
        onLeave={async () => {
          try {
            await api.leave()
          } finally {
            navigate("/rooms")
          }
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------- sozlamalar */

interface RoomSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: string
  inviteUrl: string
  isOwner: boolean
  locked: boolean
  members: RoomMemberView[]
  blocked: RoomMemberView[]
  meId: number
  busyId: number | null
  onDecide: (userId: number, action: RoomMemberAction) => void
  onInvite: () => void
  visibility: RoomVisibility
  onToggleLock: (locked: boolean) => void
  onToggleVisibility: (visibility: RoomVisibility) => void
  onChangeVideo: (url: string) => void
  onLeave: () => void
}

function RoomSettings({
  open,
  onOpenChange,
  code,
  inviteUrl,
  isOwner,
  locked,
  members,
  blocked,
  meId,
  busyId,
  onDecide,
  onInvite,
  visibility,
  onToggleLock,
  onToggleVisibility,
  onChangeVideo,
  onLeave,
}: RoomSettingsProps) {
  const [url, setUrl] = useState("")
  /** Uyni yopish ikki qadam: birinchi bosishda tasdiq so'raladi */
  const [confirmLeave, setConfirmLeave] = useState(false)
  const isPublic = visibility === "public"

  // Oyna yopilib ochilganda tasdiq holati qolib ketmasin.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    setWasOpen(open)
    setConfirmLeave(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `grid-cols-[minmax(0,1fr)]` — grid ustuni sukut bo'yicha kontentdan
          kichraya olmaydi, shu sababli uzun taklif havolasi oynani kengaytirib,
          tugmalarni chetga chiqarib yuborardi. */}
      <DialogContent className="max-h-[85dvh] grid-cols-[minmax(0,1fr)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uy sozlamalari</DialogTitle>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">Taklif</h3>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2.5 py-2 text-xs">
              {inviteUrl || code}
            </code>
            <Button size="sm" variant="secondary" className="shrink-0" onClick={onInvite}>
              <Link2 className="size-4" />
              Yuborish
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Kod: <b className="tracking-widest">{code}</b> — do'stingiz uni «Kino» bo'limida
            qo'lda ham kiritishi mumkin.
          </p>
        </section>

        {isOwner && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground">Boshqaruv</h3>
            {/*
              Ilgari bu oddiy tugma edi va uning ustidagi yozuv joriy holatni
              bildiradimi yoki bosilganda nima bo'lishini — noaniq edi. Endi
              o'chirgich: o'ng tarafdagi holat ko'rinib turadi.
            */}
            <button
              type="button"
              onClick={() => onToggleLock(!locked)}
              className="tap flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left"
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  locked ? "bg-stress-soft text-stress" : "bg-success-soft text-success",
                )}
              >
                {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {locked ? "Faqat men boshqaraman" : "Hamma boshqara oladi"}
                </span>
                <span className="block text-[11px] leading-snug text-muted-foreground">
                  {locked
                    ? "Mehmonlar videoni to'xtata olmaydi"
                    : "Har bir a'zo to'xtatishi va surishi mumkin"}
                </span>
              </span>

              <span
                className={cn(
                  "h-6 w-10 shrink-0 rounded-full p-0.5 transition-colors",
                  locked ? "bg-muted" : "bg-primary",
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    "block size-5 rounded-full bg-white shadow-sm transition-transform",
                    !locked && "translate-x-4",
                  )}
                />
              </span>
            </button>
          </section>
        )}

        {isOwner && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground">Kim ko'radi</h3>
            <button
              type="button"
              onClick={() => onToggleVisibility(isPublic ? "private" : "public")}
              className="tap flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left"
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  isPublic ? "bg-success-soft text-success" : "bg-secondary text-foreground",
                )}
              >
                {isPublic ? <Globe className="size-4" /> : <EyeOff className="size-4" />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {isPublic ? "Ochiq uylar ro'yxatida" : "Maxfiy uy"}
                </span>
                <span className="block text-[11px] leading-snug text-muted-foreground">
                  {isPublic
                    ? "Uni hamma ko'radi va so'rov yubora oladi"
                    : "Faqat havolani olgan odam so'rov yubora oladi"}
                </span>
              </span>

              <span
                className={cn(
                  "h-6 w-10 shrink-0 rounded-full p-0.5 transition-colors",
                  isPublic ? "bg-primary" : "bg-muted",
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    "block size-5 rounded-full bg-white shadow-sm transition-transform",
                    isPublic && "translate-x-4",
                  )}
                />
              </span>
            </button>
          </section>
        )}

        {isOwner && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground">Kinoni almashtirish</h3>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Yangi YouTube havolasi"
                inputMode="url"
              />
              <Button
                variant="secondary"
                className="shrink-0"
                disabled={!url.trim()}
                onClick={() => {
                  onChangeVideo(url.trim())
                  setUrl("")
                }}
              >
                Qo'yish
              </Button>
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <UserRoundCheck className="size-3.5" />
            Ishtirokchilar
          </h3>
          <MemberList
            members={members}
            meId={meId}
            isOwner={isOwner}
            busyId={busyId}
            onDecide={onDecide}
          />
        </section>

        {isOwner && blocked.length > 0 && (
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ShieldBan className="size-3.5" />
              Bloklanganlar
            </h3>
            <BlockedList blocked={blocked} busyId={busyId} onDecide={onDecide} />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Blokdan chiqarilgan odam uyga o'zi qaytmaydi — u yana kirish
              so'rovini yuborishi kerak.
            </p>
          </section>
        )}

        {/*
          Uyni yopish qaytarilmaydi: hamma chiqib ketadi va havola o'lik
          bo'ladi. Shuning uchun ikki qadam — tasodifan bosilmasin.
        */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => (confirmLeave ? onLeave() : setConfirmLeave(true))}
        >
          <DoorOpen className="size-4" />
          {confirmLeave
            ? isOwner
              ? "Rostdan yopilsinmi? Bosing"
              : "Rostdan chiqasizmi? Bosing"
            : isOwner
              ? "Uyni yopish"
              : "Uydan chiqish"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------ oraliq holatlar */

interface JoinGateProps {
  title: string
  ownerName: string
  pending: boolean
  busy: boolean
  onJoin: () => void
  onBack: () => void
}

/** Hali a'zo bo'lmagan odam ko'radigan ekran. */
function JoinGate({ title, ownerName, pending, busy, onJoin, onBack }: JoinGateProps) {
  return (
    <div className="safe-top mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5">
      <Card className="gap-4 p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-2xl">
          🍿
        </div>

        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ownerName}ning uyi</p>
        </div>

        {pending ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-stress">
              <Loader2 className="size-4 animate-spin" />
              So'rov yuborildi
            </div>
            <p className="text-xs text-muted-foreground">
              {ownerName} tasdiqlashi bilan kino avtomatik ochiladi. Ilovani yopmasangiz ham
              bo'ladi.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Uyga kirish uchun egasining ruxsati kerak. Tugmani bossangiz unga so'rov boradi.
            </p>
            <Button size="lg" onClick={onJoin} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Kirish so'rovini yuborish
            </Button>
          </>
        )}

        <Button variant="ghost" size="sm" onClick={onBack}>
          Orqaga
        </Button>
      </Card>
    </div>
  )
}

function Notice({ title, text, onBack }: { title: string; text: string; onBack: () => void }) {
  return (
    <div className="safe-top mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5">
      <Card className="gap-3 p-6 text-center">
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{text}</p>
        <Button variant="secondary" onClick={onBack}>
          Uylarga qaytish
        </Button>
      </Card>
    </div>
  )
}

function RoomSkeleton() {
  return (
    <div className="safe-top mx-auto w-full max-w-lg space-y-3 px-3 pt-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-8 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  )
}
