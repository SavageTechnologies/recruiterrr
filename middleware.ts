import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { hasFullAccess, isAdmin } from '@/lib/auth/access'

const isProtectedRoute  = createRouteMatcher(['/dashboard(.*)'])

// Routes that are admin-only — UI hidden from users but also hard-blocked here
// so direct URL entry and direct API calls both bounce
const isAdminRoute = createRouteMatcher([
  '/dashboard/anathema(.*)',
  '/dashboard/david(.*)',
  '/api/anathema(.*)',
  '/api/david(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req) && !isAdminRoute(req)) return NextResponse.next()

  // Must be logged in
  const { userId } = await auth.protect()

  // Admin-only routes — hard block for everyone else
  if (isAdminRoute(req)) {
    if (!isAdmin(userId)) {
      // For API calls return 403; for page requests redirect to dashboard
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // All other dashboard routes — admins/comped pass through,
  // everyone else gets subscription checked in the layout.
  if (hasFullAccess(userId)) {
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files and _next internals.
    // API routes must be included so Clerk auth() context is established in handlers.
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
