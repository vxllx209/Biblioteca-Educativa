import { BookOpen, Copy, CreditCard, Crown, Download, Headphones, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { PremiumPlan } from '../components/PremiumPlan'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PLANS } from '../data/mock'
import { formatPrice } from '../lib/format'
import { cancelSubscription, paymentsMode, startCheckout, TEST_CARD } from '../services/payments'
import type { Plan } from '../types'
import { t } from '../i18n'

const HIGHLIGHTS = [
  { icon: BookOpen, title: 'Lectura sin límites', text: 'Todo el catálogo, incluidos los títulos exclusivos.' },
  { icon: Headphones, title: 'Audiolibros completos', text: 'Escucha mientras viajas o repasas.' },
  { icon: Download, title: 'Descargas ilimitadas', text: 'Lee sin conexión en cualquier lugar.' },
]

export default function Premium() {
  const { user, setPlan } = useAuth()
  const toast = useToast()
  const [selected, setSelected] = useState<Plan | null>(null)
  const [processing, setProcessing] = useState(false)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // Back from Stripe without paying.
  useEffect(() => {
    if (params.get('pago') !== 'cancelado') return
    toast(t('Cancelaste el pago. No se hizo ningún cobro.'), 'info')
    setParams({}, { replace: true })
  }, [params, setParams, toast])

  if (!user) return null

  const confirm = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      if (selected.id === 'free') {
        await cancelSubscription()
        setPlan('free')
        toast(t('Cambiaste al plan Gratis'))
        setSelected(null)
        setProcessing(false)
        return
      }
      // Stripe redirects away; demo mode returns a simulated receipt.
      const receipt = await startCheckout(selected, user.email)
      if (receipt) {
        setPlan(selected.id)
        navigate('/premium/gracias', { state: { receipt } })
      }
    } catch (e) {
      toast((e as Error).message || t('No se pudo completar el pago'), 'error')
      setProcessing(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Premium" back />

      <section className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-gold to-[#a8732f] text-[#1f1607] shadow-[0_14px_30px_-10px_rgba(193,138,69,0.9)]">
          <Crown className="size-8" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-6 font-display text-[30px] leading-[1.1] text-text sm:text-[44px]">{t('Desbloquea todo el potencial')}</h2>
        <p className="mt-3 text-base text-muted sm:text-lg">
          {t('Accede a contenido exclusivo, audiolibros y descargas ilimitadas. Aprende sin límites, a tu ritmo.')}
        </p>
      </section>

      <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="card flex items-start gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-soft text-accent">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-text">{t(title)}</span>
              <span className="block text-[13px] text-muted">{t(text)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3 md:gap-5 lg:gap-6">
        {PLANS.map((plan) => (
          <PremiumPlan key={plan.id} plan={plan} current={user.plan === plan.id} onChoose={setSelected} />
        ))}
      </div>

      <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 text-center text-xs text-muted">
        <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden />
        {t('Pagos seguros. Cancela cuando quieras desde tu perfil.')}
      </p>

      <Modal
        open={!!selected}
        onClose={() => !processing && setSelected(null)}
        title={selected?.id === 'free' ? t('Cambiar a plan Gratis') : t('Confirmar plan {name}', { name: t(selected?.name ?? '') })}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSelected(null)} disabled={processing}>
              {t('Cancelar')}
            </button>
            <button className="btn-primary" onClick={confirm} disabled={processing} aria-busy={processing}>
              {processing ? t('Procesando…') : selected?.id === 'free' ? t('Cambiar plan') : t('Confirmar y pagar')}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[14px] bg-softer p-4">
              <span className="font-medium text-text">{t('Plan {name}', { name: t(selected.name) })}</span>
              <span className="font-bold text-accent">
                {formatPrice(selected.price)}
                {selected.period && <span className="text-sm font-medium text-muted"> / {t(selected.period)}</span>}
              </span>
            </div>
            <p className="text-sm text-muted">
              {selected.id === 'free'
                ? t('Perderás el acceso a audiolibros completos, contenido premium y descargas ilimitadas.')
                : paymentsMode === 'stripe'
                  ? t('Te llevaremos a Stripe, la pasarela de pago segura, para completar la compra.')
                  : t('Modo demostración: no se realizará ningún cobro real. El plan se activará de inmediato.')}
            </p>
            {selected.id !== 'free' && paymentsMode === 'stripe' && (
              <div className="rounded-[14px] border border-dashed border-gold/60 bg-warning-soft/60 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-warning uppercase">
                  <CreditCard className="size-4" aria-hidden /> {t('Modo de prueba')}
                </p>
                <p className="mt-1.5 text-sm text-text">{t('No se cobra dinero real. Paga con la tarjeta de prueba de Stripe:')}</p>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard.writeText(TEST_CARD.replace(/ /g, '')).then(
                      () => toast(t('Número de tarjeta copiado')),
                      () => toast(TEST_CARD, 'info'),
                    )
                  }
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 font-mono text-[15px] tracking-wider text-text ring-1 ring-line hover:ring-line-active"
                  aria-label={t('Copiar número de tarjeta de prueba')}
                >
                  {TEST_CARD} <Copy className="size-4 text-muted" aria-hidden />
                </button>
                <p className="mt-2 text-xs text-muted">{t('Cualquier fecha futura, cualquier CVC y cualquier nombre.')}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
