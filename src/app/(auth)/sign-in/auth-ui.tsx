'use client'

import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// Shared field styling for the auth forms — matches the original sign-in page's
// input treatment (rounded-lg, moss focus ring) so the tabbed forms feel native.
const inputBase =
  'w-full rounded-lg border bg-surface px-4 py-2.5 text-[13.5px] text-ink outline-none transition placeholder:text-faint focus:ring-2 focus:ring-brand-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

function borderFor(hasError?: boolean) {
  return hasError
    ? 'border-pill-red-fg/50 focus:border-pill-red-fg'
    : 'border-input-line focus:border-brand-primary'
}

interface ShellProps {
  label: string
  htmlFor: string
  error?: string
  optional?: boolean
  hint?: ReactNode
  children: ReactNode
}

function FieldShell({ label, htmlFor, error, optional, hint, children }: ShellProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-ink"
      >
        <span>{label}</span>
        {optional && <span className="text-[11px] font-normal text-faint">Optional</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11.5px] font-medium text-pill-red-fg">{error}</p>
      ) : hint ? (
        <div className="mt-1.5">{hint}</div>
      ) : null}
    </div>
  )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  optional?: boolean
  hint?: ReactNode
}

export function TextField({ label, error, optional, hint, className, id, ...rest }: TextFieldProps) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <FieldShell label={label} htmlFor={inputId} error={error} optional={optional} hint={hint}>
      <input id={inputId} className={cn(inputBase, borderFor(!!error), className)} {...rest} />
    </FieldShell>
  )
}

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: ReactNode
}

export function PasswordField({ label, error, hint, className, id, ...rest }: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  const generated = useId()
  const inputId = id ?? generated
  return (
    <FieldShell label={label} htmlFor={inputId} error={error} hint={hint}>
      <div className="relative">
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          className={cn(inputBase, borderFor(!!error), 'pr-11', className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-2 transition-colors hover:text-ink"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </FieldShell>
  )
}

/** Shared error/success/info banner used across the auth forms. */
export function Banner({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  const tones = {
    error: 'border-pill-red-fg/30 bg-pill-red-bg text-pill-red-fg',
    success: 'border-pill-green-fg/30 bg-pill-green-bg text-pill-green-fg',
    info: 'border-pill-blue-fg/30 bg-pill-blue-bg text-pill-blue-fg',
  }[tone]
  return (
    <div className={cn('rounded-lg border p-3 text-[12.5px] font-medium', tones)} role="alert">
      {children}
    </div>
  )
}
