'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { signInSchema, fieldErrorsFromZod } from '@/lib/validations/auth'
import { TextField, PasswordField, Banner } from './auth-ui'

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setInfo('')

    const parsed = signInSchema.safeParse({ email, password })
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error.issues))
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
        redirect: false,
      })

      if (!result?.ok) {
        setFormError('Invalid email or password. Please try again.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && <Banner tone="error">{formError}</Banner>}
      {info && <Banner tone="info">{info}</Banner>}

      <TextField
        label="Work Email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={loading}
      />

      <div>
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={loading}
        />
        <div className="mt-1.5 text-right">
          <button
            type="button"
            onClick={() =>
              setInfo('Password reset is coming soon — contact your administrator to recover access.')
            }
            className="text-[11.5px] font-medium text-brand-primary transition-colors hover:text-brand-primary-dark"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
