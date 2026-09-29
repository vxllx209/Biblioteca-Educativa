import type { Plan, PlanId } from '../types'

/**
 * Payment gateway abstraction, ready for a future Stripe integration.
 *
 * To go live: create a backend endpoint that calls `stripe.checkout.sessions.create`
 * with `plan.stripePriceId`, return the session URL and redirect to it here.
 * Until a backend exists, `simulateCheckout` activates the plan locally.
 */
export interface CheckoutResult {
  ok: boolean
  planId: PlanId
  reference: string
}

export const PAYMENTS_BACKEND_URL: string | null = import.meta.env.VITE_PAYMENTS_URL ?? null

export async function startCheckout(plan: Plan, userEmail: string): Promise<CheckoutResult> {
  if (PAYMENTS_BACKEND_URL && plan.stripePriceId) {
    const res = await fetch(`${PAYMENTS_BACKEND_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: plan.stripePriceId, email: userEmail }),
    })
    if (!res.ok) throw new Error('No se pudo iniciar el pago')
    const { url } = (await res.json()) as { url: string }
    window.location.assign(url)
    return { ok: true, planId: plan.id, reference: 'redirect' }
  }
  return simulateCheckout(plan)
}

async function simulateCheckout(plan: Plan): Promise<CheckoutResult> {
  await new Promise((r) => setTimeout(r, 900))
  return { ok: true, planId: plan.id, reference: `sim_${Date.now().toString(36)}` }
}
