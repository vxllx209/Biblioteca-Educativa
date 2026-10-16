import { Lightbulb, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { SKILLS } from '../../data/paes'
import { explainMistake, tutorAvailable, type SavedExplanation } from '../../services/tutor'
import type { PaesPassage, PaesQuestion } from '../../types'
import { t } from '../../i18n'

const LETTERS = 'ABCD'

interface Props {
  question: PaesQuestion
  passage?: PaesPassage
  choice: number
  saved?: SavedExplanation
  onSaved: (e: SavedExplanation) => void
}

/** "¿Por qué me equivoqué?": the AI tutor explains the mistake behind the option the student chose. */
export function ExplainPanel({ question: q, passage, choice, saved, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = saved?.choice === choice ? saved : undefined

  if (!tutorAvailable) return null

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await explainMistake({
        area: q.area === 'lectora' ? 'Competencia Lectora' : 'Competencia Matemática 1',
        skill: SKILLS[q.skill].label,
        passage: passage?.paragraphs.join('\n\n'),
        prompt: q.prompt,
        options: q.options.map((o, i) => `${LETTERS[i]}. ${o}`),
        answer: q.answer,
        choice,
        explanation: q.explanation,
      })
      onSaved({ ...res.explanation, choice })
    } catch (e) {
      setError(e instanceof Error ? e.message : t('El tutor no está disponible en este momento.'))
    } finally {
      setLoading(false)
    }
  }

  if (current)
    return (
      <div role="status" className="animate-rise space-y-3 rounded-[14px] border border-line bg-surface p-4">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-secondary uppercase">
          <Sparkles className="size-4" aria-hidden /> {t('Tutor con IA')}
        </p>
        <p className="text-[15px] leading-relaxed text-text">{current.explanation}</p>
        {current.tip && (
          <p className="flex gap-2 rounded-xl bg-softer px-4 py-3 text-sm text-text">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <span>
              <strong className="font-medium">{t('Para la próxima:')}</strong> {current.tip}
            </span>
          </p>
        )}
      </div>
    )

  return (
    <div>
      <button onClick={run} disabled={loading} className="btn-secondary" aria-busy={loading}>
        <Sparkles className="size-4" aria-hidden /> {loading ? t('Revisando…') : t('¿Por qué me equivoqué?')}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-error-soft px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
