import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

// ─── BYPASS LISTS ─────────────────────────────────────────────────────────────
// ADMINS — full access, bypasses everything
const ADMIN_IDS = new Set([
  'user_3A96smOMHMC9L7fO8cGG6OmpHkV', // Aaron
])

// COMPED — free dashboard access, no Stripe required
const COMPED_IDS = new Set([
  'user_3AAZKXJCBWeaThUCwKpX6MPzz7I', // Drew
])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return NextResponse.next()

  // Must be logged in
  const { userId } = await auth.protect()

  // Admins and comped users — pass straight through
  if (ADMIN_IDS.has(userId) || COMPED_IDS.has(userId)) {
    return NextResponse.next()
  }

  // Everyone else — Clerk auth is enough here.
  // Subscription check happens in the dashboard layout (not Edge-compatible here).
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Run middleware on all routes EXCEPT static files, _next internals, and API routes.
    // API routes handle their own auth via Clerk's auth() helper — they do NOT need
    // middleware, and including them caused Edge runtime bundling to pull in Node-only
    // dependencies (Anthropic SDK) into the Edge bundle, crashing on startup.
    '/((?!.*\\..*|_next|api).*)',
    '/',
  ],
}
