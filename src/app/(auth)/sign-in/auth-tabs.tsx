'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SignInForm } from './sign-in-form'
import { SignUpForm } from './sign-up-form'

type Tab = 'signin' | 'signup'

export function AuthTabs() {
  const [tab, setTab] = useState<Tab>('signin')

  return (
    <div>
      <div
        role="tablist"
        aria-label="Account access"
        className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-input-line bg-surface-2 p-1"
      >
        {(
          [
            { id: 'signin', label: 'Sign In' },
            { id: 'signup', label: 'Sign Up' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-lg py-2 text-[13px] font-semibold transition-colors',
              tab === t.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'signin' ? <SignInForm /> : <SignUpForm onRegistered={() => setTab('signin')} />}
    </div>
  )
}
