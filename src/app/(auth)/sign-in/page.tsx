'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

// Seeded demo accounts (all share password `demo1234`) — one per role so the
// permission model can be demoed by switching accounts, since role is assigned
// per user, not chosen at login.
const DEMO_ACCOUNTS: { label: string; email: string }[] = [
  { label: 'Admin', email: 'admin@ecosphere.dev' },
  { label: 'ESG Manager', email: 'esg@ecosphere.dev' },
  { label: 'HR Manager', email: 'hr@ecosphere.dev' },
  { label: 'Auditor', email: 'auditor@ecosphere.dev' },
  { label: 'Compliance', email: 'compliance@ecosphere.dev' },
  { label: 'Employee', email: 'priya@ecosphere.dev' },
]
const DEMO_PASSWORD = 'demo1234'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (loginEmail: string, loginPassword: string) => {
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (!result?.ok) {
        setError('Invalid email or password')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left Panel - Brand */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#33503C] p-14 text-white lg:flex lg:w-[45%]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-white/[0.03]" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-white/25 bg-white/[0.14]">
            <svg width="21" height="21" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="5.5" fill="#FFFFFF" />
              <ellipse cx="16" cy="16" rx="10" ry="3.6" fill="none" stroke="#FFFFFF" strokeWidth="1.6" transform="rotate(-28 16 16)" />
            </svg>
          </span>
          <span className="text-[19px] font-bold tracking-[-0.2px]">EcoSphere</span>
        </div>

        <div className="relative flex max-w-[420px] flex-col gap-7">
          <p className="text-[32px] font-semibold leading-[1.28] tracking-[-0.5px]">
            ESG data, employee action and gamified engagement — in one system of record.
          </p>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-3 border-t border-white/15 py-3">
              <span className="min-w-[110px] text-[20px] font-semibold tabular-nums">2,450 tCO₂e</span>
              <span className="text-[13px] text-white/65">emissions tracked</span>
            </div>
            <div className="flex items-baseline gap-3 border-t border-white/15 py-3">
              <span className="min-w-[110px] text-[20px] font-semibold tabular-nums">8,920</span>
              <span className="text-[13px] text-white/65">active participants</span>
            </div>
            <div className="flex items-baseline gap-3 border-y border-white/15 py-3">
              <span className="min-w-[110px] text-[20px] font-semibold tabular-nums">98%</span>
              <span className="text-[13px] text-white/65">audit compliance</span>
            </div>
          </div>
        </div>

        <div className="relative text-[11.5px] text-white/45">© 2026 EcoSphere · ESG Management Platform</div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 items-center justify-center bg-surface p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="mb-2 text-[20px] font-semibold text-ink">Welcome back</h2>
          <p className="mb-8 text-[13px] text-ink-2">Sign in to your ESG management platform</p>

          {error && (
            <div className="mb-6 rounded-lg border border-pill-red-fg/30 bg-pill-red-bg p-3 text-sm text-pill-red-fg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-input-line bg-surface px-4 py-2.5 text-[13.5px] text-ink outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-input-line bg-surface px-4 py-2.5 text-[13.5px] text-ink outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-primary py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-input-line" />
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-2">
                Quick demo login
              </span>
              <div className="h-px flex-1 bg-input-line" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  disabled={loading}
                  onClick={() => login(acct.email, DEMO_PASSWORD)}
                  className="rounded-lg border border-input-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-brand-primary hover:bg-brand-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {acct.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[11.5px] text-ink-2">
              Each account demonstrates a different role · password{' '}
              <span className="font-medium">demo1234</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
