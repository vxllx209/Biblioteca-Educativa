import { ArrowLeft, ArrowRight, BookOpen, Clock, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react'
import { useEffect, useMemo, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeToast } from '../components/Motivation'
import { ExplainPanel } from '../components/practice/ExplainPanel'
import { QuestionView } from '../components/practice/QuestionView'
import { ProgressBar } from '../components/ProgressBar'
import { ErrorState } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useStudy } from '../context/StudyContext'
import { getBook } from '../data/books'
import { asChoice, buildSession, getPaesQuestion, getPassage, isValidSession, MODE_LABEL, recommendSkill, sessionTitle, SKILLS, skillStats } from '../data/paes'
import { usePersistentState } from '../hooks/usePersistentState'
import { cn } from '../lib/format'
import { userKey } from '../lib/storage'
import type { SavedExplanation } from '../services/tutor'
import type { PaesMode, PaesPassage, PaesQuestion, PaesSkill } from '../types'
import { plural, t } from '../i18n'

interface Run {
  ids: string[]
  index: number
  choices: Record<string, number | null>
  checked: Record<string, boolean>
  explanations: Record<string, SavedExplanation>
  points: number
  startedAt: string
  finishedAt?: string
  /** Badges already earned when the run started, to celebrate the new ones. */
  badgesBefore: string[]
}

export default function PaesRun() {
  const { mode = '', target } = useParams()
  if (!isValidSession(mode, target))
    return (
      <ErrorState
        title={t('Práctica no encontrada')}
        description={t('Esta práctica no existe o fue movida.')}
        action={
          <Link to="/paes" className="btn-primary">
            {t('Volver a Preparación PAES')}
          </Link>
        }
      />
    )
  return <Runner key={`${mode}.${target ?? ''}`} mode={mode} target={target} />
}

