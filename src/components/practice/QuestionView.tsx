import { ArrowDown, ArrowUp, Check, CircleCheck, CircleX, Lightbulb, PenLine } from 'lucide-react'
import { useId, useState } from 'react'
import { parseNumber, scoreAnswer } from '../../data/practice'
import { cn } from '../../lib/format'
import type { AnswerValue, Question } from '../../types'
import { Whiteboard } from './Whiteboard'

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

interface Props {
  question: Question
  index: number
  value: AnswerValue
  onChange: (v: AnswerValue) => void
  checked: boolean
  text: string
  onText: (t: string) => void
  drawing?: string
  onDrawing: (d: string) => void
}

const LETTERS = 'ABCDEFGH'

/** The correct answer as text, shown after checking a wrong answer. */
function correctAnswer(q: Question) {
  switch (q.kind) {
    case 'choice':
      return `${LETTERS[q.answer]}. ${q.options[q.answer]}`
    case 'truefalse':
      return q.answer ? 'Verdadero' : 'Falso'
    case 'numeric':
      return `${q.answer.toLocaleString('es-ES')}${q.unit ? ` ${q.unit}` : ''}`
    case 'short':
      return q.accepted[0]
    case 'order':
      return q.items.map((it, i) => `${i + 1}. ${it}`).join(' · ')
    default:
      return ''
  }
}

