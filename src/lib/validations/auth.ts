// =============================================================
// EcoSphere — Auth validation (shared client + server)
// Pure Zod + helpers, no server/db imports, so both the sign-up form and the
// /api/auth/register route validate against the SAME rules. Role values mirror
// roleEnum in src/db/schema.ts (FROZEN).
// =============================================================
import { z } from 'zod'

// Role options for the sign-up <select>. `value` must match roleEnum exactly.
// EMPLOYEE is first so it is the safe default selection.
export const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'ESG_MANAGER', label: 'ESG Manager' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
  { value: 'ADMIN', label: 'Admin' },
] as const

// ---------- Password policy ----------
// Live criteria used by the sign-up strength checklist. The Zod schema below
// enforces the same five rules server-side.
export const PASSWORD_CRITERIA: { label: string; test: (pw: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

export function evaluatePassword(pw: string) {
  const results = PASSWORD_CRITERIA.map((c) => ({ label: c.label, met: c.test(pw) }))
  const metCount = results.filter((r) => r.met).length
  return { results, metCount, allMet: metCount === PASSWORD_CRITERIA.length }
}

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[0-9]/, 'Add a number')
  .regex(/[^A-Za-z0-9]/, 'Add a special character')

// ---------- Sign in ----------
export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type SignInInput = z.infer<typeof signInSchema>

// ---------- Sign up / register ----------
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name').max(120, 'Name is too long'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .max(190, 'Email is too long'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    // Optional — collected for UX, but NOT persisted: the FROZEN users table
    // has no organization column. See src/server/services/register.ts.
    organization: z.string().trim().max(120, 'Organization name is too long').optional(),
    role: z
      .enum(['ADMIN', 'ESG_MANAGER', 'HR_MANAGER', 'AUDITOR', 'COMPLIANCE_OFFICER', 'EMPLOYEE'])
      .default('EMPLOYEE'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Flatten a ZodError into one message per field (first issue wins) — the shape
 * both the API route and the forms use to render field-level errors. Uses the
 * stable `.issues` array so it is Zod v3/v4-agnostic.
 */
export function fieldErrorsFromZod(issues: z.ZodError['issues']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !out[key]) out[key] = issue.message
  }
  return out
}
