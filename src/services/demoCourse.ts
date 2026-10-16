import { getBook } from '../data/books'
import { dayKey, DEFAULT_GOAL, POINTS } from '../data/motivation'
import { PAES_QUESTIONS } from '../data/paes'
import { getPracticeSet } from '../data/practice'
import { storage, userKey } from '../lib/storage'
import type { Activity, PaesAnswer, PaesSession, PaesSkill, PracticeResult, ReadingProgress } from '../types'
import type { Assignment, Course, Submission } from './classroom'

/**
 * A realistic course for demos in local mode (no Supabase): 12 students with three weeks of
 * reading, practice and PAES activity, two assignments and their submissions.
 * Deterministic, so every demo looks the same.
 */

type Profile = 'constante' | 'irregular' | 'en-riesgo' | 'inactivo' | 'nuevo'

const STUDENTS: { first: string; last: string; color: string; profile: Profile; ability: number }[] = [
  { first: 'Sofía', last: 'Muñoz', color: '#4F806D', profile: 'constante', ability: 0.88 },
  { first: 'Benjamín', last: 'Rojas', color: '#3F5560', profile: 'constante', ability: 0.74 },
  { first: 'Isidora', last: 'Soto', color: '#9C6450', profile: 'constante', ability: 0.81 },
  { first: 'Matías', last: 'González', color: '#6B7448', profile: 'irregular', ability: 0.62 },
  { first: 'Florencia', last: 'Díaz', color: '#C18A45', profile: 'constante', ability: 0.69 },
  { first: 'Agustín', last: 'Contreras', color: '#285B4A', profile: 'en-riesgo', ability: 0.48 },
  { first: 'Emilia', last: 'Silva', color: '#4F806D', profile: 'irregular', ability: 0.77 },
  { first: 'Vicente', last: 'Morales', color: '#3F5560', profile: 'inactivo', ability: 0.41 },
  { first: 'Antonia', last: 'Pérez', color: '#9C6450', profile: 'constante', ability: 0.92 },
  { first: 'Tomás', last: 'Fuentes', color: '#6B7448', profile: 'en-riesgo', ability: 0.55 },
  { first: 'Josefa', last: 'Castillo', color: '#C18A45', profile: 'irregular', ability: 0.66 },
  { first: 'Martín', last: 'Herrera', color: '#285B4A', profile: 'nuevo', ability: 0.6 },
]

/** The course finds Evaluar and Geometría harder: a clear pattern for the skill map. */
const SKILL_SHIFT: Partial<Record<PaesSkill, number>> = { evaluar: -0.28, geometria: -0.22, localizar: 0.1, numeros: 0.05 }

/** Chance of studying on a given day, by days ago (0 = today). */
function studies(profile: Profile, daysAgo: number, r: number) {
  switch (profile) {
    case 'constante':
      return r < (daysAgo < 2 ? 0.95 : 0.8)
    case 'irregular':
      return r < (daysAgo < 2 ? 0.7 : 0.45)
    case 'en-riesgo':
      return daysAgo >= 4 && r < 0.65
    case 'inactivo':
      return daysAgo >= 10 && r < 0.5
    case 'nuevo':
      return false
  }
}

