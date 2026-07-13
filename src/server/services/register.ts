// =============================================================
// EcoSphere — Public self-service registration
// Distinct from the admin `createUser` action (src/server/services/users.ts):
// this is the endpoint real users hit from the sign-up tab. It applies the
// strong-password policy (validated upstream by registerSchema), stores the
// account in the SAME `users` table as the seeded demo accounts, and logs the
// user in through the unchanged Credentials provider afterwards.
// =============================================================
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, departments } from '@/db/schema'
import { conflict } from '@/server/errors'
import { emailWelcome } from '@/server/services/mail'
import type { RegisterInput } from '@/lib/validations/auth'

export interface RegisteredUser {
  id: string
  name: string
  email: string
  role: string
}

/** Create a real user account from the public sign-up form. */
export async function registerUser(input: RegisterInput): Promise<RegisteredUser> {
  const email = input.email.trim().toLowerCase()

  // Friendly duplicate-email guard. The users_email_uq unique index is the
  // hard backstop, but this returns a clear 409 before we attempt the insert.
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (existing.length) {
    throw conflict('An account with this email already exists')
  }

  const passwordHash = await hash(input.password, 10)
  const departmentId = await pickDefaultDepartmentId()

  const [row] = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
      departmentId,
      // `input.organization` is intentionally dropped: the FROZEN users schema
      // has no column for it. Persist it here once users.organization exists.
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })

  // Best-effort welcome email — never throws, no-ops without SMTP creds
  // (see src/server/services/mail/transport.ts), so it cannot break sign-up.
  await emailWelcome(row.email, row.name)

  return row
}

/**
 * Give new self-service accounts a real department so their dashboard renders
 * against live data instead of an empty (null-department) view. Prefers
 * Corporate (code "COR"), falls back to the first department, then null.
 * Best-effort — a lookup failure must not block registration.
 */
async function pickDefaultDepartmentId(): Promise<string | null> {
  try {
    const [corp] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.code, 'COR'))
      .limit(1)
    if (corp) return corp.id

    const [first] = await db.select({ id: departments.id }).from(departments).limit(1)
    return first?.id ?? null
  } catch {
    return null
  }
}
