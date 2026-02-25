import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'No webhook secret' }, { status: 500 })
  }

  // Get headers
  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()

  // Verify webhook signature
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

  const { type, data } = event

  if (type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address || null

    await supabase.from('users').upsert({
      clerk_id: data.id,
      email,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
    }, { onConflict: 'clerk_id' })
  }

  if (type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address || null

    await supabase.from('users').update({
      email,
      first_name: data.first_name || null,
      last_name: data.last_name || null,
    }).eq('clerk_id', data.id)
  }

  return NextResponse.json({ received: true })
}