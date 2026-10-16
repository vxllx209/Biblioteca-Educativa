import type { Activity, PaesAnswer, PaesSession, PaesSkill, PracticeResult, ReadingProgress } from '../types'
import type { Assignment, Member, Submission } from '../services/classroom'
import { currentStreak, dayKey, emptyActivity, levelInfo, totalPoints, weekPoints } from './motivation'
import { getPaesQuestion, recommendSkill, SKILL_IDS, skillStats, type MasteryLevel, type SkillStat } from './paes'

/** The study data a teacher can read for each student (see the teacher_insights migration). */
export interface StudentData {
  progress: Record<string, ReadingProgress>
  practice: Record<string, PracticeResult>
  paes: { answers: Record<string, PaesAnswer>; sessions: PaesSession[] }
  activity: Activity
}

export const emptyStudentData = (): StudentData => ({ progress: {}, practice: {}, paes: { answers: {}, sessions: [] }, activity: emptyActivity() })

export type Engagement = 'activo' | 'en-riesgo' | 'inactivo' | 'sin-actividad'

export const ENGAGEMENT_LABEL: Record<Engagement, string> = {
  activo: 'Activo',
  'en-riesgo': 'En riesgo',
  inactivo: 'Inactivo',
  'sin-actividad': 'Sin actividad',
}

/** Plural labels for the filter chips. */
export const ENGAGEMENT_FILTER_LABEL: Record<Engagement, string> = {
  activo: 'Activos',
  'en-riesgo': 'En riesgo',
  inactivo: 'Inactivos',
  'sin-actividad': 'Sin actividad',
}

export interface StudentSummary {
  member: Member
  data: StudentData
  /** Last day with any study activity (yyyy-mm-dd). */
  lastActive: string | null
  daysInactive: number | null
  engagement: Engagement
  streak: number
  weekPoints: number
  totalPoints: number
  level: number
  reading: { bookId: string; percent: number; updatedAt: string }[]
  booksFinished: number
  practiceDone: number
  /** Average best score of the practices done, 0..1. */
  practiceAvg: number | null
  paesAnswered: number
  /** Share of PAES questions right the last time, 0..1. */
  paesPct: number | null
  skills: Record<PaesSkill, SkillStat>
  weakestSkill: PaesSkill | null
  sent: number
  reviewed: number
  avgGrade: number | null
  /** Assignments past their due date without a submission. */
  missing: number
}

const DAY = 86_400_000
const toDay = (iso: string) => dayKey(new Date(iso))
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / DAY)

/** Every day with study activity, from the activity log and the timestamps of the other data. */
export function activeDays(d: StudentData) {
  const days = new Set(Object.keys(d.activity.days))
  Object.values(d.progress).forEach((p) => days.add(toDay(p.updatedAt)))
  Object.values(d.practice).forEach((p) => days.add(toDay(p.completedAt)))
  Object.values(d.paes.answers).forEach((a) => days.add(toDay(a.at)))
  return days
}

export function engagementOf(daysInactive: number | null): Engagement {
  if (daysInactive === null) return 'sin-actividad'
  if (daysInactive <= 2) return 'activo'
  if (daysInactive <= 6) return 'en-riesgo'
  return 'inactivo'
}

export function summarizeStudent(member: Member, data: StudentData, assignments: Assignment[], submissions: Submission[], today = new Date()): StudentSummary {
  const todayKey = dayKey(today)
  const days = [...activeDays(data)].sort()
  const lastActive = days.at(-1) ?? null
  const daysInactive = lastActive ? Math.max(0, daysBetween(lastActive, todayKey)) : null
  const practice = Object.values(data.practice)
  const answers = Object.values(data.paes.answers)
  const skills = skillStats(data.paes.answers)
  const mine = submissions.filter((s) => s.studentId === member.studentId)
  const graded = mine.filter((s) => s.grade !== undefined)
  const sentIds = new Set(mine.map((s) => s.assignmentId))
  const total = totalPoints(data.activity.days)
  const progress = Object.values(data.progress)
  return {
    member,
    data,
    lastActive,
    daysInactive,
    engagement: engagementOf(daysInactive),
    streak: currentStreak(data.activity.days, today),
    weekPoints: weekPoints(data.activity.days, today),
    totalPoints: total,
    level: levelInfo(total).level,
    reading: progress
      .filter((p) => p.percent < 100)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((p) => ({ bookId: p.bookId, percent: p.percent, updatedAt: p.updatedAt })),
    booksFinished: progress.filter((p) => p.percent >= 100).length,
    practiceDone: practice.length,
    practiceAvg: practice.length ? practice.reduce((s, p) => s + p.best, 0) / practice.length : null,
    paesAnswered: answers.length,
    paesPct: answers.length ? answers.filter((a) => a.correct).length / answers.length : null,
    skills,
    weakestSkill: answers.length ? recommendSkill(skills) : null,
    sent: mine.length,
    reviewed: graded.length,
    avgGrade: graded.length ? graded.reduce((s, x) => s + x.grade!, 0) / graded.length : null,
    // Only assignments due after the student joined count as missing.
    missing: assignments.filter((a) => a.dueDate < todayKey && a.dueDate >= toDay(member.joinedAt) && !sentIds.has(a.id)).length,
  }
}

