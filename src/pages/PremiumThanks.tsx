import { ArrowRight, BookOpen, CircleAlert, Crown, Download, Headphones, House, PartyPopper } from 'lucide-react'
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { PLANS } from '../data/mock'
import { useAsync } from '../hooks/useAsync'
import { formatDate } from '../lib/format'
import { storage } from '../lib/storage'
import { confirmCheckout, formatAmount, type Receipt } from '../services/payments'
import { t } from '../i18n'

const UNLOCKED = [
  { icon: BookOpen, title: 'Lectura sin límites', text: 'Todo el catálogo, incluidos los títulos exclusivos.' },
  { icon: Headphones, title: 'Audiolibros completos', text: 'Escucha mientras viajas o repasas.' },
  { icon: Download, title: 'Descargas ilimitadas', text: 'Lee sin conexión en cualquier lugar.' },
]

const COLORS = ['var(--c-gold)', 'var(--c-primary)', 'var(--c-secondary)', 'var(--c-mint)', 'var(--c-sage)', '#e7c27d']

/** A burst of confetti that falls once (hidden with reduced motion). */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        color: COLORS[i % COLORS.length],
        style: {
          '--delay': `${(i % 14) * 0.09}s`,
          '--fall': `${2.6 + ((i * 13) % 10) / 6}s`,
          '--drift': `${((i * 53) % 160) - 80}px`,
          '--spin': `${360 + ((i * 97) % 540)}deg`,
        },
        round: i % 3 === 0,
      })),
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{ left: p.left, backgroundColor: p.color, borderRadius: p.round ? '999px' : undefined, ...(p.style as CSSProperties) }}
        />
      ))}
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-text">{value}</dd>
    </div>
  )
}

export default function PremiumThanks() {
  const { user, setPlan } = useAuth()
  const { addNotification } = useLibrary()
  const [params] = useSearchParams()
  const location = useLocation()
  const sessionId = params.get('session_id')
  const demoReceipt = (location.state as { receipt?: Receipt } | null)?.receipt

  const result = useAsync(async () => (demoReceipt ? demoReceipt : sessionId ? confirmCheckout(sessionId) : null), [sessionId])
  const receipt = result.data

  // Once confirmed: show the plan in the session and leave a notification (only once per purchase).
  const announced = useRef(false)
  useEffect(() => {
    if (!receipt || announced.current) return
    announced.current = true
    setPlan(receipt.plan)
    const key = `receipt.${receipt.reference}`
    if (storage.get(key, false)) return
    storage.set(key, true)
    addNotification({
      title: t('¡Gracias por tu compra!'),
      body: t('Tu plan {name} está activo. Disfruta todo el catálogo.', { name: t(PLANS.find((p) => p.id === receipt.plan)?.name ?? '') }),
      kind: 'system',
      link: '/explore',
    })
  }, [receipt, setPlan, addNotification])

  if (!sessionId && !demoReceipt) return <Navigate to="/premium" replace />

  if (result.loading)
    return (
      <div className="mx-auto mt-16 max-w-md text-center" role="status" aria-live="polite">
        <span className="mx-auto grid size-16 animate-pulse place-items-center rounded-2xl bg-soft text-accent">
          <Crown className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-2xl text-text">{t('Confirmando tu pago…')}</h1>
        <p className="mt-2 text-sm text-muted">{t('Estamos verificando la compra con Stripe. Esto toma solo unos segundos.')}</p>
      </div>
    )

  if (result.error || !receipt)
    return (
      <div className="card mx-auto mt-12 max-w-md p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-warning-soft text-warning">
          <CircleAlert className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-2xl text-text">{t('No pudimos confirmar tu pago')}</h1>
        <p className="mt-2 text-sm text-muted">{result.error ?? t('Vuelve a intentarlo en unos segundos.')}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="btn-primary" onClick={result.reload}>
            {t('Reintentar')}
          </button>
          <Link to="/premium" className="btn-secondary">
            {t('Volver a Premium')}
          </Link>
        </div>
      </div>
    )

  const plan = PLANS.find((p) => p.id === receipt.plan)

  return (
    <div className="relative mx-auto max-w-2xl animate-fade-in pb-6">
      <Confetti />

      <section className="text-center" aria-labelledby="thanks-title">
        <span className="animate-celebrate mx-auto grid size-20 place-items-center rounded-[26px] bg-gradient-to-br from-gold to-[#a8732f] text-[#1f1607] shadow-[0_18px_40px_-12px_rgba(193,138,69,0.9)]">
          <Crown className="size-10" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-secondary uppercase">
          <PartyPopper className="size-4" aria-hidden /> {t('Pago confirmado')}
        </p>
        <h1 id="thanks-title" className="mt-2 font-display text-[34px] leading-[1.08] text-text sm:text-5xl">
          {t('¡Muchas gracias por tu compra!')}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted sm:text-lg">
          {t('Tu plan {name} ya está activo, {first}. Ahora puedes leer, escuchar y descargar sin límites.', {
            name: t(plan?.name ?? ''),
            first: user?.firstName ?? '',
          })}
        </p>
      </section>

      <section className="card mt-9 overflow-hidden" aria-label={t('Comprobante')}>
        <div className="forest-panel flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <p className="font-display text-lg text-white">{t('Comprobante')}</p>
          {receipt.testMode && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-mint uppercase">
              {receipt.reference.startsWith('DEMO') ? t('Simulación') : t('Pago de prueba · Stripe')}
            </span>
          )}
        </div>
        <dl className="divide-y divide-line px-5 sm:px-6">
          <Row label={t('Plan')} value={t('Plan {name}', { name: t(plan?.name ?? '') })} />
          <Row
            label={t('Monto')}
            value={
              <>
                {formatAmount(receipt.amount, receipt.currency)}
                {plan?.period && <span className="font-normal text-muted"> / {t(plan.period)}</span>}
              </>
            }
          />
          <Row label={t('Fecha')} value={formatDate(receipt.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })} />
          <Row label={t('Correo')} value={receipt.email} />
          <Row label={t('N° de referencia')} value={<span className="font-mono tracking-wider">{receipt.reference}</span>} />
        </dl>
      </section>

      <section className="mt-8" aria-labelledby="unlocked-title">
        <h2 id="unlocked-title" className="mb-3 text-center text-sm font-semibold text-text">
          {t('Esto es lo que desbloqueaste')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {UNLOCKED.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="card flex animate-rise items-start gap-3 p-4" style={{ animationDelay: `${300 + i * 120}ms` }}>
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
      </section>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/explore" className="btn-primary justify-center">
          {t('Explorar el catálogo')} <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link to="/home" className="btn-secondary justify-center">
          <House className="size-4" aria-hidden /> {t('Ir al inicio')}
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-muted">{t('Puedes cambiar o cancelar tu plan cuando quieras desde Premium.')}</p>
    </div>
  )
}
