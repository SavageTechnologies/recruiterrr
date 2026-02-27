import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase.server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook/stripe] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Payment succeeded — subscription created ─────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId     = session.customer as string
        const subscriptionId = session.subscription as string
        const email          = session.customer_email || session.metadata?.email || ''

        // Retrieve subscription to get period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const item = subscription.items.data[0]
        const periodEnd = new Date((item as any).current_period_end * 1000).toISOString()

        if (email) {
          await supabase
            .from('users')
            .update({
              stripe_customer_id:     customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status:    'active',
              plan:                   'pro',
              current_period_end:     periodEnd,
            })
            .eq('email', email)
        }

        console.log(`[webhook/stripe] checkout.completed — ${email} -> pro`)
        break
      }

      // ── Subscription updated (renewal, plan change, etc) ─────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const item = subscription.items.data[0]
        const periodEnd = new Date((item as any).current_period_end * 1000).toISOString()

        await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            current_period_end:  periodEnd,
            plan: subscription.status === 'active' ? 'pro' : 'free',
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`[webhook/stripe] subscription.updated — ${subscription.id} -> ${subscription.status}`)
        break
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('users')
          .update({
            subscription_status:    'canceled',
            plan:                   'free',
            stripe_subscription_id: null,
            current_period_end:     null,
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`[webhook/stripe] subscription.deleted — ${subscription.id}`)
        break
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          (invoice as any).subscription ??
          (invoice.parent as any)?.subscription_details?.subscription_id ??
          null

        if (subscriptionId) {
          await supabase
            .from('users')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId)

          console.log(`[webhook/stripe] payment.failed — ${subscriptionId} -> past_due`)
        }
        break
      }
    }
  } catch (err) {
    console.error('[webhook/stripe] handler error:', err)
  }

  return NextResponse.json({ received: true })
}
