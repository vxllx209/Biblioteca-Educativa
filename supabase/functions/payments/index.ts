// Stripe Checkout for the Premium plans. Actions:
//   checkout — creates a Checkout Session (subscription) and returns its URL.
//   confirm  — called by the thank-you page: verifies the session with Stripe and activates the plan.
//   cancel   — cancels the subscription and returns the user to the free plan.
// Deploy: supabase functions deploy payments
// Secret:  supabase secrets set STRIPE_SECRET_KEY=sk_test_...
import { createClient } from 'npm:@supabase/supabase-js@2'
import { activateFromSession, admin, CURRENCY, isPaidPlan, PLANS, stripe, stripeClient } from '../_shared/billing.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

/** Where Stripe sends the user back: APP_URL if set, otherwise the origin of the request. */
function appOrigin(req: Request, fromBody: unknown) {
  const configured = Deno.env.get('APP_URL')
  if (configured) return configured.replace(/\/$/, '')
  const candidate = typeof fromBody === 'string' ? fromBody : req.headers.get('origin') ?? ''
  try {
    const url = new URL(candidate)
    if (url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1') return url.origin
  } catch {
    /* fall through */
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  if (!stripeClient) return json({ error: 'Falta configurar STRIPE_SECRET_KEY', code: 'not_configured' }, 503)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ code: 'auth' }, 401)
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return json({ code: 'auth' }, 401)

  const body = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>

  try {
    if (body.action === 'checkout') {
      if (!isPaidPlan(body.planId)) return json({ code: 'bad_request' }, 400)
      const origin = appOrigin(req, body.origin)
      if (!origin) return json({ code: 'bad_request' }, 400)
      const plan = PLANS[body.planId]
      const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle()

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        client_reference_id: user.id,
        ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: user.email }),
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: CURRENCY,
              unit_amount: plan.amount,
              recurring: { interval: plan.interval },
              product_data: { name: plan.name },
            },
          },
        ],
        metadata: { plan: body.planId },
        subscription_data: { metadata: { plan: body.planId, user_id: user.id } },
        locale: 'es',
        success_url: `${origin}/premium/gracias?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/premium?pago=cancelado`,
      })
      return json({ url: session.url })
    }

    if (body.action === 'confirm') {
      if (typeof body.sessionId !== 'string' || !body.sessionId.startsWith('cs_')) return json({ code: 'bad_request' }, 400)
      const session = await stripe.checkout.sessions.retrieve(body.sessionId)
      if (session.client_reference_id !== user.id) return json({ code: 'not_found' }, 404)
      if (session.status !== 'complete') return json({ code: 'pending' }, 409)
      const { plan } = await activateFromSession(session)
      return json({
        plan,
        amount: session.amount_total,
        currency: session.currency,
        email: session.customer_details?.email ?? user.email,
        reference: session.id.slice(-10).toUpperCase(),
        createdAt: new Date(session.created * 1000).toISOString(),
        testMode: !session.livemode,
      })
    }

    if (body.action === 'cancel') {
      const { data: profile } = await admin.from('profiles').select('stripe_subscription_id').eq('id', user.id).maybeSingle()
      if (profile?.stripe_subscription_id) await stripe.subscriptions.cancel(profile.stripe_subscription_id).catch(() => undefined)
      const { error } = await admin.from('profiles').update({ plan: 'free', stripe_subscription_id: null }).eq('id', user.id)
      if (error) throw error
      return json({ plan: 'free' })
    }

    return json({ code: 'bad_request' }, 400)
  } catch (err) {
    console.error(err)
    return json({ code: 'unavailable' }, 502)
  }
})
