import { cn } from '../lib/format'
import { t } from '../i18n'

interface Props {
  value: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md'
  className?: string
  tone?: 'primary' | 'success'
}

export function ProgressBar({ value, label, showValue = false, size = 'sm', className, tone = 'primary' }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn('flex-1 overflow-hidden rounded-full bg-soft', size === 'sm' ? 'h-1.5' : 'h-2.5')}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? t('Progreso')}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-300 ease-out',
            tone === 'success' ? 'bg-gradient-to-r from-success/70 to-success' : 'bg-gradient-to-r from-secondary to-primary dark:from-secondary dark:to-mint',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showValue && <span className="w-10 text-right text-xs font-semibold text-accent tabular-nums">{pct}%</span>}
    </div>
  )
}
