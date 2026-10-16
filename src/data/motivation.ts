import type { Activity, PaesAnswer, PaesSession } from '../types'
import { skillStats, SKILL_IDS } from './paes'

/** Points for each kind of study activity. */
export const POINTS = {
  paesCorrect: 10,
  paesWrong: 3,
  practiceDone: 20,
  newChapter: 15,
} as const

export const WEEKLY_GOALS = [100, 200, 350, 500]
export const DEFAULT_GOAL = 200
export const LEVEL_SIZE = 250

export const emptyActivity = (): Activity => ({ days: {}, weeklyGoal: DEFAULT_GOAL })

/** Local calendar day as yyyy-mm-dd. */
export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const addDays = (d: Date, n: number) => {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

/** Monday of the week that contains `d`. */
export const weekStart = (d: Date = new Date()) => addDays(d, -((d.getDay() + 6) % 7))

/** Consecutive active days ending today, or yesterday when today has no activity yet. */
export function currentStreak(days: Record<string, number>, today = new Date()) {
  let cursor = days[dayKey(today)] !== undefined ? today : addDays(today, -1)
  let n = 0
  while (days[dayKey(cursor)] !== undefined) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export function bestStreak(days: Record<string, number>) {
  const sorted = Object.keys(days).sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const k of sorted) {
    const expected = prev ? dayKey(addDays(new Date(`${prev}T00:00:00`), 1)) : null
    run = expected === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  }
  return best
}

/** Points per day of the current week, Monday first. */
export function weekDays(days: Record<string, number>, today = new Date()) {
  const start = weekStart(today)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    const key = dayKey(d)
    return { key, date: d, points: days[key] ?? 0, active: days[key] !== undefined, future: key > dayKey(today) }
  })
}

export const weekPoints = (days: Record<string, number>, today = new Date()) => weekDays(days, today).reduce((s, d) => s + d.points, 0)

export const totalPoints = (days: Record<string, number>) => Object.values(days).reduce((s, p) => s + p, 0)

export function levelInfo(total: number) {
  return { level: Math.floor(total / LEVEL_SIZE) + 1, into: total % LEVEL_SIZE, size: LEVEL_SIZE }
}

/** Whether any week reached the goal. */
function reachedGoal(activity: Activity) {
  const weeks: Record<string, number> = {}
  for (const [k, p] of Object.entries(activity.days)) {
    const w = dayKey(weekStart(new Date(`${k}T00:00:00`)))
    weeks[w] = (weeks[w] ?? 0) + p
  }
  return Object.values(weeks).some((p) => p >= activity.weeklyGoal)
}

export type BadgeId = 'primer-paso' | 'racha-3' | 'racha-7' | 'meta' | 'ensayo' | 'dominio' | 'cincuenta' | 'explorador'

export interface Badge {
  id: BadgeId
  title: string
  description: string
  earned: boolean
}

export const BADGE_INFO: Record<BadgeId, { title: string; description: string }> = {
  'primer-paso': { title: 'Primer paso', description: 'Responde tu primera pregunta PAES.' },
  'racha-3': { title: 'En marcha', description: 'Estudia 3 días seguidos.' },
  'racha-7': { title: 'Constancia', description: 'Estudia 7 días seguidos.' },
  meta: { title: 'Meta cumplida', description: 'Alcanza tu meta semanal de puntos.' },
  ensayo: { title: 'Ensayo completo', description: 'Termina un mini ensayo PAES.' },
  dominio: { title: 'Dominio', description: 'Llega al nivel Avanzado en una habilidad.' },
  cincuenta: { title: 'Medio centenar', description: 'Responde 50 preguntas PAES.' },
  explorador: { title: 'Explorador', description: 'Practica las 7 habilidades PAES.' },
}

/** Badges are derived from the data, so they never get out of sync across devices. */
export function badges(activity: Activity, answers: Record<string, PaesAnswer>, sessions: PaesSession[]): Badge[] {
  const stats = skillStats(answers)
  const tries = Object.values(answers).reduce((s, a) => s + a.tries, 0)
  const streak = bestStreak(activity.days)
  const earned: Record<BadgeId, boolean> = {
    'primer-paso': tries > 0,
    'racha-3': streak >= 3,
    'racha-7': streak >= 7,
    meta: reachedGoal(activity),
    ensayo: sessions.some((s) => s.mode === 'ensayo'),
    dominio: SKILL_IDS.some((s) => stats[s].level === 'avanzado'),
    cincuenta: tries >= 50,
    explorador: SKILL_IDS.every((s) => stats[s].answered > 0),
  }
  return (Object.keys(BADGE_INFO) as BadgeId[]).map((id) => ({ id, ...BADGE_INFO[id], earned: earned[id] }))
}
