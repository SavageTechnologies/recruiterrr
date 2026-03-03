import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

const BYPASS_DOMAINS = ['hfgagents.com', 'amhomelife.com', 'unlinsurance.com']

function isBypassEmail(email: string) {
  return BYPASS_DOMAINS.some(domain => email.toLowerCase().trim().endsWith(`@${domain}`))
}

// Polled by /dashboard/activate to check if the Stripe webhook has
// written plan='pro' to the users table after signup.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ active: false })

  // Bypass domain users skip Stripe entirely — let them straight through
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''
  if (isBypassEmail(email)) return NextResponse.json({ active: true })

  const { data } = await supabase
    .from('users')
    .select('plan, subscription_status')
    .eq('clerk_id', userId)
    .single()

  const active = data?.plan === 'pro' && data?.subscription_status === 'active'
  return NextResponse.json({ active })
}
