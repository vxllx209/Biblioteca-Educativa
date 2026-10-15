import { Check, Minus } from 'lucide-react'
import { cn, formatPrice } from '../lib/format'
import type { Plan } from '../types'
import { t } from '../i18n'

interface Props {
  plan: Plan
  current: boolean
  onChoose: (plan: Plan) => void
  loading?: boolean
}

export function PremiumPlan({ plan, current, onChoose, loading }: Props) {
  const featured = !!plan.recommended
  return (
    <article
      className={cn(
        'relative flex flex-col rounded-feature p-6 transition-all duration-300 sm:p-8',
        featured ? 'forest-panel !overflow-visible shadow-lift lg:-translate-y-3' : 'card card-hover',
      )}
      aria-label={t('Plan {name}', { name: t(plan.name) })}
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-br from-gold to-[#a8732f] px-3 py-1 text-xs font-semibold text-[#1f1607] shadow-[0_8px_18px_-8px_rgba(193,138,69,0.9)]">{t('Recomendado')}</span>
      )}
      <h3 className={cn('font-display text-xl', featured ? 'text-white' : 'text-text')}>{t(plan.name)}</h3>
      <p className={cn('mt-1 text-sm', featured ? 'text-mint/70' : 'text-muted')}>{t(plan.description)}</p>
      <p className="mt-6 flex items-baseline gap-1.5">
        <span className={cn('font-display text-[44px] leading-none', featured ? 'text-white' : 'text-text')}>{formatPrice(plan.price)}</span>
        {plan.period && <span className={cn('text-sm font-medium', featured ? 'text-mint/70' : 'text-muted')}>/ {t(plan.period)}</span>}
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f.label} className={cn('flex items-center gap-3 text-sm', f.included ? (featured ? 'text-white' : 'text-text') : featured ? 'text-mint/40' : 'text-disabled')}>
            <span
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full',
                f.included ? (featured ? 'bg-gold/20 text-gold' : 'bg-soft text-accent') : featured ? 'bg-white/5 text-mint/40' : 'bg-bg2 text-disabled',
              )}
              aria-hidden
            >
              {f.included ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
            </span>
            <span>
              {t(f.label)}
              {!f.included && <span className="sr-only"> {t('(no incluido)')}</span>}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onChoose(plan)}
        disabled={current || loading}
        className={cn('mt-8 w-full', current ? 'btn-secondary' : featured ? 'btn-gold' : 'btn-outline')}
      >
        {current ? t('Plan actual') : loading ? t('Procesando…') : t('Elegir plan')}
      </button>
    </article>
  )
}
