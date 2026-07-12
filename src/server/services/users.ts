// =============================================================
// EcoSphere — User service
// Minimal user-creation business action so the Welcome email has a real
// trigger (the app otherwise only creates users via the seed). Admin-only;
// exposed through POST /api/users.
// =============================================================
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { conflict, notFound } from '@/server/errors'
import { emailWelcome } from '@/server/services/mail'

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z
    .enum(['ADMIN', 'ESG_MANAGER', 'HR_MANAGER', 'AUDITOR', 'COMPLIANCE_OFFICER', 'EMPLOYEE'])
    .default('EMPLOYEE'),
  departmentId: z.string().optional(),
})
export type UserCreate = z.infer<typeof userCreateSchema>

export interface CreatedUser {
  id: string
  name: string
  email: string
  role: string
  departmentId: string | null
}

export const userUpdateSchema = z.object({
  role: z
    .enum(['ADMIN', 'ESG_MANAGER', 'HR_MANAGER', 'AUDITOR', 'COMPLIANCE_OFFICER', 'EMPLOYEE'])
    .optional(),
  departmentId: z.string().nullable().optional(),
})
export type UserUpdate = z.infer<typeof userUpdateSchema>

/** Create a user (admin action) and send them a welcome email. Email is unique. */
export async function createUser(data: UserCreate): Promise<CreatedUser> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1)
  if (existing.length) throw conflict('A user with that email already exists')

  const passwordHash = await hash(data.password, 10)
  const [row] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      departmentId: data.departmentId ?? null,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      departmentId: users.departmentId,
    })

  // Welcome email — best-effort, never blocks account creation.
  await emailWelcome(row.email, row.name)

  return row
}

/** Update a user's role and/or department (admin action). */
export async function updateUser(id: string, data: UserUpdate): Promise<CreatedUser> {
  const patch: Partial<{ role: UserCreate['role']; departmentId: string | null }> = {}
  if (data.role !== undefined) patch.role = data.role
  if (data.departmentId !== undefined) patch.departmentId = data.departmentId

  const [row] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      departmentId: users.departmentId,
    })

  if (!row) throw notFound('User not found')
  return row
}
