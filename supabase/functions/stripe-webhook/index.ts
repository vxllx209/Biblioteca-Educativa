// Stripe webhook: activates the plan even if the user closes the tab before the thank-you page,
// and returns the user to the free plan when the subscription ends.
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
// Secret:  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// Stripe:  Developers → Webhooks → endpoint https://<project>.supabase.co/functions/v1/stripe-webhook
//          events: checkout.session.completed, customer.subscription.deleted
import Stripe from 'npm:stripe@17'
import { activateFromSession, admin, stripe, stripeClient } from '../_shared/billing.ts'

const crypto = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  if (!stripeClient) return new Response('STRIPE_SECRET_KEY not configured', { status: 503 })
  const signature = req.headers.get('Stripe-Signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, crypto)
  } catch (err) {
    console.error('Invalid signature', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await activateFromSession(event.data.object)
        break
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await admin.from('profiles').update({ plan: 'free', stripe_subscription_id: null }).eq('stripe_subscription_id', sub.id)
        break
      }
    }
  } catch (err) {
    console.error(event.type, err)
    return new Response('Handler error', { status: 500 })
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
