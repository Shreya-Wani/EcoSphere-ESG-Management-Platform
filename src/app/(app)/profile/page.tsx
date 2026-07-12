'use client'

import { useSession, signOut } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Mail, Building2, Trophy, Sparkles, Star } from 'lucide-react'
import { getLevel } from '@/lib/levels'
import { initialsOf } from '@/lib/utils'
import { apiGet } from '@/lib/api'
import type { DashboardSummary } from '@/server/services/dashboard/summary'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  ESG_MANAGER: 'ESG Manager',
  HR_MANAGER: 'HR Manager',
  AUDITOR: 'Auditor',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  EMPLOYEE: 'Employee',
}

// Level thresholds mirror the frozen LEVELS constant, used only to size the bar.
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000]

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-faint">{sub}</p>}
    </div>
  )
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string; totalXp?: number }
    | undefined

  const { data } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiGet<DashboardSummary>('/api/dashboard/summary'),
  })
  const me = data?.me

  const totalXp = me?.totalXp ?? user?.totalXp ?? 0
  const level = getLevel(totalXp)
  const nextThreshold = LEVEL_THRESHOLDS[level.level] // undefined at max level
  const span = Math.max(1, (nextThreshold ?? level.min) - level.min)
  const progressPct = nextThreshold
    ? Math.min(100, Math.round(((totalXp - level.min) / span) * 100))
    : 100

  const role = user?.role ?? 'EMPLOYEE'
  const badges = me?.badges ?? []

  return (
    <div className="mx-auto max-w-3xl animate-es-fade">
      <h1 className="mb-1 text-[22px] font-semibold text-ink">Profile</h1>
      <p className="mb-6 text-[12.5px] text-faint">Your account, level progress, and earned badges.</p>

      {/* Identity card */}
      <div className="mb-6 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-white">
              {initialsOf(user?.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-ink">{user?.name ?? 'User'}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-faint" /> {user?.email ?? '—'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-tint-green px-2.5 py-0.5 text-[11.5px] font-semibold text-pill-green-fg">
                  {ROLE_LABEL[role] ?? role}
                </span>
                {me?.deptName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-[11.5px] font-medium text-ink-2">
                    <Building2 className="h-3.5 w-3.5" /> {me.deptName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="inline-flex items-center gap-2 self-start rounded-[7px] border border-line px-3 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-pill-red-bg hover:text-pill-red-fg"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Level" value={level.level} sub={level.name} />
        <StatTile label="Total XP" value={totalXp.toLocaleString()} sub="lifetime" />
        <StatTile label="XP This Month" value={(me?.xpThisMonth ?? 0).toLocaleString()} />
        <StatTile
          label="Department Rank"
          value={me?.deptRank ? `#${me.deptRank}` : '—'}
          sub={me?.deptName ?? undefined}
        />
      </div>

      {/* Level progress */}
      <div className="mb-6 rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          <h3 className="text-sm font-semibold text-ink">Level progress</h3>
        </div>
        <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
          <span className="font-semibold text-ink">
            Level {level.level} · {level.name}
          </span>
          <span className="tabular-nums text-faint">
            {nextThreshold
              ? `${totalXp.toLocaleString()} / ${nextThreshold.toLocaleString()} XP to Level ${level.level + 1}`
              : `${totalXp.toLocaleString()} XP · max level`}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-track">
          <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand-primary" />
          <h3 className="text-sm font-semibold text-ink">Badges earned</h3>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
            {badges.length}
          </span>
        </div>
        {badges.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Star className="h-8 w-8 text-faint" />
            <p className="text-sm font-medium text-ink-2">No badges yet</p>
            <p className="text-xs text-faint">
              Complete challenges and CSR activities to earn your first badge.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((b, i) => (
              <div
                key={`${b.name}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-line-soft bg-canvas px-3 py-2.5"
              >
                <span className="text-2xl leading-none">{b.icon}</span>
                <span className="truncate text-[13px] font-medium text-ink">{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
