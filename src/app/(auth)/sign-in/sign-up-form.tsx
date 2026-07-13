'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  registerSchema,
  fieldErrorsFromZod,
  evaluatePassword,
  ROLE_OPTIONS,
} from '@/lib/validations/auth'
import { TextField, PasswordField, Banner } from './auth-ui'

function PasswordChecklist({ password }: { password: string }) {
  const { results } = evaluatePassword(password)
  return (
    <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {results.map((r) => (
        <li
          key={r.label}
          className={cn(
            'flex items-center gap-1.5 text-[11px] transition-colors',
            r.met ? 'text-pill-green-fg' : 'text-ink-2',
          )}
        >
          {r.met ? (
            <Check size={12} strokeWidth={3} className="shrink-0" />
          ) : (
            <span className="inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-current opacity-40" />
          )}
          {r.label}
        </li>
      ))}
    </ul>
  )
}

export function SignUpForm({ onRegistered }: { onRegistered?: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organization, setOrganization] = useState('')
  const [role, setRole] = useState<string>('EMPLOYEE')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Live confirm-password mismatch (before the field has a submitted error).
  const liveConfirmError =
    confirmPassword.length > 0 && confirmPassword !== password ? 'Passwords do not match' : undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSuccess('')

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      organization,
      role,
    })

    if (!parsed.success) {
      const fe = fieldErrorsFromZod(parsed.error.issues)
      // A non-empty password is guided by the live checklist below the field,
      // so drop the schema's per-rule message to avoid a redundant red line.
      if (password.length > 0) delete fe.password
      setErrors(fe)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const body = await res.json().catch(() => ({}))

      if (res.status === 201) {
        // Seamlessly sign the new user in via the same Credentials provider.
        const result = await signIn('credentials', {
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
          redirect: false,
        })
        if (result?.ok) {
          router.push('/dashboard')
          router.refresh()
          return
        }
        // Account created but auto-login didn't take — send them to Sign In.
        setSuccess('Account created! Please sign in with your new credentials.')
        onRegistered?.()
        return
      }

      if (res.status === 422 && body.fieldErrors) {
        setErrors(body.fieldErrors as Record<string, string>)
        return
      }
      if (res.status === 409) {
        setErrors({ email: body.error ?? 'An account with this email already exists' })
        return
      }
      setFormError(body.error ?? 'Something went wrong. Please try again.')
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && <Banner tone="error">{formError}</Banner>}
      {success && <Banner tone="success">{success}</Banner>}

      <TextField
        label="Full Name"
        autoComplete="name"
        placeholder="Jane Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        disabled={loading}
      />

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={loading}
      />

      <PasswordField
        label="Password"
        autoComplete="new-password"
        placeholder="Create a strong password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        disabled={loading}
        hint={password.length > 0 ? <PasswordChecklist password={password} /> : undefined}
      />

      <PasswordField
        label="Confirm Password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword ?? liveConfirmError}
        disabled={loading}
      />

      <TextField
        label="Organization Name"
        optional
        autoComplete="organization"
        placeholder="e.g. Acme Corp"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        error={errors.organization}
        disabled={loading}
      />

      <div>
        <label htmlFor="signup-role" className="mb-1.5 block text-[12px] font-semibold text-ink">
          Role
        </label>
        <div className="relative">
          <select
            id="signup-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            className="w-full appearance-none rounded-lg border border-input-line bg-surface px-4 py-2.5 pr-10 text-[13.5px] text-ink outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute inset-y-0 right-3 my-auto text-ink-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-faint">
        By creating an account you agree to EcoSphere&apos;s Terms and acknowledge our Privacy Policy.
      </p>
    </form>
  )
}
