import { Award, BookCheck, Compass, Crown, Flag, Flame, Footprints, Medal, Target, Trophy, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudy } from '../context/StudyContext'
import { WEEKLY_GOALS, weekDays, type Badge, type BadgeId } from '../data/motivation'
import { cn } from '../lib/format'
import { locale, plural, t } from '../i18n'
import { ProgressBar } from './ProgressBar'

const BADGE_ICON: Record<BadgeId, LucideIcon> = {
  'primer-paso': Footprints,
  'racha-3': Flame,
  'racha-7': Medal,
  meta: Target,
  ensayo: BookCheck,
  dominio: Crown,
  cincuenta: Trophy,
  explorador: Compass,
}

/** Streak, this week's activity against the goal, and the level. */
export function MotivationPanel({ compact = false }: { compact?: boolean }) {
  const { activity, streak, weekPoints, level, setWeeklyGoal } = useStudy()
  const days = weekDays(activity.days)
  const goal = activity.weeklyGoal
  const goalPct = Math.min(100, (weekPoints / goal) * 100)
  const dayName = (d: Date) => d.toLocaleDateString(locale(), { weekday: 'narrow' })

  return (
    <section className="card grid gap-5 p-5 sm:p-6 md:grid-cols-3" aria-label={t('Tu motivación')}>
      <div className="flex items-center gap-4">
        <span className={cn('grid size-14 shrink-0 place-items-center rounded-2xl', streak ? 'bg-gradient-to-br from-gold to-[#a8732f] text-[#1f1607] shadow-glow' : 'bg-soft text-muted')}>
          <Flame className="size-7" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[28px] leading-none text-text tabular-nums">{plural(streak, '{n} día', '{n} días')}</p>
          <p className="mt-1 text-[13px] text-muted">{streak ? t('de racha. ¡No la cortes!') : t('Estudia hoy para empezar tu racha.')}</p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-text">{t('Meta semanal')}</p>
          <p className="text-[13px] text-muted tabular-nums">
            {weekPoints} / {goal} {t('pts')}
          </p>
        </div>
        <ProgressBar value={goalPct} size="md" tone={goalPct >= 100 ? 'success' : 'primary'} label={t('Meta semanal')} className="mt-2" />
        <ol className="mt-3 grid grid-cols-7 gap-1" aria-label={t('Actividad de esta semana')}>
          {days.map((d) => (
            <li key={d.key} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full text-[10px] font-semibold',
                  d.active ? 'bg-primary text-white dark:bg-secondary' : d.future ? 'bg-bg2 text-muted/50' : 'bg-bg2 text-muted',
                )}
                title={d.active ? t('{n} pts', { n: d.points }) : undefined}
              >
                {d.active ? <Flame className="size-3.5" aria-label={t('Activo')} /> : dayName(d.date).toUpperCase()}
              </span>
            </li>
          ))}
        </ol>
        {!compact && (
          <label className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            <Flag className="size-4" aria-hidden />
            {t('Mi meta:')}
            <select value={goal} onChange={(e) => setWeeklyGoal(Number(e.target.value))} className="field h-9 w-auto py-0 pr-8 text-[13px]">
              {WEEKLY_GOALS.map((g) => (
                <option key={g} value={g}>
                  {t('{n} pts por semana', { n: g })}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-text">
            <Award className="size-4 text-accent" aria-hidden /> {t('Nivel {n}', { n: level.level })}
          </p>
          <p className="text-[13px] text-muted tabular-nums">
            {level.into} / {level.size} {t('pts')}
          </p>
        </div>
        <ProgressBar value={(level.into / level.size) * 100} size="md" label={t('Progreso de nivel')} className="mt-2" />
        <p className="mt-3 text-[13px] text-muted">{t('Gana puntos respondiendo la PAES, terminando prácticas y avanzando capítulos.')}</p>
        {compact && (
          <Link to="/paes" className="link-more mt-2 inline-flex">
            {t('Ir a Preparación PAES')}
          </Link>
        )}
      </div>
    </section>
  )
}

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map((b) => {
        const Icon = BADGE_ICON[b.id]
        return (
          <li key={b.id} className={cn('card flex flex-col items-center gap-2 p-4 text-center', !b.earned && 'opacity-55')}>
            <span className={cn('grid size-12 place-items-center rounded-full', b.earned ? 'bg-gradient-to-br from-gold to-[#a8732f] text-[#1f1607]' : 'bg-bg2 text-muted')}>
              <Icon className="size-6" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-text">{t(b.title)}</span>
            <span className="text-xs text-muted">{t(b.description)}</span>
            <span className="sr-only">{b.earned ? t('Obtenida') : t('Pendiente')}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** A badge earned during a session, shown on the results screen. */
export function BadgeToast({ badge }: { badge: Badge }) {
  const Icon = BADGE_ICON[badge.id]
  return (
    <div className="flex animate-rise items-center gap-3 rounded-[14px] border border-gold/40 bg-warning-soft p-3 text-left">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-[#a8732f] text-[#1f1607]">
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block text-xs font-semibold tracking-wide text-warning uppercase">{t('¡Nueva insignia!')}</span>
        <span className="block font-semibold text-text">{t(badge.title)}</span>
      </span>
    </div>
  )
}
