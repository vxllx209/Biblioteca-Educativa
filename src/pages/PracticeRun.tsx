import { ArrowLeft, ArrowRight, BookOpen, CircleCheck, CircleX, ClipboardCheck, Crown, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { OpenReview, QuestionView, wordCount } from '../components/practice/QuestionView'
import { ProgressBar } from '../components/ProgressBar'
import { ErrorState } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { getBook, PREVIEW_CHAPTERS } from '../data/books'
import { KIND_LABEL, parseNumber, resolveSet, scoreAnswer, scramble } from '../data/practice'
import { usePersistentState } from '../hooks/usePersistentState'
import { cn } from '../lib/format'
import { userKey } from '../lib/storage'
import type { AnswerValue, PracticeSet, Question } from '../types'

interface Session {
  index: number
  answers: Record<string, AnswerValue>
  checked: Record<string, boolean>
  texts: Record<string, string>
  drawings: Record<string, string>
  finished: boolean
}

const freshSession = (set: PracticeSet, keep?: Pick<Session, 'texts' | 'drawings'>): Session => ({
  index: 0,
  answers: Object.fromEntries(set.questions.map((q) => [q.id, q.kind === 'order' ? scramble(q.items, set.id + q.id) : null])),
  checked: {},
  texts: keep?.texts ?? {},
  drawings: keep?.drawings ?? {},
  finished: false,
})

function ready(q: Question, value: AnswerValue, text: string, drawing?: string) {
  switch (q.kind) {
    case 'choice':
      return typeof value === 'number'
    case 'truefalse':
      return typeof value === 'boolean'
    case 'numeric':
      return typeof value === 'string' && parseNumber(value) !== null
    case 'short':
      return typeof value === 'string' && value.trim().length > 0
    case 'order':
      return true
    case 'open': {
      const words = wordCount(text)
      const min = q.minWords ?? 1
      return words >= min || (!!q.board && !!drawing && drawing !== '[]' && words >= Math.min(5, min))
    }
  }
}

export default function PracticeRun() {
  const { bookId, setId } = useParams()
  const book = getBook(bookId)
  const set = book && setId ? resolveSet(book, setId) : undefined
  if (!book || !set)
    return (
      <ErrorState
        title="Práctica no encontrada"
        description="Esta práctica no existe o fue movida."
        action={
          <Link to={book ? `/practice/${book.id}` : '/explore'} className="btn-primary">
            Ver prácticas
          </Link>
        }
      />
    )
  return <Runner key={set.id} set={set} />
}

function Runner({ set }: { set: PracticeSet }) {
  const book = getBook(set.bookId)!
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  const { practice, savePracticeResult } = useLibrary()
  const [session, setSession] = usePersistentState<Session>(user ? userKey(user.id, `practice.session.${set.id}`) : null, () => freshSession(set))
  // A session already finished before this visit was saved back then.
  const [saved, setSaved] = useState(() => session.finished)
  const locked = book.premium && !isPremium && set.chapter >= PREVIEW_CHAPTERS

  const q = set.questions[Math.min(session.index, set.questions.length - 1)]
  const value = session.answers[q.id] ?? null
  const checked = !!session.checked[q.id]
  const text = session.texts[q.id] ?? ''
  const drawing = session.drawings[q.id]
  const assessed = q.kind !== 'open' || typeof value === 'number'
  const isLast = session.index >= set.questions.length - 1

  const patch = (p: Partial<Session>) => setSession((s) => ({ ...s, ...p }))
  const setAnswer = (v: AnswerValue) => setSession((s) => ({ ...s, answers: { ...s.answers, [q.id]: v } }))

  const results = useMemo(
    () => set.questions.map((qq) => ({ q: qq, score: scoreAnswer(qq, session.answers[qq.id] ?? null) })),
    [set, session.answers],
  )
  const total = results.reduce((s, r) => s + r.score, 0)
  const max = set.questions.length
  const pct = Math.round((total / max) * 100)

  // Persist the result once, when the practice is finished.
  useEffect(() => {
    if (session.finished && !saved) {
      savePracticeResult(set, total, max)
      setSaved(true)
    }
  }, [session.finished, saved, savePracticeResult, set, total, max])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [session.index, session.finished])

  if (locked)
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-soft text-accent">
          <Crown className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-text">Práctica Premium</h1>
        <p className="mt-2 text-sm text-muted">Esta práctica corresponde a un capítulo Premium de «{book.title}».</p>
        <Link to="/premium" className="btn-primary mt-6">
          Ver planes
        </Link>
      </div>
    )

  const header = (
    <header className="mb-6 flex items-start gap-3">
      <button onClick={() => navigate(`/practice/${book.id}`)} className="icon-btn" aria-label="Volver a las prácticas">
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-muted">
          {book.title} · {book.chapters[set.chapter]?.title}
        </p>
        <h1 className="text-[22px] leading-tight font-bold tracking-tight text-text sm:text-[26px]">{set.title}</h1>
        <span className="badge mt-2 bg-soft text-accent">{KIND_LABEL[set.kind]}</span>
      </div>
    </header>
  )

  if (session.finished) {
    const best = practice[set.id]?.best
    return (
      <div className="mx-auto max-w-3xl animate-fade-in">
        {header}
        <section className="card rounded-[18px] p-6 text-center sm:p-8" aria-labelledby="result-title">
          <span className={cn('mx-auto grid size-16 place-items-center rounded-full', pct >= 70 ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning')}>
            {pct >= 70 ? <Trophy className="size-7" aria-hidden /> : <ClipboardCheck className="size-7" aria-hidden />}
          </span>
          <h2 id="result-title" className="mt-4 text-2xl font-bold text-text">
            {pct >= 90 ? '¡Excelente trabajo!' : pct >= 70 ? '¡Muy bien!' : pct >= 50 ? 'Vas por buen camino' : 'Sigue practicando'}
          </h2>
          <p className="mt-1 text-muted">
            Obtuviste <strong className="text-text">{total.toLocaleString('es-ES')}</strong> de {max} puntos ({pct}%)
            {best !== undefined && ` · Mejor resultado: ${Math.round(best * 100)}%`}
          </p>
          <ProgressBar value={pct} size="md" className="mx-auto mt-5 max-w-sm" tone={pct >= 70 ? 'success' : 'primary'} label="Resultado" />
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              className="btn-secondary"
              onClick={() => {
                setSaved(false)
                setSession(freshSession(set, { texts: session.texts, drawings: session.drawings }))
              }}
            >
              <RotateCcw className="size-4" aria-hidden /> Reintentar
            </button>
            <Link to={`/reader/${book.id}?cap=${set.chapter}`} className="btn-secondary">
              <BookOpen className="size-4" aria-hidden /> Releer el capítulo
            </Link>
            <Link to={`/practice/${book.id}`} className="btn-primary">
              Más prácticas <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="review-title">
          <h2 id="review-title" className="mb-3 text-lg font-semibold text-text">
            Revisión
          </h2>
          <ol className="space-y-2">
            {results.map(({ q: qq, score }, i) => (
              <li key={qq.id} className="card flex items-start gap-3 p-4">
                {qq.kind === 'open' ? (
                  <span className="mt-0.5 rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-accent">{score === 1 ? 'Logrado' : score === 0.5 ? 'Parcial' : 'Repasar'}</span>
                ) : score ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correcta" />
                ) : (
                  <CircleX className="mt-0.5 size-5 shrink-0 text-error" aria-label="Incorrecta" />
                )}
                <button onClick={() => patch({ finished: false, index: i })} className="flex-1 text-left text-sm text-text hover:underline">
                  {i + 1}. {qq.prompt}
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      {header}

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
          <span>
            Pregunta {session.index + 1} de {set.questions.length}
          </span>
          <span>{Object.keys(session.checked).length} respondidas</span>
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label="Preguntas">
          {set.questions.map((qq, i) => {
            const done = session.checked[qq.id]
            const s = done ? scoreAnswer(qq, session.answers[qq.id] ?? null) : null
            return (
              <button
                key={qq.id}
                role="tab"
                aria-selected={i === session.index}
                aria-label={`Ir a la pregunta ${i + 1}`}
                onClick={() => patch({ index: i })}
                className={cn(
                  'h-2.5 flex-1 rounded-full transition-colors',
                  i === session.index && 'ring-2 ring-line-active ring-offset-2 ring-offset-bg',
                  s === null ? 'bg-bg2' : qq.kind === 'open' ? 'bg-secondary' : s ? 'bg-success' : 'bg-error',
                )}
              />
            )
          })}
        </div>
      </div>

      <section className="card rounded-[18px] p-5 sm:p-8" key={q.id}>
        <QuestionView
          question={q}
          index={session.index}
          value={value}
          onChange={setAnswer}
          checked={checked}
          text={text}
          onText={(t) => setSession((s) => ({ ...s, texts: { ...s.texts, [q.id]: t } }))}
          drawing={drawing}
          onDrawing={(d) => setSession((s) => ({ ...s, drawings: { ...s.drawings, [q.id]: d } }))}
        />
        {checked && q.kind === 'open' && <OpenReview question={q} value={value} onAssess={setAnswer} />}
      </section>

      <div className="sticky bottom-[calc(68px+env(safe-area-inset-bottom)+8px)] z-20 mt-5 flex items-center gap-3 rounded-[14px] border border-line bg-surface/95 p-3 shadow-card backdrop-blur md:bottom-4">
        <button onClick={() => patch({ index: Math.max(0, session.index - 1) })} disabled={session.index === 0} className="btn-ghost px-3 disabled:opacity-40">
          <ArrowLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">Anterior</span>
        </button>
        <span className="flex-1" />
        {!checked ? (
          <button
            onClick={() => setSession((s) => ({ ...s, checked: { ...s.checked, [q.id]: true } }))}
            disabled={!ready(q, value, text, drawing)}
            className="btn-primary"
          >
            {q.kind === 'open' ? 'Revisar mi respuesta' : 'Comprobar'}
          </button>
        ) : (
          <button
            onClick={() => (isLast ? patch({ finished: true }) : patch({ index: session.index + 1 }))}
            disabled={!assessed}
            className="btn-primary"
          >
            {isLast ? 'Ver resultado' : 'Siguiente'} <ArrowRight className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {checked && q.kind === 'open' && !assessed && <p className="mt-2 text-center text-xs text-muted">Autoevalúate para continuar.</p>}
    </div>
  )
}