/* ---------- Course ---------- */

export interface CourseSkill {
  skill: PaesSkill
  correct: number
  answered: number
  /** Students with at least one answer in the skill. */
  students: number
  pct: number | null
  level: MasteryLevel
}

export interface HardQuestion {
  id: string
  wrong: number
  answered: number
}

export type Alert =
  | { kind: 'inactivos'; students: StudentSummary[] }
  | { kind: 'sin-empezar'; students: StudentSummary[] }
  | { kind: 'en-riesgo'; students: StudentSummary[] }
  | { kind: 'habilidad'; skill: PaesSkill; pct: number }
  | { kind: 'por-revisar'; count: number }
  | { kind: 'atrasadas'; students: StudentSummary[] }

export interface CourseSummary {
  students: StudentSummary[]
  activeThisWeek: number
  avgGrade: number | null
  /** Submissions / (students × assignments already due or with submissions). */
  deliveryRate: number | null
  pendingReviews: number
  skills: Record<PaesSkill, CourseSkill>
  weakestSkill: PaesSkill | null
  hardest: HardQuestion[]
  /** Students active each day, oldest first. */
  daily: { key: string; date: Date; count: number }[]
  alerts: Alert[]
}

export const ACTIVITY_DAYS = 14

const levelFor = (pct: number | null): MasteryLevel => (pct === null ? 'sin-datos' : pct < 0.5 ? 'inicial' : pct < 0.8 ? 'intermedio' : 'avanzado')

export function summarizeCourse(
  members: Member[],
  data: Record<string, StudentData>,
  assignments: Assignment[],
  submissions: Submission[],
  today = new Date(),
): CourseSummary {
  const students = members.map((m) => summarizeStudent(m, data[m.studentId] ?? emptyStudentData(), assignments, submissions, today))
  const sets = students.map((s) => activeDays(s.data))

  const daily = Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (ACTIVITY_DAYS - 1 - i))
    const key = dayKey(date)
    return { key, date, count: sets.filter((d) => d.has(key)).length }
  })

  const skills = {} as Record<PaesSkill, CourseSkill>
  for (const skill of SKILL_IDS) {
    const correct = students.reduce((n, s) => n + s.skills[skill].correct, 0)
    const answered = students.reduce((n, s) => n + s.skills[skill].answered, 0)
    const pct = answered >= 3 ? correct / answered : null
    skills[skill] = { skill, correct, answered, students: students.filter((s) => s.skills[skill].answered > 0).length, pct, level: levelFor(pct) }
  }
  const ranked = SKILL_IDS.map((s) => skills[s]).filter((s) => s.pct !== null).sort((a, b) => a.pct! - b.pct!)
  const weakestSkill = ranked[0]?.skill ?? null

  const byQuestion = new Map<string, HardQuestion>()
  for (const s of students)
    for (const [id, a] of Object.entries(s.data.paes.answers)) {
      if (!getPaesQuestion(id)) continue
      const q = byQuestion.get(id) ?? { id, wrong: 0, answered: 0 }
      q.answered++
      if (!a.correct) q.wrong++
      byQuestion.set(id, q)
    }
  const hardest = [...byQuestion.values()]
    .filter((q) => q.answered >= 2 && q.wrong > 0)
    .sort((a, b) => b.wrong / b.answered - a.wrong / a.answered || b.answered - a.answered)
    .slice(0, 5)

  const graded = submissions.filter((s) => s.grade !== undefined)
  const todayKey = dayKey(today)
  const due = assignments.filter((a) => a.dueDate < todayKey || submissions.some((s) => s.assignmentId === a.id))
  const expected = due.length * members.length
  const delivered = submissions.filter((s) => due.some((a) => a.id === s.assignmentId) && members.some((m) => m.studentId === s.studentId)).length

  const alerts: Alert[] = []
  const inactive = students.filter((s) => s.engagement === 'inactivo')
  const notStarted = students.filter((s) => s.engagement === 'sin-actividad')
  const atRisk = students.filter((s) => s.engagement === 'en-riesgo')
  const late = students.filter((s) => s.missing > 0)
  const pendingReviews = submissions.filter((s) => !s.reviewedAt && members.some((m) => m.studentId === s.studentId)).length
  if (inactive.length) alerts.push({ kind: 'inactivos', students: inactive })
  if (notStarted.length) alerts.push({ kind: 'sin-empezar', students: notStarted })
  if (atRisk.length) alerts.push({ kind: 'en-riesgo', students: atRisk })
  if (late.length) alerts.push({ kind: 'atrasadas', students: late })
  if (weakestSkill && skills[weakestSkill].pct! < 0.6) alerts.push({ kind: 'habilidad', skill: weakestSkill, pct: skills[weakestSkill].pct! })
  if (pendingReviews) alerts.push({ kind: 'por-revisar', count: pendingReviews })

  return {
    students,
    activeThisWeek: students.filter((s) => s.daysInactive !== null && s.daysInactive < 7).length,
    avgGrade: graded.length ? graded.reduce((n, s) => n + s.grade!, 0) / graded.length : null,
    deliveryRate: expected ? delivered / expected : null,
    pendingReviews,
    skills,
    weakestSkill,
    hardest,
    daily,
    alerts,
  }
}
