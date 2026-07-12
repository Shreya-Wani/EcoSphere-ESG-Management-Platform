import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LandingPage } from '@/components/landing/landing-page'

// Root route: signed-in users go straight to their dashboard; everyone else
// sees the marketing landing page (ported from the approved design mockup).
export default async function Home() {
  const session = await auth()
  if (session) redirect('/dashboard')
  return <LandingPage />
}
