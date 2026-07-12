// =============================================================
// API: /api/emission-factors/[id] — PATCH update, DELETE
// OWNER: Mitesh
// Permissions: update = ADMIN | ESG_MANAGER, delete = ADMIN
// =============================================================
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/server/api-helpers'
import { requirePermission } from '@/server/permissions'
import { emissionFactorSchema } from '@/server/validators/env'
import {
  updateEmissionFactor,
  deleteEmissionFactor,
  getEmissionFactorById,
} from '@/server/services/env/emission-factors'

export const PATCH = withAuth(async (req: NextRequest, ctx: any) => {
  requirePermission(ctx.session, 'emissionFactor', 'update')
  const { id } = await ctx.params
  const existing = await getEmissionFactorById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const data = emissionFactorSchema.partial().parse(body)
  const updated = await updateEmissionFactor(id, data)
  return NextResponse.json(updated)
})

export const DELETE = withAuth(async (_req: NextRequest, ctx: any) => {
  requirePermission(ctx.session, 'emissionFactor', 'delete')
  const { id } = await ctx.params
  const existing = await getEmissionFactorById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await deleteEmissionFactor(id)
  return NextResponse.json({ success: true })
})
