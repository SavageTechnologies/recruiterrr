import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { hasFullAccess, isAdmin } from '@/lib/auth/access'

const isProtectedRoute  = createRouteMatcher(['/dashboard(.*)'])

// David stays admin-only — not launched yet
const isAdminRoute = createRouteMatcher([
  '/dashboard/david(.*)',
  '/api/david(.*)',
])

// Anathema and Prometheus open to all paying subscribers
const isSubscriberRoute = createRouteMatcher([
  '/dashboard/anathema(.*)',
  '/dashboard/prometheus(.*)',
  '/api/anathema(.*)',
  '/api/prometheus(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req) && !isAdminRoute(req) && !isSubscriberRoute(req)) return NextResponse.next()

  // Must be logged in
  const { userId } = await auth.protect()

  // David — admin only, hard block for everyone else
  if (isAdminRoute(req)) {
    if (!isAdmin(userId)) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Anathema + Prometheus — middleware just ensures they're logged in.
  // The API handlers do the Supabase plan='pro' check so we avoid a DB
  // call on every middleware invocation.
  if (isSubscriberRoute(req)) {
    return NextResponse.next()
  }

  // All other dashboard routes
  if (hasFullAccess(userId)) {
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
