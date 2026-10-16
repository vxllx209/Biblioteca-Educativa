import { Award, BookOpen, ClipboardCheck, Flame, PenLine, Sparkles, Target, Timer } from 'lucide-react'
import type { ReactNode } from 'react'
import { getBook } from '../../data/books'
import { ACTIVITY_DAYS, type StudentSummary } from '../../data/insights'
import { dayKey } from '../../data/motivation'
import { MODE_LABEL, sessionTitle, SKILLS } from '../../data/paes'
import { getPracticeSet } from '../../data/practice'
import { formatGrade } from '../../data/school'
import { cn, formatDate, relativeTime } from '../../lib/format'
import { plural, t } from '../../i18n'
import { ProgressBar } from '../ProgressBar'
import { DayBars, SkillBars } from './Charts'
import { EngagementBadge, lastActiveLabel } from './Engagement'

function Mini({ icon: Icon, value, label }: { icon: typeof Flame; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">
        <Icon className="size-3.5" aria-hidden /> {label}
      </p>
      <p className="mt-1 font-display text-xl leading-none text-text tabular-nums">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-text">{title}</h3>
      {children}
    </section>
  )
}

export function StudentDetail({ s }: { s: StudentSummary }) {
  const days = Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (ACTIVITY_DAYS - 1 - i))
    const key = dayKey(date)
    return { key, date, value: s.data.activity.days[key] ?? 0 }
  })
  const maxPoints = Math.max(...days.map((d) => d.value), 10)
  const practice = Object.values(s.data.practice).sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const sessions = s.data.paes.sessions.slice(0, 5)

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-2">
        <EngagementBadge engagement={s.engagement} />
        <span className="text-sm text-muted">
          {t('Última actividad:')} {lastActiveLabel(s.daysInactive)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Mini icon={Flame} value={plural(s.streak, '{n} día', '{n} días')} label={t('Racha')} />
        <Mini icon={Sparkles} value={`${s.weekPoints}`} label={t('Pts. semana')} />
        <Mini icon={Award} value={`${s.level}`} label={t('Nivel')} />
        <Mini icon={ClipboardCheck} value={s.avgGrade === null ? '—' : formatGrade(s.avgGrade)} label={t('Promedio')} />
      </div>

      <Section title={t('Puntos por día (últimos 14 días)')}>
        <DayBars
          days={days}
          max={maxPoints}
          height={96}
          label={t('Puntos por día')}
          format={(d) => `${formatDate(d.date.toISOString(), { weekday: 'short', day: 'numeric', month: 'short' })} · ${t('{n} pts', { n: d.value })}`}
        />
      </Section>

      <Section title={t('Habilidades PAES')}>
        {s.paesAnswered ? (
          <>
            <SkillBars
              highlight={s.weakestSkill}
              values={s.skills}
              note={(k) => t('{n} de {total} preguntas respondidas', { n: s.skills[k].answered, total: s.skills[k].total })}
            />
            {s.weakestSkill && (
              <p className="mt-4 flex gap-2 rounded-xl bg-softer px-4 py-3 text-sm text-text">
                <Target className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span>{t('Le conviene reforzar {skill}.', { skill: t(SKILLS[s.weakestSkill].label) })}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">{t('Todavía no responde preguntas PAES.')}</p>
        )}
      </Section>

      {sessions.length > 0 && (
        <Section title={t('Últimas sesiones PAES')}>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {sessions.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <Timer className="size-4 shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-text">
                  {t(sessionTitle(x.mode, x.target))} <span className="text-muted">· {t(MODE_LABEL[x.mode])}</span>
                </span>
                <span className="text-xs text-muted">{relativeTime(x.completedAt)}</span>
                <span className="font-semibold text-text tabular-nums">
                  {x.score}/{x.max}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid gap-7 md:grid-cols-2">
        <Section title={t('Leyendo')}>
          {s.reading.length ? (
            <ul className="space-y-3">
              {s.reading.slice(0, 4).map((r) => (
                <li key={r.bookId}>
                  <p className="flex items-center gap-2 text-sm text-text">
                    <BookOpen className="size-4 shrink-0 text-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{getBook(r.bookId)?.title ?? r.bookId}</span>
                    <span className="text-xs text-muted tabular-nums">{Math.round(r.percent)}%</span>
                  </p>
                  <ProgressBar value={r.percent} className="mt-1.5" label={getBook(r.bookId)?.title} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t('No tiene lecturas en curso.')}</p>
          )}
          {s.booksFinished > 0 && <p className="mt-3 text-xs text-muted">{plural(s.booksFinished, '{n} libro terminado', '{n} libros terminados')}</p>}
        </Section>

        <Section title={t('Prácticas')}>
          {practice.length ? (
            <ul className="space-y-2">
              {practice.slice(0, 5).map((p) => (
                <li key={p.setId} className="flex items-center gap-2 text-sm">
                  <PenLine className="size-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-text">{getPracticeSet(p.setId)?.title ?? p.setId}</span>
                  <span className={cn('badge', p.best >= 0.7 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>{Math.round(p.best * 100)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t('No ha terminado prácticas.')}</p>
          )}
        </Section>
      </div>

      <p className="text-xs text-muted">
        {t('Entregas: {sent} enviadas · {reviewed} revisadas', { sent: s.sent, reviewed: s.reviewed })}
        {s.missing > 0 && ` · ${plural(s.missing, '{n} atrasada', '{n} atrasadas')}`}
        {' · '}
        {t('Se unió el {date}', { date: formatDate(s.member.joinedAt) })}
      </p>
    </div>
  )
}
