import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/server/api-helpers'
import { requirePermission } from '@/server/permissions'
import { db } from '@/db'
import { esgConfig } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { esgConfigUpdateSchema } from '@/server/validators/platform'
import { recalculateScores } from '@/server/services/score/recalculate'

/** Fetch the singleton config row, creating it with defaults if absent. */
async function getOrCreateConfig() {
  const rows = await db.select().from(esgConfig).limit(1)
  if (rows[0]) return rows[0]
  const [created] = await db.insert(esgConfig).values({}).returning()
  return created
}

// GET /api/esg-config → the singleton (any authenticated reader).
export const GET = withAuth(async (_req: NextRequest, ctx?: any) => {
  requirePermission(ctx.session, 'esgConfig', 'read')
  const config = await getOrCreateConfig()
  return NextResponse.json(config)
})

// PATCH /api/esg-config → update the singleton (ADMIN). Zod enforces the
// weights-sum-to-1.0 rule; unknown fields are stripped by the schema.
export const PATCH = withAuth(async (req: NextRequest, ctx?: any) => {
  requirePermission(ctx.session, 'esgConfig', 'update')

  const body = esgConfigUpdateSchema.parse(await req.json())
  const current = await getOrCreateConfig()

  const [updated] = await db
    .update(esgConfig)
    .set(body)
    .where(eq(esgConfig.id, current.id))
    .returning()

  // Re-weight department scores so a weights/rules change takes effect
  // immediately on the dashboard and reports. Never fails the save.
  try {
    await recalculateScores()
  } catch (err) {
    console.error('[esg-config] recalculate after save failed', err)
  }

  return NextResponse.json(updated)
})
