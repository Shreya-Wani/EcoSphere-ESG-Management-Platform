import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// Public paths that never require authentication.
const PUBLIC_PATHS = ['/sign-in']

export const middleware = auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname === '/' || // marketing landing page (page.tsx redirects if signed in)
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/api/auth') ||
    pathname === '/api/health'

  if (!req.auth && !isPublic) {
    const signInUrl = new URL('/sign-in', req.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
