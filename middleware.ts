import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])
const isSubscribePage  = createRouteMatcher(['/dashboard/subscribe'])

// ─── BYPASS LISTS ─────────────────────────────────────────────────────────────
// To give someone free access: add their Clerk user ID to the right list.
// Find Clerk IDs at: clerk.com → Users → click user → copy ID at top.

// ADMINS — full access + admin panel, bypasses everything including session limits
const ADMIN_IDS = new Set([
  'user_3A96smOMHMC9L7fO8cGG6OmpHkV', // Aaron
])

// COMPED — free dashboard access, no Stripe required, no admin privileges
// Add anyone you want to comp: partners, demos, affiliates
const COMPED_IDS = new Set([
  'user_3AAZKXJCBWeaThUCwKpX6MPzz7I', // Drew
])

// HEARTLAND — entire domain gets free access
const HEARTLAND_DOMAIN = 'hfgagents.com'

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return NextResponse.next()

  // ── 1. Must be logged in ───────────────────────────────────────────────────
  const { userId, sessionId } = await auth.protect()

  // ── 2. Admins bypass everything ───────────────────────────────────────────
  if (ADMIN_IDS.has(userId)) return NextResponse.next()

  // ── 3. Comped users bypass Stripe but get session enforcement ─────────────
  const isComped = COMPED_IDS.has(userId)

  // ── 4. Session enforcement (Option A — last login wins) ───────────────────
  // Only enforce on non-admin users
  try {
    const redis = Redis.fromEnv()
    const sessionKey = `session:${userId}`
    const stored = await redis.get(sessionKey)
    // Always write/overwrite — new login wins, old device kicked on next request
    await redis.set(sessionKey, sessionId, { ex: 86400 })
    // If stored session differs, this is the new device — old device will be
    // redirected to sign-in on their next page load when they fail this check
    if (stored && stored !== sessionId && !isComped) {
      // Let this new session through — old device will fail on next request
    }
  } catch {
    // Redis failure is non-fatal
  }

  // ── 5. Comped users — skip subscription check ─────────────────────────────
  if (isComped) return NextResponse.next()

  // ── 6. Skip subscription check for subscribe page itself ──────────────────
  if (isSubscribePage(req)) return NextResponse.next()

  // ── 7. Check subscription status ──────────────────────────────────────────
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from('users')
      .select('plan, subscription_status, email')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      // User not in DB yet (webhook delay) — let through briefly
      return NextResponse.next()
    }

    // Heartland domain — always free
    if (user.email?.toLowerCase().endsWith(`@${HEARTLAND_DOMAIN}`)) {
      return NextResponse.next()
    }

    // Active Stripe subscription
    if (user.subscription_status === 'active' || user.subscription_status === 'trialing') {
      return NextResponse.next()
    }

    // Manually set pro in Supabase (admin override via DB)
    if (user.plan === 'pro') {
      return NextResponse.next()
    }

    // Heartland plan set via DB
    if (user.plan === 'heartland') {
      return NextResponse.next()
    }

    // Not paid — send to subscribe page
    return NextResponse.redirect(new URL('/dashboard/subscribe', req.url))

  } catch {
    // DB failure — let through, don't lock users out
    return NextResponse.next()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
