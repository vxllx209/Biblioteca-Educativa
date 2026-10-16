import { ArrowRight, BookOpenText, Calculator, ClipboardCheck, Sparkles, Target, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BadgeGrid, MotivationPanel } from '../components/Motivation'
import { PageHeader, SectionHeader } from '../components/PageHeader'
import { useStudy } from '../context/StudyContext'
import { AREAS, MASTERY_LABEL, MODE_LABEL, PAES_QUESTIONS, recommendSkill, sessionTitle, SKILLS, skillStats, type SkillStat } from '../data/paes'
import { cn, relativeTime } from '../lib/format'
import type { PaesArea } from '../types'
import { plural, t } from '../i18n'

const LEVEL_TONE = {
  'sin-datos': 'bg-bg2 text-muted',
  inicial: 'bg-error-soft text-error',
  intermedio: 'bg-warning-soft text-warning',
  avanzado: 'bg-success-soft text-success',
} as const

const BAR_TONE = { 'sin-datos': 'bg-line', inicial: 'bg-error', intermedio: 'bg-warning', avanzado: 'bg-success' } as const

const AREA_ICON: Record<PaesArea, typeof BookOpenText> = { lectora: BookOpenText, m1: Calculator }

function SkillRow({ stat }: { stat: SkillStat }) {
  const info = SKILLS[stat.skill]
  const pct = stat.pct === null ? 0 : Math.round(stat.pct * 100)
  return (
    <li>
      <Link to={`/paes/habilidad/${stat.skill}`} className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-bg2">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block font-medium text-text">{t(info.label)}</span>
            <span className="block truncate text-xs text-muted">{t(info.description)}</span>
          </span>
          <span className={cn('badge shrink-0', LEVEL_TONE[stat.level])}>{stat.pct === null ? t(MASTERY_LABEL[stat.level]) : `${pct}%`}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('Dominio de {skill}', { skill: t(info.label) })}>
          <div className={cn('h-full rounded-full transition-[width] duration-500', BAR_TONE[stat.level])} style={{ width: `${Math.max(pct, stat.answered ? 4 : 0)}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {t('{n} de {total} preguntas respondidas', { n: stat.answered, total: stat.total })}
          {stat.level !== 'sin-datos' && ` · ${t(MASTERY_LABEL[stat.level])}`}
        </p>
      </Link>
    </li>
  )
}

export default function PaesHub() {
  const { paes, badges } = useStudy()
  const stats = useMemo(() => skillStats(paes.answers), [paes.answers])
  const recommended = recommendSkill(stats)
  const started = Object.keys(paes.answers).length > 0
  const earned = badges.filter((b) => b.earned).length

  return (
    <div className="stagger space-y-10">
      <PageHeader
        title={t('Preparación PAES')}
        subtitle={t('Practica Competencia Lectora y Matemática M1 con preguntas tipo PAES, mira tus habilidades y sigue tu avance.')}
      />

      <MotivationPanel />

      <section aria-labelledby="next-title" className="forest-panel grid gap-6 rounded-[24px] p-6 shadow-lift sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-mint/80 uppercase">
            <Sparkles className="size-4" aria-hidden /> {t('Recomendado para ti')}
          </p>
          {!started ? (
            <>
              <h2 id="next-title" className="mt-2 font-display text-[26px] leading-tight text-white sm:text-3xl">
                {t('Empieza con un diagnóstico')}
              </h2>
              <p className="mt-2 text-sm text-mint/75 sm:text-[15px]">{t('14 preguntas, dos por habilidad, para saber dónde estás y qué practicar primero.')}</p>
            </>
          ) : recommended ? (
            <>
              <h2 id="next-title" className="mt-2 font-display text-[26px] leading-tight text-white sm:text-3xl">
                {t('Practica {skill}', { skill: t(SKILLS[recommended].label) })}
              </h2>
              <p className="mt-2 text-sm text-mint/75 sm:text-[15px]">
                {stats[recommended].pct === null
                  ? t('Aún no tienes resultados en esta habilidad. Pruébala para completar tu mapa.')
                  : t('Es tu habilidad con menor dominio ({pct}%). Te mostramos primero las preguntas nuevas y las que fallaste.', {
                      pct: Math.round(stats[recommended].pct! * 100),
                    })}
              </p>
            </>
          ) : (
            <>
              <h2 id="next-title" className="mt-2 font-display text-[26px] leading-tight text-white sm:text-3xl">
                {t('¡Dominas todas las habilidades!')}
              </h2>
              <p className="mt-2 text-sm text-mint/75 sm:text-[15px]">{t('Ponte a prueba con un mini ensayo completo.')}</p>
            </>
          )}
        </div>
        <Link
          to={!started ? '/paes/diagnostico' : recommended ? `/paes/habilidad/${recommended}` : '/paes/ensayo/lectora'}
          className="btn-gold justify-center"
        >
          {!started ? t('Hacer el diagnóstico') : t('Comenzar')} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <section aria-labelledby="map-title">
        <SectionHeader id="map-title" title={t('Tu mapa de habilidades')} />
        <div className="grid gap-5 lg:grid-cols-2">
          {AREAS.map((area) => {
            const Icon = AREA_ICON[area.id]
            const count = PAES_QUESTIONS.filter((q) => q.area === area.id).length
            return (
              <article key={area.id} className="card p-4 sm:p-5">
                <header className="flex items-start gap-3 px-3 pb-2">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-accent">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text">{t(area.title)}</h3>
                    <p className="text-[13px] text-muted">{t(area.description)}</p>
                  </div>
                </header>
                <ul className="space-y-0.5">
                  {area.skills.map((s) => (
                    <SkillRow key={s} stat={stats[s]} />
                  ))}
                </ul>
                <div className="mt-3 px-3">
                  <Link to={`/paes/ensayo/${area.id}`} className="btn-secondary w-full justify-center sm:w-auto">
                    <Timer className="size-4" aria-hidden /> {t('Mini ensayo')} · {plural(count, '{n} pregunta', '{n} preguntas')}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
        {started && (
          <p className="mt-3 text-center text-xs text-muted">
            <Link to="/paes/diagnostico" className="inline-flex items-center gap-1 hover:underline">
              <ClipboardCheck className="size-3.5" aria-hidden /> {t('Repetir el diagnóstico')}
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="badges-title">
        <SectionHeader id="badges-title" title={t('Insignias')} action={<span className="text-sm text-muted">{t('{n} de {total}', { n: earned, total: badges.length })}</span>} />
        <BadgeGrid badges={badges} />
      </section>

      {paes.sessions.length > 0 && (
        <section aria-labelledby="history-title">
          <SectionHeader id="history-title" title={t('Tu historial')} />
          <ul className="card divide-y divide-line">
            {paes.sessions.slice(0, 8).map((s) => {
              const pct = Math.round((s.score / s.max) * 100)
              return (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-soft text-accent">
                    <Target className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text">{t(sessionTitle(s.mode, s.target))}</span>
                    <span className="block text-xs text-muted">
                      {t(MODE_LABEL[s.mode])} · {relativeTime(s.completedAt)}
                    </span>
                  </span>
                  <span className={cn('badge', pct >= 80 ? LEVEL_TONE.avanzado : pct >= 50 ? LEVEL_TONE.intermedio : LEVEL_TONE.inicial)}>
                    {s.score}/{s.max}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-muted">
        {t('Las preguntas son de práctica, escritas para esta app con el formato de la PAES. No son preguntas oficiales del DEMRE.')}
      </p>
    </div>
  )
}
