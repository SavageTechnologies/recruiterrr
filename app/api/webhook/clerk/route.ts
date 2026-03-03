import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { Redis } from '@upstash/redis'
import { supabase } from '@/lib/supabase.server'

const BYPASS_DOMAINS = ['hfgagents.com', 'amhomelife.com', 'unlinsurance.com']

function isBypassEmail(email: string) {
  return BYPASS_DOMAINS.some(domain => email.toLowerCase().trim().endsWith(`@${domain}`))
}

export async function POST(req: NextRequest) {
  const redis = Redis.fromEnv()
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'No webhook secret' }, { status: 500 })
  }

  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()

  let event: any
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventKey = `webhook:${svix_id}`
  try {
    const already = await redis.get(eventKey)
    if (already) return NextResponse.json({ received: true })
    await redis.set(eventKey, '1', { ex: 1800 })
  } catch (err) {
    console.error('[webhook] Redis dedup error:', err)
  }

  const { type, data } = event

  if (type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address || null
    const bypass = email && isBypassEmail(email)

    try {
      // UPSERT on email — if Stripe webhook already created this row, merges in
      // clerk_id without clobbering plan/subscription fields.
      // Bypass domain users get plan='pro' automatically since they skip Stripe.
      await supabase.from('users').upsert({
        clerk_id:   data.id,
        email,
        first_name: data.first_name || null,
        last_name:  data.last_name  || null,
        ...(bypass && {
          plan:                'pro',
          subscription_status: 'active',
        }),
      }, { onConflict: 'email', ignoreDuplicates: false })
    } catch (err) {
      console.error('[webhook] user.created upsert error:', err)
    }
  }

  if (type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address || null

    try {
      await supabase.from('users').update({
        email,
        first_name: data.first_name || null,
        last_name:  data.last_name  || null,
      }).eq('clerk_id', data.id)
    } catch (err) {
      console.error('[webhook] user.updated error:', err)
    }
  }

  if (type === 'user.deleted') {
    try {
      await supabase.from('searches').delete().eq('clerk_id', data.id)
      await supabase.from('users').delete().eq('clerk_id', data.id)
    } catch (err) {
      console.error('[webhook] user.deleted cleanup error:', err)
    }
  }

  return NextResponse.json({ received: true })
}
