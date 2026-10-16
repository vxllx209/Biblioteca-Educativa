// Shared by the `payments` and `stripe-webhook` functions.
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const secret = Deno.env.get('STRIPE_SECRET_KEY')

/** Null until STRIPE_SECRET_KEY is set; the functions then answer `not_configured`. */
export const stripeClient = secret ? new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() }) : null
export const stripe = stripeClient!

/** Service-role client: the only one allowed to change profiles.plan. */
export const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

export type PaidPlan = 'monthly' | 'annual'

/** Keep in step with PLANS in src/data/mock.ts (prices in USD cents). */
export const PLANS: Record<PaidPlan, { name: string; amount: number; interval: 'month' | 'year' }> = {
  monthly: { name: 'Biblioteca Educativa · Plan Mensual', amount: 999, interval: 'month' },
  annual: { name: 'Biblioteca Educativa · Plan Anual', amount: 9999, interval: 'year' },
}
export const CURRENCY = 'usd'

export const isPaidPlan = (v: unknown): v is PaidPlan => v === 'monthly' || v === 'annual'

/**
 * Activates the plan bought in a completed Checkout Session and stores the receipt.
 * Idempotent: the thank-you page and the webhook can both call it.
 */
export async function activateFromSession(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id
  const plan = session.metadata?.plan
  if (!userId || !isPaidPlan(plan)) throw new Error('Session without user or plan')
  if (session.status !== 'complete' || (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required'))
    throw new Error('Session not paid')

  const subscription = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id

  const { error: profileError } = await admin
    .from('profiles')
    .update({ plan, stripe_customer_id: customer ?? null, stripe_subscription_id: subscription ?? null })
    .eq('id', userId)
  if (profileError) throw profileError

  const { error: paymentError } = await admin.from('payments').upsert(
    {
      user_id: userId,
      plan,
      amount: session.amount_total ?? PLANS[plan].amount,
      currency: session.currency ?? CURRENCY,
      stripe_session_id: session.id,
    },
    { onConflict: 'stripe_session_id', ignoreDuplicates: true },
  )
  if (paymentError) throw paymentError
  return { userId, plan }
}
