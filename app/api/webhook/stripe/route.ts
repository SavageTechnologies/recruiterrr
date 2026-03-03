import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase.server'

export async function POST(req: NextRequest) {
  // Initialize inside handler so env vars are available at runtime not build time
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

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

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId     = session.customer as string
        const subscriptionId = session.subscription as string
        const email          = session.customer_email || session.metadata?.email || ''

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        console.log('[webhook/stripe] subscription keys:', JSON.stringify(Object.keys(subscription)))
        console.log('[webhook/stripe] subscription.items.data[0] keys:', JSON.stringify(Object.keys(subscription.items?.data?.[0] ?? {})))
        // In API version 2026-01-28.clover, current_period_end moved to items
        const rawPeriodEnd = (subscription as any).current_period_end
          ?? (subscription.items?.data?.[0] as any)?.current_period_end
          ?? null
        const periodEnd = rawPeriodEnd
          ? new Date(rawPeriodEnd * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        if (email) {
          // UPSERT on email — handles the race condition where Stripe webhook fires
          // before the user has created their Clerk account. If the row doesn't exist
          // yet, this creates it with payment data. When Clerk's user.created fires
          // later, it will merge in the clerk_id without clobbering Stripe fields.
          const { error } = await supabase
            .from('users')
            .upsert({
              email,
              stripe_customer_id:     customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status:    'active',
              plan:                   'pro',
              current_period_end:     periodEnd,
            }, { onConflict: 'email' })

          if (error) console.error('[webhook/stripe] upsert error:', error)
        }

        console.log(`[webhook/stripe] checkout.completed — ${email} -> pro`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const rawPeriodEnd = (subscription as any).current_period_end
          ?? (subscription.items?.data?.[0] as any)?.current_period_end
          ?? null
        const periodEnd = rawPeriodEnd
          ? new Date(rawPeriodEnd * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

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