function PassageCard({ passage }: { passage: PaesPassage }) {
  const book = getBook(passage.bookId)
  return (
    <article className="card max-h-none p-5 sm:p-6 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
      <p className="text-xs font-semibold tracking-wide text-secondary uppercase">
        {t('Texto')} · {passage.kind === 'literario' ? t('Literario') : t('No literario')}
      </p>
      <h2 className="mt-1 font-display text-xl text-text">{passage.title}</h2>
      {book && (
        <p className="text-[13px] text-muted">
          {book.author}, <cite>{book.title}</cite>
        </p>
      )}
      <div className="reader-font-serif mt-4 space-y-3 text-[15px] leading-relaxed text-text">
        {passage.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {book && (
        <Link to={`/reader/${book.id}?cap=${passage.chapter}`} className="link-more mt-4 inline-flex items-center gap-1.5">
          <BookOpen className="size-4" aria-hidden /> {t('Leer la obra completa')}
        </Link>
      )}
    </article>
  )
}

function Runner({ mode, target }: { mode: PaesMode; target?: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { paes, answerPaes, finishPaesSession, badges } = useStudy()
  const fresh = (): Run => ({
    ids: buildSession(mode, target, paes.answers),
    index: 0,
    choices: {},
    checked: {},
    explanations: {},
    points: 0,
    startedAt: new Date().toISOString(),
    badgesBefore: badges.filter((b) => b.earned).map((b) => b.id),
  })
  const [run, setRun] = usePersistentState<Run>(user ? userKey(user.id, `paes.run.${mode}.${target ?? ''}`) : null, fresh)

  const questions = useMemo(() => run.ids.map(getPaesQuestion).filter((q): q is PaesQuestion => !!q), [run.ids])
  const q = questions[Math.min(run.index, questions.length - 1)]
  const title = t(sessionTitle(mode, target))

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [run.index, run.finishedAt])

  if (!q) return null

  const choice = run.choices[q.id] ?? null
  const checked = !!run.checked[q.id]
  const isLast = run.index >= questions.length - 1
  const passage = getPassage(q.passageId)

  const check = () => {
    if (choice === null) return
    const points = answerPaes(q, choice)
    setRun((r) => ({ ...r, checked: { ...r.checked, [q.id]: true }, points: r.points + points }))
  }

  const finish = () => {
    const bySkill: Partial<Record<PaesSkill, { correct: number; total: number }>> = {}
    let score = 0
    for (const qq of questions) {
      const ok = run.choices[qq.id] === qq.answer
      if (ok) score++
      const s = (bySkill[qq.skill] ??= { correct: 0, total: 0 })
      s.total++
      if (ok) s.correct++
    }
    finishPaesSession({ mode, target, score, max: questions.length, bySkill })
    setRun((r) => ({ ...r, finishedAt: new Date().toISOString() }))
  }

  const header = (
    <header className="mb-6 flex items-start gap-3">
      <button onClick={() => navigate('/paes')} className="icon-btn" aria-label={t('Volver a Preparación PAES')}>
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">
          {t('PAES')} · {t(MODE_LABEL[mode])}
        </p>
        <h1 className="text-[22px] leading-tight font-bold tracking-tight text-text sm:text-[26px]">{title}</h1>
      </div>
    </header>
  )

  if (run.finishedAt) return <Results run={run} questions={questions} header={header} onRetry={() => setRun(fresh())} />

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {header}

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
          <span>{t('Pregunta {n} de {total}', { n: run.index + 1, total: questions.length })}</span>
          <span className="tabular-nums">
            +{run.points} {t('pts')}
          </span>
        </div>
        <div className="flex gap-1" role="tablist" aria-label={t('Preguntas')}>
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              role="tab"
              aria-selected={i === run.index}
              aria-label={t('Ir a la pregunta {n}', { n: i + 1 })}
              onClick={() => setRun((r) => ({ ...r, index: i }))}
              className={cn(
                'h-2.5 flex-1 rounded-full transition-colors',
                i === run.index && 'ring-2 ring-line-active ring-offset-2 ring-offset-bg',
                !run.checked[qq.id] ? 'bg-bg2' : run.choices[qq.id] === qq.answer ? 'bg-success' : 'bg-error',
              )}
            />
          ))}
        </div>
      </div>

      <div className={cn('grid gap-5', passage && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start')}>
        {passage && <PassageCard passage={passage} />}
        <section className="card rounded-[18px] p-5 sm:p-8" key={q.id}>
          <p className="mb-3 flex flex-wrap gap-2">
            <span className="badge bg-soft text-accent">{t(SKILLS[q.skill].label)}</span>
            {q.ability && <span className="badge bg-bg2 text-muted">{t(q.ability)}</span>}
          </p>
          <QuestionView
            question={asChoice(q)}
            index={run.index}
            value={choice}
            onChange={(v) => setRun((r) => ({ ...r, choices: { ...r.choices, [q.id]: typeof v === 'number' ? v : null } }))}
            checked={checked}
            text=""
            onText={() => undefined}
            onDrawing={() => undefined}
          />
          {checked && choice !== null && choice !== q.answer && (
            <div className="mt-4">
              <ExplainPanel
                question={q}
                passage={passage}
                choice={choice}
                saved={run.explanations[q.id]}
                onSaved={(e) => setRun((r) => ({ ...r, explanations: { ...r.explanations, [q.id]: e } }))}
              />
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-[calc(68px+env(safe-area-inset-bottom)+8px)] z-20 mx-auto mt-5 flex max-w-3xl items-center gap-3 rounded-[14px] border border-line bg-surface/95 p-3 shadow-card backdrop-blur md:bottom-4">
        <button onClick={() => setRun((r) => ({ ...r, index: Math.max(0, r.index - 1) }))} disabled={run.index === 0} className="btn-ghost px-3 disabled:opacity-40">
          <ArrowLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">{t('Anterior')}</span>
        </button>
        <span className="flex-1" />
        {!checked ? (
          <button onClick={check} disabled={choice === null} className="btn-primary">
            {t('Comprobar')}
          </button>
        ) : isLast ? (
          <button onClick={finish} disabled={questions.some((qq) => !run.checked[qq.id])} className="btn-primary">
            {t('Ver resultado')} <ArrowRight className="size-4" aria-hidden />
          </button>
        ) : (
          <button onClick={() => setRun((r) => ({ ...r, index: r.index + 1 }))} className="btn-primary">
            {t('Siguiente')} <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {checked && isLast && questions.some((qq) => !run.checked[qq.id]) && (
        <p className="mt-2 text-center text-xs text-muted">{t('Responde todas las preguntas para ver tu resultado.')}</p>
      )}
    </div>
  )
}

function Results({ run, questions, header, onRetry }: { run: Run; questions: PaesQuestion[]; header: ReactNode; onRetry: () => void }) {
  const { paes, badges } = useStudy()
  const score = questions.filter((q) => run.choices[q.id] === q.answer).length
  const pct = Math.round((score / questions.length) * 100)
  const minutes = Math.max(1, Math.round((Date.parse(run.finishedAt!) - Date.parse(run.startedAt)) / 60000))
  const newBadges = badges.filter((b) => b.earned && !run.badgesBefore.includes(b.id))
  const next = recommendSkill(skillStats(paes.answers))

  const bySkill = Object.entries(
    questions.reduce<Record<string, { correct: number; total: number }>>((acc, q) => {
      const s = (acc[q.skill] ??= { correct: 0, total: 0 })
      s.total++
      if (run.choices[q.id] === q.answer) s.correct++
      return acc
    }, {}),
  ) as [PaesSkill, { correct: number; total: number }][]

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      {header}
      <section className="card rounded-[18px] p-6 text-center sm:p-8" aria-labelledby="result-title">
        <span className={cn('mx-auto grid size-16 place-items-center rounded-full', pct >= 70 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>
          {pct >= 70 ? <Trophy className="size-7" aria-hidden /> : <Target className="size-7" aria-hidden />}
        </span>
        <h2 id="result-title" className="mt-4 font-display text-[28px] text-text">
          {pct >= 90 ? t('¡Excelente trabajo!') : pct >= 70 ? t('¡Muy bien!') : pct >= 50 ? t('Vas por buen camino') : t('Sigue practicando')}
        </h2>
        <p className="mt-1 text-muted">
          {t('Respondiste bien {n} de {total} ({pct}%)', { n: score, total: questions.length, pct })}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="badge bg-soft text-accent">
            <Sparkles className="size-3.5" aria-hidden /> +{run.points} {t('pts')}
          </span>
          <span className="badge bg-bg2 text-muted">
            <Clock className="size-3.5" aria-hidden /> {plural(minutes, '{n} minuto', '{n} minutos')}
          </span>
        </div>
        {newBadges.length > 0 && (
          <div className="mx-auto mt-5 grid max-w-sm gap-2">
            {newBadges.map((b) => (
              <BadgeToast key={b.id} badge={b} />
            ))}
          </div>
        )}

        <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
          {bySkill.map(([skill, s]) => (
            <li key={skill}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-text">{t(SKILLS[skill].label)}</span>
                <span className="text-muted tabular-nums">
                  {s.correct}/{s.total}
                </span>
              </div>
              <ProgressBar value={(s.correct / s.total) * 100} tone={s.correct / s.total >= 0.8 ? 'success' : 'primary'} label={t(SKILLS[skill].label)} />
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="btn-secondary" onClick={onRetry}>
            <RotateCcw className="size-4" aria-hidden /> {t('Otra ronda')}
          </button>
          {next ? (
            <Link to={`/paes/habilidad/${next}`} className="btn-primary">
              {t('Practicar {skill}', { skill: t(SKILLS[next].label) })} <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <Link to="/paes" className="btn-primary">
              {t('Volver a Preparación PAES')} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="review-title">
        <h2 id="review-title" className="mb-3 text-lg font-semibold text-text">
          {t('Revisión')}
        </h2>
        <ol className="space-y-2">
          {questions.map((q, i) => {
            const ok = run.choices[q.id] === q.answer
            return (
              <li key={q.id} className="card p-4">
                <p className="flex items-start gap-2 text-sm text-text">
                  <span className={cn('mt-0.5 size-2.5 shrink-0 rounded-full', ok ? 'bg-success' : 'bg-error')} aria-label={ok ? t('Correcta') : t('Incorrecta')} />
                  <span>
                    {i + 1}. {q.prompt}
                  </span>
                </p>
                {!ok && <p className="mt-2 pl-4.5 text-[13px] leading-relaxed text-muted">{q.explanation}</p>}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
