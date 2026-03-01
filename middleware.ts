import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { hasFullAccess } from '@/lib/auth/access'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return NextResponse.next()

  // Must be logged in
  const { userId } = await auth.protect()

  // Admins and comped users — pass straight through
  if (hasFullAccess(userId)) {
    return NextResponse.next()
  }

  // Everyone else — Clerk auth is enough here.
  // Subscription check happens in the dashboard layout (not Edge-compatible here).
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
