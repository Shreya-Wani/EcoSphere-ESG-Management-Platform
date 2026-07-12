import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/server/api-helpers'
import { sessionUser, forbidden } from '@/server/errors'
import { updateUser, userUpdateSchema } from '@/server/services/users'

// PATCH /api/users/[id] → ADMIN updates a user's role and/or department.
export const PATCH = withAuth(async (req: NextRequest, ctx: any) => {
  const actor = sessionUser(ctx.session)
  if (actor.role !== 'ADMIN') return forbidden('Only admins can change roles')

  const { id } = (await ctx.params) ?? {}
  const body = userUpdateSchema.parse(await req.json().catch(() => ({})))
  const updated = await updateUser(id, body)
  return NextResponse.json(updated)
})
