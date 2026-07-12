'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Search, LogOut, Menu, CheckCheck } from 'lucide-react'
import { getLevel } from '@/lib/levels'
import { ThemeToggle } from './theme-toggle'

interface TopbarProps {
  session: Session | null
  onMenuClick: () => void
}

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  createdAt: string
}

const NOTIF_ICON: Record<string, string> = {
  APPROVAL: '✅',
  BADGE: '🏅',
  COMPLIANCE: '⚠️',
  POLICY_REMINDER: '📄',
  REWARD: '🎁',
}

function breadcrumbFromPath(pathname: string | null): string {
  if (!pathname) return 'Dashboard'
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return 'Dashboard'
  const titleize = (s: string) =>
    s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  if (parts[0] === 'reports' && parts[1]) return `Reports · ${titleize(parts[1])}`
  return titleize(parts[parts.length - 1])
}

export function Topbar({ session, onMenuClick }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const user = session?.user as { name?: string | null; totalXp?: number } | undefined
  const xp = user?.totalXp || 0
  const level = getLevel(xp).level

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const { data } = useQuery<{ notifications: NotificationRow[]; unread: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) return { notifications: [], unread: 0 }
      return res.json()
    },
    refetchInterval: 30000,
  })

  const notifications = data?.notifications ?? []
  const unread = data?.unread ?? 0

  const markAllRead = async () => {
    await Promise.all(
      notifications
        .filter((n) => !n.read)
        .map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })),
    )
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-md p-1.5 text-faint hover:bg-hover lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-[7px] text-[13px]">
            <span className="hidden font-semibold text-brand-primary sm:inline">EcoSphere</span>
            <span className="hidden text-faint sm:inline">›</span>
            <span className="truncate font-medium text-ink">
              {breadcrumbFromPath(pathname)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden h-[34px] items-center gap-2 rounded-[7px] border border-line bg-canvas px-2.5 xl:flex xl:w-[300px]">
            <Search className="h-4 w-4 text-faint" />
            <input
              type="text"
              placeholder="Search records, challenges…"
              className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
            />
            <span className="rounded border border-line bg-surface px-1.5 py-px text-[10px] text-faint">
              ⌘K
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[7px] border border-line bg-surface text-ink-2 transition-colors hover:bg-hover hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="h-[17px] w-[17px]" />
              {unread > 0 && (
                <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full border-[1.5px] border-surface bg-pill-red-fg" />
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="animate-es-fade absolute right-0 z-50 mt-2 w-[380px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-[10px] border border-line bg-surface shadow-[0_12px_32px_rgba(31,41,55,.16)]">
                  <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-[13.5px] font-semibold text-ink">Notifications</h3>
                      {unread > 0 && (
                        <span className="rounded-full bg-tint-green px-[7px] py-px text-[10.5px] font-semibold tabular-nums text-pill-green-fg">
                          {unread} new
                        </span>
                      )}
                    </div>
                    {unread > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-faint">
                        No notifications yet
                      </p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`flex gap-[11px] border-b border-line-soft px-4 py-3 last:border-0 ${
                            n.read ? '' : 'bg-canvas'
                          }`}
                        >
                          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-surface-2 text-[15px] leading-none">
                            {NOTIF_ICON[n.type] || '🔔'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] leading-[1.4] text-ink">{n.title}</p>
                            {n.body && (
                              <p className="mt-0.5 text-[11px] text-faint">{n.body}</p>
                            )}
                          </div>
                          {!n.read && (
                            <span className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-brand-primary" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <ThemeToggle />

          {/* User menu */}
          <div className="flex h-[34px] items-center gap-[9px] rounded-full border border-line bg-surface pl-[5px] pr-3">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-brand-primary text-[10.5px] font-bold text-white">
              {initials}
            </div>
            <div className="hidden whitespace-nowrap text-[12px] font-semibold text-ink sm:block">
              Level {level} ·{' '}
              <span className="tabular-nums text-brand-primary">
                {xp.toLocaleString()} XP
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[7px] border border-line bg-surface text-ink-2 transition-colors hover:bg-pill-red-bg hover:text-pill-red-fg"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-[17px] w-[17px]" />
          </button>
        </div>
      </div>
    </header>
  )
}
