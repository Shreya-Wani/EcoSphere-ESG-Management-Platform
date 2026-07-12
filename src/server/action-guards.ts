// =============================================================
// Auth guards for Server Actions (gamification vertical).
// Server Actions don't go through withAuth/requirePermission, so they must
// authenticate + authorize themselves. These helpers throw on failure; the
// calling action returns { success:false, error } or lets it bubble.
// =============================================================
import { auth } from '@/auth'

export type ActionRole =
  | 'ADMIN'
  | 'ESG_MANAGER'
  | 'HR_MANAGER'
  | 'AUDITOR'
  | 'COMPLIANCE_OFFICER'
  | 'EMPLOYEE'

/** Returns the authenticated session + userId, or throws. */
export async function requireActionSession() {
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) throw new Error('You must be signed in to do that.')
  return { session, userId, role: ((session!.user as any).role ?? 'EMPLOYEE') as ActionRole }
}

/** Authenticates AND checks the caller holds one of `roles`, or throws. */
export async function requireActionRole(...roles: ActionRole[]) {
  const ctx = await requireActionSession()
  if (roles.length && !roles.includes(ctx.role)) {
    throw new Error('You do not have permission to perform this action.')
  }
  return ctx
}
