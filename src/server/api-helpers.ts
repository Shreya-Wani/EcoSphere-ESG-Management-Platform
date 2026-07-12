import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ZodError } from 'zod'
import { isForeignKeyViolation, foreignKeyMessage } from '@/server/db-errors'

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse | Response>

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx?: any) => {
    try {
      const session = await auth()

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const res = await handler(req, { ...ctx, session })

      return res
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.issues },
          { status: 422 },
        )
      }

      if (error instanceof Response) {
        return error
      }

      // A blocked delete (or a bad link on insert/update) is a client-fixable
      // conflict, not a server fault — surface a clear reason with 409 instead
      // of a generic 500. See src/server/db-errors.ts.
      if (isForeignKeyViolation(error)) {
        return NextResponse.json({ error: foreignKeyMessage(error) }, { status: 409 })
      }

      console.error('API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
