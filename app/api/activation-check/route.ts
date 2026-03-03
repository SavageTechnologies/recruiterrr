import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase.server'

// Polled by /dashboard/activate to check if the Stripe webhook has
// written plan='pro' to the users table after signup.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ active: false })

  const { data } = await supabase
    .from('users')
    .select('plan, subscription_status')
    .eq('clerk_id', userId)
    .single()

  const active = data?.plan === 'pro' && data?.subscription_status === 'active'
  return NextResponse.json({ active })
}
