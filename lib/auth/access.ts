// ─── ACCESS CONTROL ────────────────────────────────────────────────────────────
// Single source of truth for privileged user IDs.
//
// To add a user: paste their Clerk user ID below with a comment identifying them.
// Find IDs in: Clerk dashboard → Users → click user → copy ID from the header.
//
// To add without a redeploy: set ADMIN_IDS or COMPED_IDS as comma-separated
// env vars and they'll be merged with the hardcoded list below.

function idsFromEnv(key: string): string[] {
  return (process.env[key] ?? '').split(',').map(s => s.trim()).filter(Boolean)
}

// ADMINS — full access, bypasses Stripe and all feature gates
export const ADMIN_IDS = new Set([
  'user_3A96smOMHMC9L7fO8cGG6OmpHkV', // Aaron
  ...idsFromEnv('ADMIN_IDS'),
])

// COMPED — free dashboard access, no Stripe required
export const COMPED_IDS = new Set([
  'user_3AAZKXJCBWeaThUCwKpX6MPzz7I', // Drew
  ...idsFromEnv('COMPED_IDS'),
])

export const isAdmin       = (userId: string) => ADMIN_IDS.has(userId)
export const isComped      = (userId: string) => COMPED_IDS.has(userId)
export const hasFullAccess = (userId: string) => isAdmin(userId) || isComped(userId)

// Subscriber check — for use in API route handlers only (does a DB lookup)
import { getSupabase } from '@/lib/supabase.server'

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (isAdmin(userId)) return true
  if (isComped(userId)) return true
  const { data } = await getSupabase()
    .from('users')
    .select('plan, subscription_status')
    .eq('clerk_id', userId)
    .single()
  return data?.plan === 'pro' && data?.subscription_status === 'active'
}
