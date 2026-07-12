'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Toggle } from '../esg-config/page'
import { useToast } from '@/components/shared/toast'

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  createdAt: string
}

interface NotifSettings {
  emailAlerts: boolean
  badgeAutoAward: boolean
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

async function getFeed(): Promise<{ notifications: NotificationRow[]; unread: number }> {
  const res = await fetch('/api/notifications')
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json()
}

async function getConfig(): Promise<NotifSettings> {
  const res = await fetch('/api/esg-config')
  if (!res.ok) throw new Error('Failed to load settings')
  const c = await res.json()
  return { emailAlerts: c.emailAlerts, badgeAutoAward: c.badgeAutoAward }
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: feed } = useQuery({ queryKey: ['notifications'], queryFn: getFeed })
  const { data: settings } = useQuery({ queryKey: ['notif-settings'], queryFn: getConfig })
  const [form, setForm] = useState<NotifSettings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const save = useMutation({
    mutationFn: async (next: NotifSettings) => {
      const res = await fetch('/api/esg-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Save failed')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-settings'] })
      qc.invalidateQueries({ queryKey: ['esg-config'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (e: Error) => toast({ title: 'Save failed', description: e.message, variant: 'error' }),
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Could not mark as read')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e: Error) => toast({ title: 'Action failed', description: e.message, variant: 'error' }),
  })

  const items = feed?.notifications ?? []
  const unreadItems = items.filter((n) => !n.read)

  const markAllRead = useMutation({
    mutationFn: async () => {
      await Promise.all(
        unreadItems.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-ink">Notifications</h1>
      <p className="text-sm text-ink-2 mt-1 mb-8">Your alerts and delivery preferences.</p>

      {/* Notification settings (toggle subset of esg_config) */}
      <section className="bg-surface p-6 rounded-lg border border-line mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">Notification Settings</h2>
        {form ? (
          <>
            <div className="divide-y divide-line-soft">
              <Toggle
                label="Email alerts"
                description="Send notifications to your email"
                checked={form.emailAlerts}
                disabled={!isAdmin}
                onChange={(v) => setForm({ ...form, emailAlerts: v })}
              />
              <Toggle
                label="Badge auto-award notifications"
                description="Notify when a badge is auto-awarded"
                checked={form.badgeAutoAward}
                disabled={!isAdmin}
                onChange={(v) => setForm({ ...form, badgeAutoAward: v })}
              />
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => save.mutate(form)}
                  disabled={save.isPending}
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {save.isPending ? 'Saving…' : 'Save Settings'}
                </button>
                {saved && <span className="text-sm text-pill-green-fg">Saved ✓</span>}
              </div>
            ) : (
              <p className="text-xs text-ink-2 mt-3">Admin access required to change these.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-2">Loading settings…</p>
        )}
      </section>

      {/* Notification feed */}
      <section className="bg-surface p-6 rounded-lg border border-line">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Your Notifications</h2>
          {unreadItems.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50"
            >
              {markAllRead.isPending ? 'Marking…' : `Mark all read (${unreadItems.length})`}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-ink-2 py-4">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {items.map((n) => (
              <li key={n.id} className={`py-3 ${n.read ? '' : 'bg-accent-soft -mx-6 px-6'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    {n.body && <p className="text-xs text-ink-2 mt-0.5">{n.body}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-faint">{timeAgo(n.createdAt)}</span>
                    {!n.read && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        className="text-xs text-brand-primary hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
