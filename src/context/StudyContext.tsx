import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { badges, currentStreak, dayKey, emptyActivity, levelInfo, POINTS, totalPoints, weekPoints, type Badge } from '../data/motivation'
import { useSyncedState } from '../hooks/useSyncedState'
import type { Activity, PaesAnswer, PaesQuestion, PaesSession } from '../types'
import { useAuth } from './AuthContext'

interface PaesState {
  answers: Record<string, PaesAnswer>
  sessions: PaesSession[]
}

interface StudyValue {
  activity: Activity
  /** Adds points to today (0 just marks the day as active, which keeps the streak). */
  logActivity: (points: number) => void
  setWeeklyGoal: (points: number) => void
  streak: number
  weekPoints: number
  totalPoints: number
  level: ReturnType<typeof levelInfo>
  badges: Badge[]

  paes: PaesState
  /** Records an answer and returns the points earned. */
  answerPaes: (q: PaesQuestion, choice: number) => number
  finishPaesSession: (s: Omit<PaesSession, 'id' | 'completedAt'>) => PaesSession
}

const StudyContext = createContext<StudyValue | null>(null)

/** Keep the session history bounded; mastery comes from the latest answer per question. */
const MAX_SESSIONS = 60

/** PAES answers and study activity (points, streak, weekly goal), synced like the rest of the user's data. */
export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.id ?? null
  const [activity, setActivity] = useSyncedState<Activity>(uid, 'activity.v1', emptyActivity)
  const [paes, setPaes] = useSyncedState<PaesState>(uid, 'paes.v1', () => ({ answers: {}, sessions: [] }))

  const logActivity = useCallback(
    (points: number) =>
      setActivity((a) => {
        const k = dayKey()
        // The reader saves on every page turn: don't create new state when nothing changes.
        if (points === 0 && a.days[k] !== undefined) return a
        return { ...a, days: { ...a.days, [k]: (a.days[k] ?? 0) + points } }
      }),
    [setActivity],
  )

  const setWeeklyGoal = useCallback((weeklyGoal: number) => setActivity((a) => ({ ...a, weeklyGoal })), [setActivity])

  const answerPaes = useCallback(
    (q: PaesQuestion, choice: number) => {
      const correct = choice === q.answer
      setPaes((p) => ({
        ...p,
        answers: { ...p.answers, [q.id]: { choice, correct, at: new Date().toISOString(), tries: (p.answers[q.id]?.tries ?? 0) + 1 } },
      }))
      const points = correct ? POINTS.paesCorrect : POINTS.paesWrong
      logActivity(points)
      return points
    },
    [setPaes, logActivity],
  )

  const finishPaesSession = useCallback(
    (s: Omit<PaesSession, 'id' | 'completedAt'>) => {
      const session: PaesSession = { ...s, id: `ps-${Date.now().toString(36)}`, completedAt: new Date().toISOString() }
      setPaes((p) => ({ ...p, sessions: [session, ...p.sessions].slice(0, MAX_SESSIONS) }))
      return session
    },
    [setPaes],
  )

  const value = useMemo<StudyValue>(() => {
    const total = totalPoints(activity.days)
    return {
      activity,
      logActivity,
      setWeeklyGoal,
      streak: currentStreak(activity.days),
      weekPoints: weekPoints(activity.days),
      totalPoints: total,
      level: levelInfo(total),
      badges: badges(activity, paes.answers, paes.sessions),
      paes,
      answerPaes,
      finishPaesSession,
    }
  }, [activity, logActivity, setWeeklyGoal, paes, answerPaes, finishPaesSession])

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
}

export function useStudy() {
  const ctx = useContext(StudyContext)
  if (!ctx) throw new Error('useStudy must be used within StudyProvider')
  return ctx
}
