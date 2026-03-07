import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/access'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

// Admin-only — not launched, blocked even if you know the URL
// /api/david/enrich is exempt — internal server-to-server call, protected by ENRICHMENT_SECRET
const isAdminRoute = createRouteMatcher([
  '/dashboard/david(.*)',
  '/dashboard/anathema(.*)',
  '/api/david/network(.*)',
  '/api/anathema(.*)',
])

const isInternalRoute = createRouteMatcher([
  '/api/david/enrich(.*)',
])

// Subscriber routes — login required, plan check handled in API handlers
const isSubscriberRoute = createRouteMatcher([
  '/dashboard/prometheus(.*)',
  '/api/prometheus(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req) && !isAdminRoute(req) && !isSubscriberRoute(req)) return NextResponse.next()

  // Must be logged in
  const { userId } = await auth.protect()

  // Internal server-to-server routes — protected by secret header, not Clerk
  if (isInternalRoute(req)) return NextResponse.next()

  // Anathema + David — admin only, redirect everyone else
  if (isAdminRoute(req)) {
    if (!isAdmin(userId)) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Prometheus — middleware just ensures logged in, API handlers do plan check
  if (isSubscriberRoute(req)) {
    return NextResponse.next()
  }

  // All other dashboard routes — just needs to be logged in
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