/** Mulberry32: tiny seeded generator. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const daysAgo = (n: number, hour = 18) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, Math.floor(n * 7) % 60, 0, 0)
  return d
}

const ANSWERS = [
  'La censura del ciego funciona como una escuela: Lázaro aprende que para sobrevivir debe desconfiar. El golpe contra el toro marca el paso de la inocencia a la astucia, porque desde ahí "avisa" y piensa cómo valerse por sí mismo.',
  'Creo que el episodio muestra que Lázaro aprende a ser pícaro. El ciego le enseña con violencia y él entiende que está solo.',
  'Lázaro es engañado por el ciego.',
  'El texto muestra el inicio de la formación del pícaro. El narrador adulto mira con ironía al niño "dormido" en la simpleza, y la frase del ciego resume la lección: el mozo debe saber más que el diablo. Esto anticipa los engaños posteriores, como el del jarro de vino.',
  'Lázaro se da cuenta de que tiene que ser más listo. Me parece injusto lo que hace el ciego pero así aprende.',
]

export function createDemoCourse(teacherId: string): Course {
  const rand = rng(4)
  const course = { id: crypto.randomUUID(), teacherId, name: '4° medio B · Demostración', subject: 'Lengua y Literatura', joinCode: `DEMO${String(Math.floor(Math.random() * 90) + 10)}`, createdAt: daysAgo(24).toISOString() }

  const assignments: Assignment[] = [
    {
      id: crypto.randomUUID(),
      courseId: course.id,
      title: 'Análisis: el aprendizaje de Lázaro',
      instructions: 'Lee el Tratado primero y explica en un párrafo cómo cambia Lázaro después del episodio del toro de piedra. Usa al menos una cita.',
      bookId: 'lazarillo-de-tormes',
      practiceSetId: 'lazarillo-ciego',
      dueDate: dayKey(daysAgo(3)),
      createdAt: daysAgo(12).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      courseId: course.id,
      title: 'Lectura: «A la deriva» de Quiroga',
      instructions: 'Lee el cuento y responde la práctica guiada.',
      bookId: 'cuentos-quiroga',
      practiceSetId: 'quiroga-deriva',
      dueDate: dayKey(daysAgo(-5)),
      createdAt: daysAgo(2).toISOString(),
    },
  ]

  const members: { courseId: string; studentId: string; joinedAt: string; name: string; avatarColor: string }[] = []
  const submissions: Submission[] = []

  STUDENTS.forEach((st, i) => {
    const id = `demo-${course.id.slice(0, 8)}-${i}`
    members.push({ courseId: course.id, studentId: id, joinedAt: daysAgo(st.profile === 'nuevo' ? 1 : 22 - (i % 4)).toISOString(), name: `${st.first} ${st.last}`, avatarColor: st.color })

    // Activity and PAES answers, day by day over three weeks.
    const activity: Activity = { days: {}, weeklyGoal: DEFAULT_GOAL }
    const answers: Record<string, PaesAnswer> = {}
    const shuffled = () => [...PAES_QUESTIONS].sort(() => rand() - 0.5)
    let pool = shuffled()
    for (let ago = 20; ago >= 0; ago--) {
      if (!studies(st.profile, ago, rand())) continue
      const key = dayKey(daysAgo(ago))
      let points = 0
      const count = 2 + Math.floor(rand() * 4)
      // Once every question was seen, students start over (and improve a little).
      if (pool.length < count) pool = shuffled()
      for (const q of pool.splice(0, count)) {
        const retry = answers[q.id]
        const correct = rand() < Math.min(0.97, Math.max(0.05, st.ability + (SKILL_SHIFT[q.skill] ?? 0) + (retry ? 0.1 : 0)))
        const choice = correct ? q.answer : (q.answer + 1 + Math.floor(rand() * 3)) % 4
        answers[q.id] = { choice, correct, at: daysAgo(ago, 17).toISOString(), tries: (retry?.tries ?? 0) + 1 }
        points += correct ? POINTS.paesCorrect : POINTS.paesWrong
      }
      if (rand() < 0.5) points += POINTS.newChapter
      activity.days[key] = points
    }

    const sessions: PaesSession[] = []
    const answered = Object.entries(answers)
    if (answered.length >= 8) {
      const slice = answered.slice(0, 14)
      sessions.push({
        id: `ps-demo-${i}`,
        mode: 'diagnostico',
        score: slice.filter(([, a]) => a.correct).length,
        max: slice.length,
        completedAt: slice.at(-1)![1].at,
        bySkill: {},
      })
    }

    // Reading and practice.
    const progress: Record<string, ReadingProgress> = {}
    const practice: Record<string, PracticeResult> = {}
    if (st.profile !== 'nuevo') {
      const lastDay = Object.keys(activity.days).sort().at(-1)
      const updatedAt = lastDay ? `${lastDay}T19:00:00.000Z` : daysAgo(15).toISOString()
      const laz = getBook('lazarillo-de-tormes')
      if (laz) progress[laz.id] = { bookId: laz.id, chapter: 2, position: 0.3, percent: Math.round(30 + st.ability * 60), updatedAt, bookmarks: [] }
      if (st.ability > 0.65) progress['cuentos-quiroga'] = { bookId: 'cuentos-quiroga', chapter: 9, position: 0.5, percent: Math.round(20 + rand() * 40), updatedAt, bookmarks: [] }
      for (const setId of ['lazarillo-ciego', 'marti-heroes', 'mate4-financiera'].slice(0, st.profile === 'inactivo' ? 1 : 3)) {
        const set = getPracticeSet(setId)
        if (!set || rand() < 0.25) continue
        const best = Math.round(Math.min(1, Math.max(0.2, st.ability + (rand() - 0.5) * 0.3)) * 10) / 10
        practice[setId] = { setId, bookId: set.bookId, chapter: set.chapter, score: best * 10, max: 10, best, attempts: 1, completedAt: updatedAt }
      }
    }

    // Submissions to the assignment already due: most delivered, some graded.
    if (st.profile !== 'nuevo' && st.profile !== 'inactivo' && !(st.profile === 'en-riesgo' && i % 2)) {
      const answer = ANSWERS[i % ANSWERS.length]
      const graded = i % 3 !== 0
      const grade = Math.round(Math.min(7, Math.max(2.5, 1 + st.ability * 6.2)) * 10) / 10
      submissions.push({
        assignmentId: assignments[0].id,
        studentId: id,
        answer,
        submittedAt: daysAgo(4 + (i % 3)).toISOString(),
        ...(graded ? { grade, feedback: grade >= 6 ? '¡Muy buen análisis! Usaste bien la cita.' : 'Desarrolla más tu idea y apóyala con una cita del texto.', reviewedAt: daysAgo(2).toISOString() } : {}),
      })
    }

    storage.set(userKey(id, 'activity.v1'), activity)
    storage.set(userKey(id, 'paes.v1'), { answers, sessions })
    storage.set(userKey(id, 'progress.v2'), progress)
    storage.set(userKey(id, 'practice.v1'), practice)
  })

  const store = storage.get<{ courses: unknown[]; members: unknown[]; assignments: unknown[]; submissions: unknown[] }>('classroom', {
    courses: [],
    members: [],
    assignments: [],
    submissions: [],
  })
  storage.set('classroom', {
    courses: [...store.courses, course],
    members: [...store.members, ...members],
    assignments: [...store.assignments, ...assignments],
    submissions: [...store.submissions, ...submissions],
  })
  return { ...course, teacherName: '' }
}
