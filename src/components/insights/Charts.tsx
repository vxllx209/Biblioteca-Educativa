import { CircleAlert, CircleCheck, CircleDashed, CircleMinus, type LucideIcon } from 'lucide-react'
import { AREAS, MASTERY_LABEL, SKILLS, type MasteryLevel } from '../../data/paes'
import { cn } from '../../lib/format'
import type { PaesSkill } from '../../types'
import { locale, t } from '../../i18n'

/** Mastery is a status: color + icon + label, never color alone. */
const LEVEL_STYLE: Record<MasteryLevel, { bar: string; badge: string; icon: LucideIcon }> = {
  'sin-datos': { bar: 'bg-line-active', badge: 'bg-bg2 text-muted', icon: CircleDashed },
  inicial: { bar: 'bg-error', badge: 'bg-error-soft text-error', icon: CircleAlert },
  intermedio: { bar: 'bg-warning', badge: 'bg-warning-soft text-warning', icon: CircleMinus },
  avanzado: { bar: 'bg-success', badge: 'bg-success-soft text-success', icon: CircleCheck },
}

export function LevelBadge({ level, pct }: { level: MasteryLevel; pct: number | null }) {
  const { badge, icon: Icon } = LEVEL_STYLE[level]
  return (
    <span className={cn('badge shrink-0 gap-1', badge)}>
      <Icon className="size-3.5" aria-hidden />
      {pct === null ? t(MASTERY_LABEL[level]) : `${Math.round(pct * 100)}% · ${t(MASTERY_LABEL[level])}`}
    </span>
  )
}

interface DayBar {
  key: string
  date: Date
  value: number
}

/**
 * Vertical bars, one per day, single series (the title names it, so no legend).
 * Each bar is focusable and shows its value on hover or focus.
 */
export function DayBars({ days, max, format, height = 132, label }: { days: DayBar[]; max: number; format: (d: DayBar) => string; height?: number; label: string }) {
  const top = Math.max(max, 1)
  const today = days.at(-1)?.key
  const weekday = (d: Date) => d.toLocaleDateString(locale(), { weekday: 'narrow' })
  return (
    <div>
      <div className="relative flex gap-3">
        <div className="flex w-6 shrink-0 flex-col justify-between text-right text-[11px] text-muted tabular-nums" style={{ height }} aria-hidden>
          <span className="-translate-y-1/2">{top}</span>
          <span className="translate-y-1/2">0</span>
        </div>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line-active" aria-hidden />
          <ol className="relative flex items-end gap-[2px] sm:gap-1.5" style={{ height }} aria-label={label}>
            {days.map((d) => {
              const h = d.value ? Math.max(4, (d.value / top) * height) : 0
              return (
                <li key={d.key} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0} aria-label={format(d)}>
                  {/* Hit target is the whole column, wider and taller than the bar. */}
                  <span
                    className={cn(
                      'w-full max-w-7 rounded-t-[4px] transition-colors duration-150',
                      d.key === today ? 'bg-primary dark:bg-mint' : 'bg-secondary/80 group-hover:bg-primary group-focus-visible:bg-primary dark:group-hover:bg-mint',
                    )}
                    style={{ height: h }}
                  />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-44 -translate-x-1/2 rounded-lg bg-text px-2.5 py-1.5 text-center text-xs text-bg opacity-0 shadow-pop transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    {format(d)}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
      <ol className="mt-2 ml-9 flex gap-[2px] sm:gap-1.5" aria-hidden>
        {days.map((d) => (
          <li key={d.key} className={cn('flex-1 text-center text-[10px] uppercase', d.key === today ? 'font-bold text-text' : 'text-muted')}>
            {weekday(d.date)}
          </li>
        ))}
      </ol>
    </div>
  )
}

export interface SkillValue {
  pct: number | null
  level: MasteryLevel
}

/** Horizontal mastery bars grouped by PAES test. */
export function SkillBars({ values, note, highlight }: { values: Record<PaesSkill, SkillValue>; note: (skill: PaesSkill) => string; highlight?: PaesSkill | null }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {AREAS.map((area) => (
        <div key={area.id}>
          <p className="mb-3 text-xs font-semibold tracking-wide text-secondary uppercase">{t(area.title)}</p>
          <ul className="space-y-3.5">
            {area.skills.map((s) => {
              const v = values[s]
              const pct = v.pct === null ? 0 : Math.round(v.pct * 100)
              return (
                <li key={s}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className={cn('min-w-0 text-sm text-text', highlight === s ? 'font-semibold' : 'font-medium')}>{t(SKILLS[s].label)}</span>
                    <LevelBadge level={v.level} pct={v.pct} />
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-soft"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('Dominio de {skill}', { skill: t(SKILLS[s].label) })}
                  >
                    <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', LEVEL_STYLE[v.level].bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{note(s)}</p>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** A big number with its label: the headline of a metric that needs no chart. */
export function StatTile({ icon: Icon, value, label, hint, tone = 'default' }: { icon: LucideIcon; value: string; label: string; hint?: string; tone?: 'default' | 'warning' }) {
  return (
    <div className="card flex items-start gap-3 p-4 sm:p-5">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-soft text-accent')}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-[28px] leading-none text-text tabular-nums">{value}</p>
        <p className="mt-1.5 text-[13px] font-medium text-text">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  )
}
