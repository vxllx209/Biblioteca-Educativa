import { Check, Minus } from 'lucide-react'
import { cn, formatPrice } from '../lib/format'
import type { Plan } from '../types'

interface Props {
  plan: Plan
  current: boolean
  onChoose: (plan: Plan) => void
  loading?: boolean
}

export function PremiumPlan({ plan, current, onChoose, loading }: Props) {
  return (
    <article
      className={cn(
        'relative flex flex-col rounded-[18px] border bg-surface p-6 shadow-card transition-all duration-200 sm:p-7',
        plan.recommended ? 'border-2 border-primary dark:border-secondary' : 'border-line',
      )}
      aria-label={`Plan ${plan.name}`}
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">Recomendado</span>
      )}
      <h3 className="text-lg font-semibold text-text">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted">{plan.description}</p>
      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-text">{formatPrice(plan.price)}</span>
        {plan.period && <span className="text-sm font-medium text-muted">/ {plan.period}</span>}
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f.label} className={cn('flex items-center gap-3 text-sm', f.included ? 'text-text' : 'text-disabled')}>
            <span
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full',
                f.included ? 'bg-soft text-accent' : 'bg-bg2 text-disabled',
              )}
              aria-hidden
            >
              {f.included ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
            </span>
            <span>
              {f.label}
              {!f.included && <span className="sr-only"> (no incluido)</span>}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onChoose(plan)}
        disabled={current || loading}
        className={cn('mt-8 w-full', current ? 'btn-secondary' : plan.recommended ? 'btn-primary' : 'btn-outline')}
      >
        {current ? 'Plan actual' : loading ? 'Procesando…' : 'Elegir plan'}
      </button>
    </article>
  )
}
