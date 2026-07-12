// =============================================================
// EcoSphere — Postgres error helpers
// Turns low-level constraint violations into clear, user-facing messages so a
// blocked delete (or a bad insert) degrades gracefully instead of surfacing as
// a generic 500 "Internal server error". Shared by withAuth (API routes) and
// Server Actions, which both need to render the same friendly reason.
// =============================================================

/** Postgres SQLSTATE for a foreign-key violation. */
const FK_VIOLATION = '23503'

/**
 * Walk the error's `cause` chain. Drizzle wraps the driver error (its
 * `.message` is "Failed query: …"), but the underlying Neon/pg error — which
 * carries `.code` and `.detail` — sits on it or on a nested `cause`.
 */
function* errorChain(err: unknown): Generator<Record<string, any>> {
  let e: any = err
  const seen = new Set<unknown>()
  while (e && typeof e === 'object' && !seen.has(e)) {
    seen.add(e)
    yield e
    e = e.cause
  }
}

/** True when the error is a Postgres foreign-key violation (code 23503). */
export function isForeignKeyViolation(err: unknown): boolean {
  for (const e of errorChain(err)) {
    if (e.code === FK_VIOLATION) return true
  }
  return false
}

/** First non-empty `detail` string found in the error chain (pg error detail). */
function violationDetail(err: unknown): string {
  for (const e of errorChain(err)) {
    if (typeof e.detail === 'string' && e.detail) return e.detail
  }
  return ''
}

/** Friendly names for the child tables whose rows can block a parent delete. */
const TABLE_LABELS: Record<string, string> = {
  carbon_transactions: 'carbon transactions',
  product_esg_profiles: 'product profiles',
  environmental_goals: 'environmental goals',
  csr_activities: 'CSR activities',
  employee_participations: 'CSR participations',
  esg_policies: 'policies',
  policy_acknowledgements: 'policy acknowledgements',
  audits: 'audits',
  compliance_issues: 'compliance issues',
  challenges: 'challenges',
  challenge_participations: 'challenge participations',
  badge_awards: 'awarded badges',
  reward_redemptions: 'reward redemptions',
  notifications: 'notifications',
  department_scores: 'department scores',
  xp_ledger: 'XP history',
  users: 'users',
}

function labelFor(table: string | undefined): string {
  return (table && TABLE_LABELS[table]) || 'other records'
}

/**
 * A clear, actionable message for a foreign-key violation.
 *
 * Two shapes occur:
 *  - DELETE blocked  → detail: `Key (id)=(…) is still referenced from table "child".`
 *  - INSERT/UPDATE   → detail: `Key (col)=(…) is not present in table "parent".`
 *
 * Falls back to a generic (but still non-scary) message when the detail can't
 * be parsed. Callers should only use this after `isForeignKeyViolation()`.
 */
export function foreignKeyMessage(err: unknown): string {
  const detail = violationDetail(err)

  const referenced = detail.match(/still referenced from table "([^"]+)"/)
  if (referenced) {
    return `Can't delete this record because it's still in use by ${labelFor(
      referenced[1],
    )}. Remove or reassign those first, then try again.`
  }

  const missing = detail.match(/is not present in table "([^"]+)"/)
  if (missing) {
    return `That linked ${labelFor(missing[1])} record no longer exists — refresh and try again.`
  }

  return "Can't delete this record because other data still depends on it. Remove or reassign the related records first."
}
