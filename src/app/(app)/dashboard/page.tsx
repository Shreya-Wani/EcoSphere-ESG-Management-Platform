'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { RefreshCw, Leaf, Trophy, FileBarChart } from 'lucide-react'
import { KpiTile } from '@/components/shared/kpi-tile'
import { ChartCard } from '@/components/shared/chart-card'
import type { DashboardSummary } from '@/server/services/dashboard/summary'

async function fetchSummary(): Promise<DashboardSummary> {
  const res = await fetch('/api/dashboard/summary')
  if (!res.ok) throw new Error('Failed to load dashboard')
  return res.json()
}

const ACTIVITY_META: Record<string, { icon: string; tag: string; color: string }> = {
  CARBON: { icon: '🌍', tag: 'Carbon', color: 'text-pill-green-fg bg-pill-green-bg' },
  PARTICIPATION: { icon: '🤝', tag: 'CSR', color: 'text-pill-blue-fg bg-pill-blue-bg' },
  COMPLIANCE: { icon: '⚠️', tag: 'Compliance', color: 'text-pill-amber-fg bg-pill-amber-bg' },
  BADGE: { icon: '🏅', tag: 'Badge', color: 'text-pill-green-fg bg-tint-green' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const isAdmin = role === 'ADMIN'
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchSummary,
  })

  const recalc = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/scores/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Recalculate failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard-summary'] }),
  })

  if (isLoading) {
    return <div className="text-faint">Loading dashboard…</div>
  }
  if (isError || !data) {
    return <div className="text-pill-red-fg">Could not load dashboard data.</div>
  }

  return (
    <div className="animate-es-fade flex flex-col gap-[22px]">
      {/* Header + admin recalc */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[20px] font-semibold text-ink">Dashboard</h1>
          <p className="text-[12.5px] text-ink-2">Company ESG overview · period {data.period}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => recalc.mutate()}
            disabled={recalc.isPending}
            className="flex h-[34px] items-center gap-2 rounded-[7px] bg-brand-primary px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-primary-dark disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${recalc.isPending ? 'animate-spin' : ''}`} />
            {recalc.isPending ? 'Recalculating…' : 'Recalculate Scores'}
          </button>
        )}
      </div>

      {/* SIX KPIs — company + personal in one row */}
      <div className="flex flex-col gap-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-faint">
          Company &amp; Personal KPIs
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KpiTile label="Total CO₂e (kg)" value={data.totalCo2e.toLocaleString()} />
          <KpiTile label="ESG Score" value={data.overall} />
          <KpiTile label="Compliance Alerts" value={data.complianceAlerts} />
          <KpiTile label="Your XP this month" value={data.me.xpThisMonth.toLocaleString()} />
          <KpiTile label="Your Dept Rank" value={data.me.deptRank ? `#${data.me.deptRank}` : '—'} />
          <KpiTile label="Participation" value={`${data.participationRate}%`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-3">
        {/* Emissions vs Target */}
        <div className="lg:col-span-2">
          <ChartCard title="Emissions vs Target (last 6 months)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.emissionsVsTarget}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
                <XAxis dataKey="month" fontSize={12} stroke="var(--muted)" />
                <YAxis fontSize={12} stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="emissions" name="Emissions" fill="#4F7A5A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="var(--accent-border)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Department ESG Ranking */}
        <div className="flex flex-col rounded-[10px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
          <h3 className="pb-2.5 text-[14px] font-semibold text-ink">Department ESG Ranking</h3>
          <ul>
            {data.deptRanking.map((d) => (
              <li
                key={d.code}
                className="flex items-center gap-2.5 border-t border-line-soft py-[9px] first:border-t-0"
              >
                <span className="w-[22px] text-[12px] font-semibold tabular-nums text-faint">
                  {d.rank}
                </span>
                <span className="flex-1 text-[13px] font-medium text-ink">{d.name}</span>
                <span className="rounded-full bg-tint-green px-[9px] py-0.5 text-[11.5px] font-semibold tabular-nums text-pill-green-fg">
                  {d.total}
                </span>
                {d.delta !== 0 && (
                  <span
                    className={`text-[11px] font-semibold ${
                      d.delta > 0 ? 'text-pill-green-fg' : 'text-pill-red-fg'
                    }`}
                  >
                    {d.delta > 0 ? '▲' : '▼'} {Math.abs(d.delta)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="flex flex-col rounded-[10px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(31,41,55,.04)] lg:col-span-2">
          <h3 className="pb-2.5 text-[14px] font-semibold text-ink">Recent Activity</h3>
          <ul>
            {data.recentActivity.map((a, i) => {
              const meta = ACTIVITY_META[a.type]
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 border-t border-line-soft py-2.5 first:border-t-0"
                >
                  <span className="text-[15px] leading-none">{meta.icon}</span>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}>
                    {meta.tag}
                  </span>
                  <span className="flex-1 truncate text-[13px] text-ink">{a.title}</span>
                  <span className="whitespace-nowrap text-[11.5px] text-faint">{timeAgo(a.when)}</span>
                </li>
              )
            })}
            {data.recentActivity.length === 0 && (
              <li className="py-3 text-[13px] text-faint">No recent activity.</li>
            )}
          </ul>
        </div>

        {/* Active challenge + Badges + Quick actions */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-[10px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
            <h3 className="text-[14px] font-semibold text-ink">Your Progress</h3>
            <p className="text-[12.5px] text-ink-2">
              Level {data.me.level} · {data.me.levelName} · {data.me.totalXp.toLocaleString()} XP
            </p>
            {data.me.activeChallenge ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-[13.5px] font-semibold text-ink">{data.me.activeChallenge.title}</p>
                <div className="h-[7px] overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-brand-primary"
                    style={{ width: `${data.me.activeChallenge.progress}%` }}
                  />
                </div>
                <p className="text-[11.5px] tabular-nums text-ink-2">
                  {data.me.activeChallenge.progress}% complete
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-faint">No active challenge.</p>
            )}
            {data.me.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.me.badges.map((b) => (
                  <span key={b.name} title={b.name} className="text-xl" aria-label={b.name}>
                    {b.icon}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-[10px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(31,41,55,.04)]">
            <h3 className="text-[14px] font-semibold text-ink">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <QuickAction href="/carbon-transactions" icon={<Leaf className="h-4 w-4" />} label="Log Carbon Entry" />
              <QuickAction href="/challenges" icon={<Trophy className="h-4 w-4" />} label="Join a Challenge" />
              <QuickAction href="/reports/summary" icon={<FileBarChart className="h-4 w-4" />} label="View ESG Summary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center gap-2.5 rounded-[9px] border border-line bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-hover"
    >
      <span className="text-brand-primary">{icon}</span>
      {label}
    </Link>
  )
}
