import type { PaesAnswer, PaesArea, PaesMode, PaesPassage, PaesQuestion, PaesSkill, Question } from '../../types'
import { LECTORA, PASSAGES } from './lectora'
import { M1 } from './m1'

export { PASSAGES }

export const PAES_QUESTIONS: PaesQuestion[] = [...LECTORA, ...M1]

export const AREAS: { id: PaesArea; title: string; short: string; description: string; skills: PaesSkill[] }[] = [
  {
    id: 'lectora',
    title: 'Competencia Lectora',
    short: 'Lectora',
    description: 'Textos literarios y no literarios de la biblioteca.',
    skills: ['localizar', 'interpretar', 'evaluar'],
  },
  {
    id: 'm1',
    title: 'Competencia Matemática 1',
    short: 'M1',
    description: 'Problemas de los cuatro ejes de la prueba.',
    skills: ['numeros', 'algebra', 'geometria', 'probabilidad'],
  },
]

export const SKILLS: Record<PaesSkill, { label: string; area: PaesArea; description: string }> = {
  localizar: { label: 'Localizar', area: 'lectora', description: 'Encontrar información explícita en el texto.' },
  interpretar: { label: 'Interpretar', area: 'lectora', description: 'Comprender el sentido de expresiones, ideas y relaciones.' },
  evaluar: { label: 'Evaluar', area: 'lectora', description: 'Juzgar el propósito, los recursos y la validez de un texto.' },
  numeros: { label: 'Números', area: 'm1', description: 'Porcentajes, potencias, proporciones e interés.' },
  algebra: { label: 'Álgebra y funciones', area: 'm1', description: 'Ecuaciones, sistemas y funciones lineales y cuadráticas.' },
  geometria: { label: 'Geometría', area: 'm1', description: 'Áreas, perímetros, Pitágoras, semejanza y transformaciones.' },
  probabilidad: { label: 'Probabilidad y estadística', area: 'm1', description: 'Probabilidades, medidas de tendencia central y porcentajes.' },
}

export const SKILL_IDS = Object.keys(SKILLS) as PaesSkill[]

export const getPaesQuestion = (id: string) => PAES_QUESTIONS.find((q) => q.id === id)
export const getPassage = (id?: string): PaesPassage | undefined => PASSAGES.find((p) => p.id === id)

/** PAES items rendered with the practice question component. */
export const asChoice = (q: PaesQuestion): Question => ({
  id: q.id,
  kind: 'choice',
  prompt: q.prompt,
  options: q.options,
  answer: q.answer,
  explanation: q.explanation,
})

/* ---------- Mastery ---------- */

export type MasteryLevel = 'sin-datos' | 'inicial' | 'intermedio' | 'avanzado'

export const MASTERY_LABEL: Record<MasteryLevel, string> = {
  'sin-datos': 'Sin datos',
  inicial: 'Inicial',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export interface SkillStat {
  skill: PaesSkill
  /** Questions of the skill answered at least once. */
  answered: number
  /** Answered correctly the last time. */
  correct: number
  total: number
  /** 0..1, null when there isn't enough data. */
  pct: number | null
  level: MasteryLevel
}

/** Minimum answers before a skill gets a mastery level, and before it can be Advanced. */
const MIN_ANSWERS = 2
const MIN_ADVANCED = 4

export function skillStats(answers: Record<string, PaesAnswer>): Record<PaesSkill, SkillStat> {
  const out = {} as Record<PaesSkill, SkillStat>
  for (const skill of SKILL_IDS) {
    const qs = PAES_QUESTIONS.filter((q) => q.skill === skill)
    const done = qs.filter((q) => answers[q.id])
    const correct = done.filter((q) => answers[q.id].correct).length
    const pct = done.length >= MIN_ANSWERS ? correct / done.length : null
    const level: MasteryLevel =
      pct === null ? 'sin-datos' : pct < 0.5 ? 'inicial' : pct < 0.8 || done.length < MIN_ADVANCED ? 'intermedio' : 'avanzado'
    out[skill] = { skill, answered: done.length, correct, total: qs.length, pct, level }
  }
  return out
}

/** Weakest skill with data; otherwise the first one not explored yet. Null when everything is advanced. */
export function recommendSkill(stats: Record<PaesSkill, SkillStat>): PaesSkill | null {
  const list = SKILL_IDS.map((s) => stats[s])
  const weak = list.filter((s) => s.pct !== null && s.pct < 0.8).sort((a, b) => a.pct! - b.pct!)
  if (weak.length) return weak[0].skill
  return list.find((s) => s.pct === null)?.skill ?? null
}

/* ---------- Sessions ---------- */

const PASSAGE_ORDER = new Map(PASSAGES.map((p, i) => [p.id, i]))
const byPassage = (a: PaesQuestion, b: PaesQuestion) => (PASSAGE_ORDER.get(a.passageId ?? '') ?? 99) - (PASSAGE_ORDER.get(b.passageId ?? '') ?? 99)

export const SKILL_SESSION_SIZE = 8

/** Question ids for a session. Skill practice puts new and missed questions first. */
export function buildSession(mode: PaesMode, target: string | undefined, answers: Record<string, PaesAnswer>): string[] {
  if (mode === 'ensayo') return PAES_QUESTIONS.filter((q) => q.area === target).map((q) => q.id)
  if (mode === 'habilidad') {
    const rank = (q: PaesQuestion) => (!answers[q.id] ? 0 : answers[q.id].correct ? 2 : 1)
    return PAES_QUESTIONS.filter((q) => q.skill === target)
      .sort((a, b) => rank(a) - rank(b) || byPassage(a, b))
      .slice(0, SKILL_SESSION_SIZE)
      .sort(byPassage)
      .map((q) => q.id)
  }
  // Diagnostic: two questions per skill, from different texts in Lectora.
  const picked = SKILL_IDS.flatMap((skill) => {
    const qs = PAES_QUESTIONS.filter((q) => q.skill === skill)
    const seen = new Set<string | undefined>()
    const varied = qs.filter((q) => (q.passageId && seen.has(q.passageId) ? false : (seen.add(q.passageId), true)))
    return varied.slice(0, 2)
  })
  return [...picked.filter((q) => q.area === 'lectora').sort(byPassage), ...picked.filter((q) => q.area === 'm1')].map((q) => q.id)
}

export const MODE_LABEL: Record<PaesMode, string> = {
  diagnostico: 'Diagnóstico',
  habilidad: 'Práctica por habilidad',
  ensayo: 'Mini ensayo',
}

export function sessionTitle(mode: PaesMode, target?: string) {
  if (mode === 'habilidad' && target && target in SKILLS) return SKILLS[target as PaesSkill].label
  if (mode === 'ensayo') return AREAS.find((a) => a.id === target)?.title ?? MODE_LABEL.ensayo
  return MODE_LABEL[mode]
}

export const isValidSession = (mode: string, target?: string): mode is PaesMode =>
  mode === 'diagnostico' ||
  (mode === 'habilidad' && !!target && target in SKILLS) ||
  (mode === 'ensayo' && AREAS.some((a) => a.id === target))
