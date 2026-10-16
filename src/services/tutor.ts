import { supabase } from '../lib/supabase'
import { t } from '../i18n'

/**
 * Tutor IA: sends an open answer to the `tutor` Edge Function (supabase/functions/tutor),
 * which asks an LLM on Groq for formative feedback. Needs Supabase; in local mode it is unavailable.
 */
export type TutorLevel = 'logrado' | 'parcial' | 'repasar'

export interface TutorFeedback {
  level: TutorLevel
  summary: string
  strengths: string[]
  improvements: string[]
  criteria: { criterion: string; met: boolean; comment: string }[]
  followUp: string
}

/** Feedback stored with the exact text it reviewed, to know when it is out of date. */
export interface SavedFeedback extends TutorFeedback {
  answer: string
  createdAt: string
}

export interface TutorRequest {
  book: string
  chapter: string
  subject: string
  prompt: string
  guidance: string
  model?: string
  criteria?: string[]
  answer: string
}

/** Same scale as the self-assessment: 1 achieved, 0.5 partial, 0 review. */
export const LEVEL_SCORE: Record<TutorLevel, number> = { logrado: 1, parcial: 0.5, repasar: 0 }

export const tutorAvailable = !!supabase

/** Error codes returned by the Edge Function, translated here. */
function errorMessage(code: unknown) {
  switch (code) {
    case 'auth':
      return t('Inicia sesión para usar el tutor.')
    case 'bad_request':
      return t('Falta la pregunta o la respuesta.')
    case 'limit':
      return t('Llegaste al límite de correcciones con IA por hoy. Vuelve mañana.')
    case 'refusal':
      return t('El tutor no pudo revisar esta respuesta.')
    case 'incomplete':
      return t('El tutor no terminó su revisión. Inténtalo de nuevo.')
    case 'busy':
      return t('El tutor está muy solicitado. Inténtalo en un minuto.')
    default:
      return t('El tutor no está disponible en este momento.')
  }
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error(t('El tutor con IA necesita la conexión con el servidor.'))
  const { data, error } = await supabase.functions.invoke<T>('tutor', { body })
  if (error) {
    // Non-2xx responses carry an error code in the body.
    const res = await (error as { context?: Response }).context?.json?.().catch(() => null)
    // 404 NOT_FOUND from Supabase: the function hasn't been deployed yet.
    if (res?.code === 'NOT_FOUND' || res?.code === 'not_configured') throw new Error(t('El tutor con IA aún no está activado en el servidor.'))
    throw new Error(errorMessage(res?.code))
  }
  if (!data) throw new Error(t('El tutor no está disponible en este momento.'))
  return data
}

export const askTutor = (req: TutorRequest) => invoke<{ feedback: TutorFeedback; remaining: number }>({ mode: 'review', ...req })

/** Why a multiple-choice answer was wrong, explained for the option the student picked. */
export interface Explanation {
  explanation: string
  tip: string
}

export interface SavedExplanation extends Explanation {
  choice: number
}

export interface ExplainRequest {
  area: string
  skill: string
  passage?: string
  prompt: string
  options: string[]
  answer: number
  choice: number
  explanation: string
}

export const explainMistake = (req: ExplainRequest) => invoke<{ explanation: Explanation; remaining: number }>({ mode: 'explain', ...req })

/** A suggested grade for a teacher, who reviews it before saving. */
export interface GradeSuggestion {
  grade: number
  feedback: string
  rationale: string
  strengths: string[]
  improvements: string[]
}

export interface GradeRequest {
  title: string
  instructions: string
  subject: string
  book?: string
  answer: string
}

export const suggestGrade = (req: GradeRequest) => invoke<{ suggestion: GradeSuggestion; remaining: number }>({ mode: 'grade', ...req })
