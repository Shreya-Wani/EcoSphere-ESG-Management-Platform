'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Upload, Loader2, Check, Clock, XCircle } from 'lucide-react'
import { ProofButton } from '@/components/shared/proof-viewer'
import { joinChallengeAction, submitChallengeProofAction } from './actions'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

type Row = {
  id: string
  title: string
  description: string | null
  xpReward: number
  difficulty: string
  esgCategory: string
  evidenceRequired: boolean
  deadline: string | Date | null
  myParticipationId: string | null
  myStatus: string | null
  myProofUrl: string | null
}

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'bg-pill-green-bg text-pill-green-fg',
  MEDIUM: 'bg-pill-amber-bg text-pill-amber-fg',
  HARD: 'bg-pill-red-bg text-pill-red-fg',
}

/** Reads an image file to a data URL and submits it as challenge proof. */
function ProofUploader({
  participationId,
  label,
  onError,
  onDone,
}: {
  participationId: string
  label: string
  onError: (m: string) => void
  onDone: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file: File) => {
    onError('')
    if (!file.type.startsWith('image/')) return onError('Please choose an image file.')
    if (file.size > MAX_BYTES) return onError('Image must be under 2 MB.')
    setBusy(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader()
        fr.onload = () => resolve(fr.result as string)
        fr.onerror = () => reject(new Error('Could not read that file'))
        fr.readAsDataURL(file)
      })
      const res = await submitChallengeProofAction(participationId, dataUrl)
      if (!res.success) onError(res.error || 'Upload failed')
      else onDone()
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/30 px-2.5 py-1.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) pick(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

export function MyChallenges({ challenges }: { challenges: Row[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const refresh = () => startTransition(() => router.refresh())

  const join = (id: string) => {
    setBusyId(id)
    setError('')
    startTransition(async () => {
      const res = await joinChallengeAction(id)
      setBusyId(null)
      if (!res.success) setError(res.error || 'Could not join this challenge.')
      else router.refresh()
    })
  }

  if (challenges.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <Trophy className="mx-auto mb-2 h-8 w-8 text-faint" />
        <p className="text-sm font-medium text-ink-2">No active challenges right now</p>
        <p className="text-xs text-faint">New challenges appear here as soon as they go live.</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg border border-pill-red-fg/30 bg-pill-red-bg px-3 py-2 text-sm text-pill-red-fg">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {challenges.map((c) => {
          const status = c.myStatus
          const joined = !!c.myParticipationId
          const busy = busyId === c.id || pending
          return (
            <div
              key={c.id}
              className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(31,41,55,.04)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  <Trophy className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      DIFFICULTY_STYLE[c.difficulty] ?? 'bg-surface-2 text-ink-2'
                    }`}
                  >
                    {c.difficulty}
                  </span>
                  <span className="text-xs font-semibold text-pill-amber-fg">⭐ {c.xpReward} XP</span>
                </div>
              </div>

              <h3 className="mt-3 font-semibold text-ink">{c.title}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-2">
                {c.description || 'No description provided.'}
              </p>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line-soft pt-3">
                {/* Left: current state */}
                <div className="min-w-0 text-xs text-ink-2">
                  {status === 'COMPLETED' && (
                    <span className="inline-flex items-center gap-1 font-semibold text-pill-green-fg">
                      <Check className="h-3.5 w-3.5" /> Completed
                    </span>
                  )}
                  {status === 'PROOF_SUBMITTED' && (
                    <span className="inline-flex items-center gap-1 font-medium text-pill-amber-fg">
                      <Clock className="h-3.5 w-3.5" /> Pending review
                    </span>
                  )}
                  {status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 font-medium text-pill-red-fg">
                      <XCircle className="h-3.5 w-3.5" /> Rejected — resubmit
                    </span>
                  )}
                  {(status === 'JOINED' || !joined) && (
                    <span className="text-faint">{c.evidenceRequired ? 'Proof required' : 'No proof needed'}</span>
                  )}
                </div>

                {/* Right: action */}
                <div className="flex shrink-0 items-center gap-2">
                  {c.myProofUrl && <ProofButton url={c.myProofUrl} label="View" />}
                  {!joined && (
                    <button
                      onClick={() => join(c.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Join
                    </button>
                  )}
                  {joined && (status === 'JOINED' || status === 'REJECTED') && (
                    <ProofUploader
                      participationId={c.myParticipationId!}
                      label={c.myProofUrl ? 'Replace' : 'Upload proof'}
                      onError={setError}
                      onDone={refresh}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
