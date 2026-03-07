import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { ALLOWED_ORIGINS } from '@/lib/config'

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Initialize inside handler so env vars are available at runtime not build time
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

  try {
    const { email } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email || undefined,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${origin}/sign-up?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/sign-up?checkout=cancelled`,
      metadata: { email: email || '' },
      subscription_data: { metadata: { email: email || '' } },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[/api/stripe/checkout] error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
