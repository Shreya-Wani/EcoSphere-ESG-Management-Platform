import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { registerSchema, fieldErrorsFromZod } from '@/lib/validations/auth'
import { registerUser } from '@/server/services/register'

// POST /api/auth/register — public self-service account creation.
// Lives under /api/auth/* so middleware treats it as public (no session
// required). Returns 201 on success, 422 with field errors on invalid input,
// 409 when the email is already taken.
export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}))
    const data = registerSchema.parse(json)
    const user = await registerUser(data)
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields', fieldErrors: fieldErrorsFromZod(error.issues) },
        { status: 422 },
      )
    }
    // Domain errors (e.g. duplicate email → conflict()) are thrown as a
    // NextResponse; return them verbatim, mirroring how withAuth behaves.
    if (error instanceof Response) {
      return error
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
