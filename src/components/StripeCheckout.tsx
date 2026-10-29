import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { useCallback, useRef, useState } from 'react'
import { createEmbeddedCheckout, loadStripeJs } from '../services/payments'
import type { Plan } from '../types'
import { t } from '../i18n'

interface StripeCheckoutProps {
  plan: Plan
  /** Called with the Checkout Session id once Stripe accepts the payment. */
  onPaid: (sessionId: string) => void
}

/** Stripe's card form (Embedded Checkout), shown inside the app. */
export function StripeCheckout({ plan, onPaid }: StripeCheckoutProps) {
  const sessionId = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(
    () =>
      createEmbeddedCheckout(plan).then(
        (res) => {
          sessionId.current = res.sessionId
          return res.clientSecret
        },
        (e: Error) => {
          setError(e.message)
          throw e
        },
      ),
    [plan],
  )
  const onComplete = useCallback(() => sessionId.current && onPaid(sessionId.current), [onPaid])

  if (error) return <p className="rounded-[14px] bg-error-soft p-4 text-sm text-error">{error}</p>
  return (
    <div className="min-h-[420px] overflow-hidden rounded-[14px] bg-white" aria-label={t('Formulario de pago')}>
      <EmbeddedCheckoutProvider stripe={loadStripeJs()} options={{ fetchClientSecret, onComplete }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