export function QuestionView({ question: q, index, value, onChange, checked, text, onText, drawing, onDrawing }: Props) {
  const id = useId()
  const [showHint, setShowHint] = useState(false)
  const score = checked ? scoreAnswer(q, value) : null
  const choiceClass = (active: boolean, correct: boolean) =>
    cn(
      'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition-colors duration-200',
      checked
        ? correct
          ? 'border-success bg-success-soft text-text'
          : active
            ? 'border-error bg-error-soft text-text'
            : 'border-line text-muted'
        : active
          ? 'border-primary bg-softer text-text dark:border-secondary'
          : 'border-line text-text hover:border-line-active',
    )

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-secondary uppercase">Pregunta {index + 1}</p>
      <h2 id={`${id}-prompt`} className="mt-2 text-lg leading-snug font-semibold text-text sm:text-xl">
        {q.prompt}
      </h2>

      <div className="mt-5" aria-labelledby={`${id}-prompt`}>
        {q.kind === 'choice' && (
          <div role="radiogroup" aria-labelledby={`${id}-prompt`} className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                role="radio"
                aria-checked={value === i}
                disabled={checked}
                onClick={() => onChange(i)}
                className={choiceClass(value === i, checked && i === q.answer)}
              >
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold', value === i ? 'border-primary bg-primary text-white dark:border-secondary dark:bg-secondary' : 'border-line-active text-muted')}>
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{opt}</span>
                {checked && i === q.answer && <Check className="size-5 text-success" aria-label="Correcta" />}
              </button>
            ))}
          </div>
        )}

        {q.kind === 'truefalse' && (
          <div role="radiogroup" aria-labelledby={`${id}-prompt`} className="grid grid-cols-2 gap-3">
            {[true, false].map((v) => (
              <button key={String(v)} role="radio" aria-checked={value === v} disabled={checked} onClick={() => onChange(v)} className={cn(choiceClass(value === v, checked && v === q.answer), 'justify-center font-medium')}>
                {v ? 'Verdadero' : 'Falso'}
              </button>
            ))}
          </div>
        )}

        {q.kind === 'numeric' && (
          <div>
            <label htmlFor={`${id}-num`} className="label">
              Tu resultado
            </label>
            <div className="flex max-w-xs items-center gap-3">
              <input
                id={`${id}-num`}
                inputMode="decimal"
                autoComplete="off"
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={checked}
                placeholder="0"
                className={cn('field text-lg font-semibold tabular-nums', checked && (score ? 'border-success' : 'border-error'))}
                aria-invalid={checked && !score}
              />
              {q.unit && <span className="shrink-0 text-[15px] font-medium text-muted">{q.unit}</span>}
            </div>
            {typeof value === 'string' && value.trim() && parseNumber(value) === null && (
              <p className="mt-1.5 text-[13px] text-error">Escribe solo un número (puedes usar coma decimal).</p>
            )}
            {q.hint && !checked && (
              <button type="button" onClick={() => setShowHint((s) => !s)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                <Lightbulb className="size-4" aria-hidden /> {showHint ? 'Ocultar pista' : 'Ver una pista'}
              </button>
            )}
            {showHint && !checked && <p className="mt-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-text">{q.hint}</p>}
          </div>
        )}

        {q.kind === 'short' && (
          <div className="max-w-md">
            <label htmlFor={`${id}-short`} className="label">
              Tu respuesta
            </label>
            <input
              id={`${id}-short`}
              autoComplete="off"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={checked}
              className={cn('field', checked && (score ? 'border-success' : 'border-error'))}
            />
          </div>
        )}

        {q.kind === 'order' && Array.isArray(value) && (
          <ol className="space-y-2" aria-label="Elementos para ordenar">
            {value.map((item, i) => {
              const right = checked && q.items[i] === item
              return (
                <li
                  key={item}
                  className={cn(
                    'flex min-h-12 items-center gap-3 rounded-xl border bg-surface px-3 py-2 text-[15px] transition-colors',
                    checked ? (right ? 'border-success bg-success-soft' : 'border-error bg-error-soft') : 'border-line',
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-soft text-xs font-semibold text-accent">{i + 1}</span>
                  <span className="flex-1 text-text">{item}</span>
                  {!checked && (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => {
                          const next = [...value]
                          ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                          onChange(next)
                        }}
                        className="grid size-10 place-items-center rounded-lg text-muted hover:bg-bg2 hover:text-text disabled:opacity-30"
                        aria-label={`Subir «${item}»`}
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={i === value.length - 1}
                        onClick={() => {
                          const next = [...value]
                          ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                          onChange(next)
                        }}
                        className="grid size-10 place-items-center rounded-lg text-muted hover:bg-bg2 hover:text-text disabled:opacity-30"
                        aria-label={`Bajar «${item}»`}
                      >
                        <ArrowDown className="size-4" />
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        )}

        {q.kind === 'open' && (
          <div className="space-y-4">
            <p className="flex gap-2 rounded-xl bg-softer px-4 py-3 text-sm text-muted">
              <PenLine className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>{q.guidance}</span>
            </p>
            {q.board && <Whiteboard value={drawing} onChange={onDrawing} label="Pizarra de desarrollo" />}
            <div>
              <label htmlFor={`${id}-open`} className="label flex justify-between">
                Espacio de desarrollo
                <span className={cn('text-xs font-normal', q.minWords && wordCount(text) < q.minWords ? 'text-muted' : 'text-success')}>
                  {wordCount(text)} palabras{q.minWords ? ` · mínimo ${q.minWords}` : ''}
                </span>
              </label>
              <textarea
                id={`${id}-open`}
                value={text}
                onChange={(e) => onText(e.target.value)}
                rows={7}
                placeholder="Escribe aquí tu respuesta…"
                className="field h-auto min-h-40 resize-y py-3 leading-relaxed"
              />
              <p className="mt-1 text-xs text-muted">Se guarda automáticamente.</p>
            </div>
          </div>
        )}
      </div>

      {checked && q.kind !== 'open' && (
        <div
          role="status"
          className={cn('mt-6 animate-rise rounded-[14px] border p-4', score ? 'border-success/40 bg-success-soft' : 'border-error/40 bg-error-soft')}
        >
          <p className={cn('flex items-center gap-2 font-semibold', score ? 'text-success' : 'text-error')}>
            {score ? <CircleCheck className="size-5" aria-hidden /> : <CircleX className="size-5" aria-hidden />}
            {score ? '¡Correcto!' : 'No es correcto'}
          </p>
          {!score && <p className="mt-1 text-sm text-text">Respuesta correcta: <strong>{correctAnswer(q)}</strong></p>}
          <p className="mt-2 text-sm leading-relaxed text-text">{q.explanation}</p>
        </div>
      )}
    </div>
  )
}

/** Model answer + criteria checklist + self-assessment for open questions. */
export function OpenReview({ question: q, value, onAssess }: { question: Extract<Question, { kind: 'open' }>; value: AnswerValue; onAssess: (v: number) => void }) {
  const [checks, setChecks] = useState<boolean[]>(() => (q.criteria ?? []).map(() => false))
  const options = [
    { v: 1, label: 'Lo logré', cls: 'border-success bg-success-soft text-success' },
    { v: 0.5, label: 'Parcialmente', cls: 'border-warning bg-warning-soft text-warning' },
    { v: 0, label: 'Debo repasar', cls: 'border-error bg-error-soft text-error' },
  ]
  return (
    <div className="mt-6 animate-rise space-y-4 rounded-[14px] border border-line-active bg-softer p-4 sm:p-5">
      {q.model && (
        <div>
          <p className="text-xs font-semibold tracking-wide text-secondary uppercase">Respuesta modelo</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-text">{q.model}</p>
        </div>
      )}
      {!!q.criteria?.length && (
        <fieldset>
          <legend className="text-xs font-semibold tracking-wide text-secondary uppercase">Revisa tu respuesta</legend>
          <ul className="mt-2 space-y-1.5">
            {q.criteria.map((c, i) => (
              <li key={c}>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={(e) => setChecks((s) => s.map((x, j) => (j === i ? e.target.checked : x)))}
                    className="size-5 shrink-0 accent-[var(--c-primary)]"
                  />
                  {c}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <div>
        <p className="text-sm font-medium text-text">¿Cómo te fue?</p>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Autoevaluación">
          {options.map((o) => (
            <button
              key={o.v}
              role="radio"
              aria-checked={value === o.v}
              onClick={() => onAssess(o.v)}
              className={cn('min-h-11 rounded-xl border px-2 text-sm font-medium transition-colors', value === o.v ? o.cls : 'border-line bg-surface text-muted hover:border-line-active')}
            >
              {o.label}
            </button>
          ))}
        </div>
        {checks.length > 0 && value === null && (
          <p className="mt-2 text-xs text-muted">
            Cumpliste {checks.filter(Boolean).length} de {checks.length} criterios.
          </p>
        )}
      </div>
    </div>
  )
}
