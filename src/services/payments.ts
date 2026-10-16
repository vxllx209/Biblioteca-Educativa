import { supabase } from '../lib/supabase'
import type { Plan, PlanId } from '../types'
import { t } from '../i18n'

/**
 * Premium payments.
 * - With Supabase: Stripe Checkout through the `payments` Edge Function. The plan is only
 *   activated on the server, after Stripe confirms the payment (thank-you page or webhook).
 * - Local mode: a simulated purchase, so the whole flow can be tried without a backend.
 */
export const paymentsMode: 'stripe' | 'demo' = supabase ? 'stripe' : 'demo'

/** Stripe's test card: any future expiry date and any CVC. */
export const TEST_CARD = '4242 4242 4242 4242'

export interface Receipt {
  plan: PlanId
  /** In the currency's smallest unit (cents). */
  amount: number
  currency: string
  email: string
  reference: string
  createdAt: string
  testMode: boolean
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase!.functions.invoke<T>('payments', { body })
  if (error) {
    const res = await (error as { context?: Response }).context?.json?.().catch(() => null)
    throw new Error(
      res?.code === 'NOT_FOUND' || res?.code === 'not_configured'
        ? t('Los pagos aún no están activados en el servidor.')
        : res?.code === 'pending'
        ? t('Stripe todavía está procesando el pago. Espera unos segundos e inténtalo de nuevo.')
        : res?.code === 'auth'
          ? t('Tu sesión expiró. Inicia sesión de nuevo.')
          : t('No pudimos conectar con la pasarela de pago. Inténtalo de nuevo.'),
    )
  }
  if (!data) throw new Error(t('No pudimos conectar con la pasarela de pago. Inténtalo de nuevo.'))
  return data
}

/** Stripe mode: redirects to Stripe Checkout (never returns). Demo mode: returns the simulated receipt. */
export async function startCheckout(plan: Plan, email: string): Promise<Receipt | null> {
  if (paymentsMode === 'stripe') {
    const { url } = await call<{ url: string }>({ action: 'checkout', planId: plan.id, origin: window.location.origin })
    window.location.assign(url)
    return null
  }
  await new Promise((r) => setTimeout(r, 1200))
  return {
    plan: plan.id,
    amount: Math.round(plan.price * 100),
    currency: 'usd',
    email,
    reference: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    testMode: true,
  }
}

/** Verifies a finished Checkout Session with Stripe and activates the plan on the server. */
export const confirmCheckout = (sessionId: string) => call<Receipt>({ action: 'confirm', sessionId })

/** Back to the free plan: cancels the Stripe subscription. */
export async function cancelSubscription() {
  if (paymentsMode === 'stripe') await call<{ plan: 'free' }>({ action: 'cancel' })
}

export const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)
