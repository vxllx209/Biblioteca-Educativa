import { CircleAlert, CircleCheck, CircleDashed, Moon, type LucideIcon } from 'lucide-react'
import { ENGAGEMENT_LABEL, type Engagement } from '../../data/insights'
import { cn } from '../../lib/format'
import { t } from '../../i18n'

export const ENGAGEMENT_STYLE: Record<Engagement, { cls: string; icon: LucideIcon; order: number }> = {
  inactivo: { cls: 'bg-error-soft text-error', icon: Moon, order: 0 },
  'sin-actividad': { cls: 'bg-bg2 text-muted', icon: CircleDashed, order: 1 },
  'en-riesgo': { cls: 'bg-warning-soft text-warning', icon: CircleAlert, order: 2 },
  activo: { cls: 'bg-success-soft text-success', icon: CircleCheck, order: 3 },
}

export function EngagementBadge({ engagement }: { engagement: Engagement }) {
  const { cls, icon: Icon } = ENGAGEMENT_STYLE[engagement]
  return (
    <span className={cn('badge shrink-0 gap-1', cls)}>
      <Icon className="size-3.5" aria-hidden />
      {t(ENGAGEMENT_LABEL[engagement])}
    </span>
  )
}

export function lastActiveLabel(days: number | null) {
  if (days === null) return t('Nunca')
  if (days === 0) return t('Hoy')
  if (days === 1) return t('Ayer')
  return t('Hace {n} días', { n: days })
}

export function MemberAvatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold text-white', size === 'lg' ? 'size-12 text-base' : 'size-9 text-xs')}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}
