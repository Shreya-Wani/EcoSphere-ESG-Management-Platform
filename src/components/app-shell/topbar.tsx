'use client'

import { useState } from 'react'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Search, LogOut } from 'lucide-react'
import { getLevel } from '@/lib/levels'

interface TopbarProps {
  title: string
  session: Session | null
}

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  createdAt: string
}

async function fetchNotifications(): Promise<{ notifications: NotificationRow[]; unread: number }> {
  const res = await fetch('/api/notifications')
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json()
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

export function Topbar({ title, session }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const qc = useQueryClient()

  const user = session?.user as any
  const xp = user?.totalXp || 0
  const level = getLevel(xp).level

  const initials =
    user?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() || 'U'

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60_000, // light polling so the overdue flag surfaces
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = data?.notifications ?? []
  const unread = data?.unread ?? 0

  function toggleOpen() {
    const next = !notifOpen
    setNotifOpen(next)
    // Mark unread as read when opening.
    if (next && unread > 0) {
      items.filter((n) => !n.read).forEach((n) => markRead.mutate(n.id))
    }
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>EcoSphere</span>
          <span className="text-gray-400">/</span>
          <span>{title}</span>
        </div>

        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={toggleOpen}
              className="relative text-gray-600 hover:text-gray-900 transition-all"
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full text-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {items.map((n) => (
                        <li
                          key={n.id}
                          className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-brand-primary/5'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          {n.body && <p className="text-xs text-gray-600 mt-1">{n.body}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-600">
                Level {level} · {xp.toLocaleString()} XP
              </div>
            </div>

            <div className="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center font-semibold">
              {initials}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
              className="text-gray-600 hover:text-gray-900 transition-all"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
