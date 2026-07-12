'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Session } from 'next-auth'
import {
  LayoutDashboard,
  Leaf,
  BarChart3,
  Users,
  FileText,
  CheckSquare,
  ShieldAlert,
  Trophy,
  LineChart,
  Settings,
  Gift,
  Medal,
  X,
} from 'lucide-react'
import { getLevel } from '@/lib/levels'

export interface NavCounts {
  environmental: number
  social: number
  governance: number
  gamification: number
}

const navGroups = [
  {
    title: 'Navigation',
    countKey: null as keyof NavCounts | null,
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Environmental',
    countKey: 'environmental' as const,
    items: [
      { label: 'Emission Factors', href: '/emission-factors', icon: Leaf },
      { label: 'Product ESG Profiles', href: '/product-profiles', icon: BarChart3 },
      { label: 'Carbon Transactions', href: '/carbon-transactions', icon: Leaf },
      { label: 'Environmental Goals', href: '/environmental-goals', icon: LineChart },
    ],
  },
  {
    title: 'Social',
    countKey: 'social' as const,
    items: [
      { label: 'CSR Activities', href: '/csr-activities', icon: Users },
      { label: 'Employee Participation', href: '/participation', icon: CheckSquare },
      { label: 'Diversity', href: '/diversity', icon: BarChart3 },
    ],
  },
  {
    title: 'Governance',
    countKey: 'governance' as const,
    items: [
      { label: 'Policies', href: '/policies', icon: FileText },
      { label: 'Acknowledgements', href: '/acknowledgements', icon: CheckSquare },
      { label: 'Audits', href: '/audits', icon: ShieldAlert },
      { label: 'Compliance Issues', href: '/compliance-issues', icon: ShieldAlert },
    ],
  },
  {
    title: 'Gamification',
    countKey: 'gamification' as const,
    items: [
      { label: 'Challenges', href: '/challenges', icon: Trophy },
      { label: 'Participation', href: '/challenge-participation', icon: Trophy },
      { label: 'Badges', href: '/badges', icon: Medal },
      { label: 'Rewards', href: '/rewards', icon: Gift },
      { label: 'Leaderboard', href: '/leaderboard', icon: LineChart },
    ],
  },
  {
    title: 'Reports',
    countKey: null,
    items: [
      { label: 'Environmental', href: '/reports/environmental', icon: LineChart },
      { label: 'Social', href: '/reports/social', icon: LineChart },
      { label: 'Governance', href: '/reports/governance', icon: LineChart },
      { label: 'ESG Summary', href: '/reports/summary', icon: LineChart },
    ],
  },
  {
    title: 'Settings',
    countKey: null,
    items: [
      { label: 'Users & Roles', href: '/users', icon: Users },
      { label: 'Departments', href: '/departments', icon: Settings },
      { label: 'Categories', href: '/categories', icon: Settings },
      { label: 'ESG Configuration', href: '/esg-config', icon: Settings },
      { label: 'Notifications', href: '/notifications', icon: Settings },
    ],
  },
]

function NavContent({
  counts,
  onNavigate,
  session,
}: {
  counts: NavCounts
  onNavigate?: () => void
  session: Session
}) {
  const pathname = usePathname()
  const user = session.user as { name?: string | null; totalXp?: number }
  const xp = user?.totalXp ?? 0
  const level = getLevel(xp)
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  // Visual-only XP progress bar. Level thresholds mirror the frozen LEVELS
  // constant (Sprout 0 · Grower 500 · Steward 1500 · Champion 3000 · Guardian
  // 6000) purely to size the bar — no data or scoring behavior is involved.
  const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000]
  const nextThreshold = LEVEL_THRESHOLDS[level.level] // undefined at max level
  const span = Math.max(1, (nextThreshold ?? level.min) - level.min)
  const progressPct = nextThreshold
    ? Math.min(100, Math.round(((xp - level.min) / span) * 100))
    : 100

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pb-3.5 pt-[18px]">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-brand-primary text-sm font-bold text-white">
          <svg width="19" height="19" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="5.5" fill="#FFFFFF" />
            <ellipse
              cx="16"
              cy="16"
              rx="10"
              ry="3.6"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.7"
              transform="rotate(-28 16 16)"
            />
          </svg>
        </span>
        <h1 className="text-[15px] font-bold tracking-[-0.2px] text-ink">EcoSphere</h1>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3 pt-1">
        {navGroups.map((group) => {
          const count = group.countKey ? counts[group.countKey] : undefined
          return (
            <div key={group.title} className="flex flex-col gap-0.5">
              <div className="mb-1 flex items-center justify-between px-2.5">
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                  {group.title}
                </h3>
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                  const showCount =
                    count !== undefined && count > 0 && item.href === group.items[0].href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={`flex items-center justify-between gap-2 rounded-[7px] px-2.5 py-[7px] text-[13px] transition-colors ${
                          isActive
                            ? 'bg-brand-primary font-semibold text-white'
                            : 'font-medium text-ink/85 hover:bg-hover'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Icon className="h-[17px] w-[17px] shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {showCount && (
                          <span
                            className={`rounded-full px-[7px] py-px text-[10.5px] font-semibold tabular-nums ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-tint-green text-pill-green-fg'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2.5 border-t border-line px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-accent-line bg-tint-green text-[11px] font-bold text-brand-primary">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col gap-px">
            <div className="truncate text-[12.5px] font-semibold text-ink">
              {user?.name || 'User'}
            </div>
            <div className="truncate text-[11px] text-ink-2">
              Level {level.level} · {level.name}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-[5px] overflow-hidden rounded-full bg-track">
            <div
              className="h-full rounded-full bg-brand-primary"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-[10.5px] tabular-nums text-faint">
            {nextThreshold
              ? `${xp.toLocaleString()} / ${nextThreshold.toLocaleString()} XP to Level ${level.level + 1}`
              : `${xp.toLocaleString()} XP · max level`}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SidebarProps {
  session: Session
  counts: NavCounts
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ session, counts, mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: static column */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <NavContent counts={counts} session={session} />
      </aside>

      {/* Mobile/tablet: off-canvas drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-line bg-surface shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-faint hover:bg-hover"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
          <NavContent counts={counts} session={session} onNavigate={onClose} />
        </aside>
      </div>
    </>
  )
}
