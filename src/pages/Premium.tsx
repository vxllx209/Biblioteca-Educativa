import { BookOpen, Crown, Download, Headphones, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { PremiumPlan } from '../components/PremiumPlan'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PLANS } from '../data/mock'
import { formatPrice } from '../lib/format'
import { PAYMENTS_BACKEND_URL, startCheckout } from '../services/payments'
import type { Plan } from '../types'

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
  if (!user) return null

  const confirm = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      const res = await startCheckout(selected, user.email)
      if (res.ok && res.reference !== 'redirect') {
        setPlan(selected.id)
        toast(selected.id === 'free' ? 'Cambiaste al plan Gratis' : `¡Bienvenido a Premium! Plan ${selected.name} activo`)
        setSelected(null)
      }
    } catch (e) {
      toast((e as Error).message || 'No se pudo completar el pago', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Premium" back />

      <section className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-[18px] bg-soft text-accent">
          <Crown className="size-8" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-6 text-[26px] leading-tight font-bold tracking-tight text-text sm:text-4xl">Desbloquea todo el potencial</h2>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Accede a contenido exclusivo, audiolibros y descargas ilimitadas. Aprende sin límites, a tu ritmo.
        </p>
      </section>

      <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3 rounded-[14px] bg-softer p-4">
            <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-text">{title}</span>
              <span className="block text-[13px] text-muted">{text}</span>
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
        Pagos seguros. Cancela cuando quieras desde tu perfil.
      </p>

      <Modal
        open={!!selected}
        onClose={() => !processing && setSelected(null)}
        title={selected?.id === 'free' ? 'Cambiar a plan Gratis' : `Confirmar plan ${selected?.name ?? ''}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSelected(null)} disabled={processing}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={confirm} disabled={processing} aria-busy={processing}>
              {processing ? 'Procesando…' : selected?.id === 'free' ? 'Cambiar plan' : 'Confirmar y pagar'}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[14px] bg-softer p-4">
              <span className="font-medium text-text">Plan {selected.name}</span>
              <span className="font-bold text-accent">
                {formatPrice(selected.price)}
                {selected.period && <span className="text-sm font-medium text-muted"> / {selected.period}</span>}
              </span>
            </div>
            <p className="text-sm text-muted">
              {selected.id === 'free'
                ? 'Perderás el acceso a audiolibros completos, contenido premium y descargas ilimitadas.'
                : PAYMENTS_BACKEND_URL
                  ? 'Serás redirigido a la pasarela de pago segura para completar la compra.'
                  : 'Modo demostración: no se realizará ningún cobro real. El plan se activará de inmediato.'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
