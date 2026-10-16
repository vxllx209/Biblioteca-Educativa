import { ArrowRight, CircleCheck, CircleDashed, Lightbulb, RotateCcw, Sparkles, ThumbsUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/format'
import { askTutor, LEVEL_SCORE, tutorAvailable, type SavedFeedback, type TutorLevel, type TutorRequest } from '../../services/tutor'
import { t } from '../../i18n'

const LEVEL: Record<TutorLevel, { label: string; cls: string }> = {
  logrado: { label: 'Lo logré', cls: 'bg-success-soft text-success' },
  parcial: { label: 'Parcialmente', cls: 'bg-warning-soft text-warning' },
  repasar: { label: 'Debo repasar', cls: 'bg-error-soft text-error' },
}

interface Props {
  request: Omit<TutorRequest, 'answer'>
  answer: string
  feedback?: SavedFeedback
  onFeedback: (f: SavedFeedback) => void
  /** Suggests the self-assessment from the tutor's level. */
  onAssess: (v: number) => void
}

/** Claude's formative feedback on an open answer, requested on demand. */
export function TutorPanel({ request, answer, feedback, onFeedback, onAssess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const outdated = !!feedback && feedback.answer.trim() !== answer.trim()

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await askTutor({ ...request, answer })
      onFeedback({ ...res.feedback, answer, createdAt: new Date().toISOString() })
      onAssess(LEVEL_SCORE[res.feedback.level])
      setRemaining(res.remaining)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('El tutor no está disponible en este momento.'))
    } finally {
      setLoading(false)
    }
  }

  if (!tutorAvailable) return null

  return (
    <section className="rounded-[14px] border border-line bg-surface p-4 sm:p-5" aria-labelledby="tutor-title" aria-busy={loading}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-soft text-accent">
          <Sparkles className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="tutor-title" className="font-semibold text-text">
            {t('Tutor con IA')}
          </h3>
          <p className="text-[13px] text-muted">{feedback && !outdated ? t('Revisó tu respuesta y sugirió tu autoevaluación.') : t('Recibe comentarios sobre tu desarrollo en segundos.')}</p>
        </div>
        {(!feedback || outdated) && (
          <button onClick={run} disabled={loading || !answer.trim()} className="btn-primary">
            {outdated ? <RotateCcw className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {loading ? t('Revisando…') : outdated ? t('Revisar de nuevo') : t('Revisar con IA')}
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-2" aria-hidden>
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-error-soft px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {feedback && !loading && (
        <div role="status" className={cn('mt-4 animate-rise space-y-4', outdated && 'opacity-60')}>
          {outdated && <p className="text-xs text-muted">{t('Cambiaste tu respuesta: estos comentarios son de la versión anterior.')}</p>}
          <div className="flex flex-wrap items-start gap-2">
            <span className={cn('badge shrink-0', LEVEL[feedback.level].cls)}>{t(LEVEL[feedback.level].label)}</span>
            <p className="min-w-0 flex-1 text-[15px] leading-relaxed text-text">{feedback.summary}</p>
          </div>

          {feedback.strengths.length > 0 && (
            <FeedbackList title={t('Lo que hiciste bien')} icon={<ThumbsUp className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />} items={feedback.strengths} />
          )}
          {feedback.improvements.length > 0 && (
            <FeedbackList title={t('Para mejorar')} icon={<ArrowRight className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />} items={feedback.improvements} />
          )}

          {feedback.criteria.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-secondary uppercase">{t('Criterios')}</p>
              <ul className="mt-2 space-y-2">
                {feedback.criteria.map((c) => (
                  <li key={c.criterion} className="flex gap-2.5 text-sm">
                    {c.met ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label={t('Cumplido')} />
                    ) : (
                      <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted" aria-label={t('Pendiente')} />
                    )}
                    <span className="text-text">
                      <strong className="font-medium">{c.criterion}</strong>
                      {c.comment && <span className="text-muted"> — {c.comment}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.followUp && (
            <p className="flex gap-2 rounded-xl bg-softer px-4 py-3 text-sm text-text">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>
                <strong className="font-medium">{t('Para profundizar:')}</strong> {feedback.followUp}
              </span>
            </p>
          )}

          {remaining !== null && remaining <= 3 && <p className="text-xs text-muted">{t('Te quedan {n} revisiones con IA por hoy.', { n: remaining })}</p>}
        </div>
      )}
    </section>
  )
}

function FeedbackList({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-secondary uppercase">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((s) => (
          <li key={s} className="flex gap-2.5 text-sm leading-relaxed text-text">
            {icon}
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
