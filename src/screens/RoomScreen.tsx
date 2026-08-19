import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
  DoorOpen,
  Link2,
  Loader2,
  Lock,
  LockOpen,
  Settings2,
  UserRoundCheck,
} from "lucide-react"
import { toast } from "sonner"

import { JoinRequests, MemberList, MembersStrip } from "@/components/room/RoomMembers"
import { RoomChat } from "@/components/room/RoomChat"
import { WatchPlayer } from "@/components/room/WatchPlayer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, useMe } from "@/lib/api"
import { roomApi, useRoomSync } from "@/lib/rooms"
import { haptic, setBackButton, shareLink } from "@/lib/telegram"
import type { RoomMemberAction, RoomMemberView } from "@shared/types"

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

  const { sync, messages, error, loading, serverNow, refresh, applyState, appendMessage } =
    useRoomSync(code)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [joining, setJoining] = useState(false)
  const [sending, setSending] = useState(false)
  /**
   * Pleer xatosi qaysi videoga tegishli ekani ham saqlanadi — kino
   * almashtirilganda eski xato ekranda qolib ketmasin.
   */
  const [videoError, setVideoError] = useState<{ videoId: string; message: string } | null>(null)

  useEffect(() => setBackButton(() => navigate("/rooms")), [navigate])

  /* ------------------------------------------------------------ boshqaruv */

  /**
   * Pleer harakatini serverga yuboradi.
   *
   * Bir vaqtda ikkita so'rov ketmasin: yo'lda so'rov bo'lsa, oxirgi holat
   * navbatda kutadi va bittasi tugagach yuboriladi. Aks holda vaqt chizig'ini
   * surganda o'nlab so'rov ketardi.
   */
  const inflightRef = useRef(false)
  const queuedRef = useRef<{ isPlaying: boolean; positionSec: number } | null>(null)

  const pushState = useCallback(
    async (isPlaying: boolean, positionSec: number) => {
      queuedRef.current = { isPlaying, positionSec }
      if (inflightRef.current) return

      inflightRef.current = true
      try {
        while (queuedRef.current) {
          const next = queuedRef.current
          queuedRef.current = null
          try {
            const { state } = await api.setState(next.isPlaying, next.positionSec)
            applyState(state)
          } catch (err) {
            if (err instanceof ApiError && err.status === 403) toast.info(err.message)
            else toast.error("Harakat yuborilmadi — aloqani tekshiring.")
            refresh()
          }
        }
      } finally {
        inflightRef.current = false
      }
    },
    [api, applyState, refresh],
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
      await api.join()
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
  const meId = me.data?.id ?? 0
  const canControl = !state.controlLocked || sync.isOwner

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col">
      <header className="safe-top flex items-center gap-2 px-3 pb-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm leading-tight font-semibold">{sync.title}</h1>
          <p className="truncate text-[11px] text-muted-foreground">
            {sync.isOwner ? "Sizning uyingiz" : `${sync.ownerName}ning uyi`} ·{" "}
            {members.filter((m) => m.online).length}/{members.length} onlayn
          </p>
        </div>

        <Button size="icon-sm" variant="ghost" onClick={invite} aria-label="Do'stni taklif qilish">
          <Link2 className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setSettingsOpen(true)}
          aria-label="Sozlamalar"
        >
          <Settings2 className="size-4" />
        </Button>
      </header>

      <div className="px-3">
        <WatchPlayer
          state={state}
          serverNow={serverNow}
          canControl={canControl}
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
          <div className="mt-2">
            <JoinRequests pending={pending} busyId={busyId} onDecide={decide} />
          </div>
        )}

        <div className="mt-2.5">
          <MembersStrip members={members} meId={meId} />
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col px-3 pb-3">
        <RoomChat messages={messages} meId={meId} sending={sending} onSend={send} />
      </div>

      <RoomSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        code={code}
        inviteUrl={sync.inviteUrl ?? ""}
        isOwner={sync.isOwner}
        locked={state.controlLocked}
        members={members}
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
  meId: number
  busyId: number | null
  onDecide: (userId: number, action: RoomMemberAction) => void
  onInvite: () => void
  onToggleLock: (locked: boolean) => void
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
  meId,
  busyId,
  onDecide,
  onInvite,
  onToggleLock,
  onChangeVideo,
  onLeave,
}: RoomSettingsProps) {
  const [url, setUrl] = useState("")

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
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onToggleLock(!locked)}
            >
              {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
              {locked ? "Faqat men boshqaraman" : "Hamma boshqara oladi"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {locked
                ? "Mehmonlar videoni to'xtata olmaydi. Bosib o'zgartiring."
                : "Har bir a'zo videoni to'xtatishi va surishi mumkin."}
            </p>
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

        <Button variant="destructive" className="w-full" onClick={onLeave}>
          <DoorOpen className="size-4" />
          {isOwner ? "Uyni yopish" : "Uydan chiqish"}
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
