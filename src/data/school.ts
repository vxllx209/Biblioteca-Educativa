import { getLang } from '../i18n'
import type { Role } from '../types'

/** Asignaturas de enseñanza media (Chile) que puede elegir un profesor o un curso. */
export const SUBJECTS = [
  'Lengua y Literatura',
  'Matemática',
  'Historia, Geografía y Ciencias Sociales',
  'Educación Ciudadana',
  'Filosofía',
  'Ciencias para la Ciudadanía',
  'Biología',
  'Física',
  'Química',
  'Inglés',
  'Artes Visuales',
  'Música',
  'Educación Física y Salud',
  'Tecnología',
  'Religión',
  'Orientación',
] as const

export const ROLES: { value: Role; title: string; description: string }[] = [
  { value: 'Estudiante', title: 'Soy estudiante', description: 'Lee, practica y entrega las tareas de tus cursos.' },
  { value: 'Profesor', title: 'Soy profesor(a)', description: 'Crea cursos, publica tareas y revisa entregas.' },
]

/** Notas en escala chilena: 1,0 a 7,0; 4,0 es la nota mínima de aprobación. */
export const MIN_GRADE = 1
export const MAX_GRADE = 7
export const PASSING_GRADE = 4
export const formatGrade = (g: number) => (getLang() === 'es' ? g.toFixed(1).replace('.', ',') : g.toFixed(1))

/** A yyyy-mm-dd due date at local midnight (a bare date would be parsed as UTC). */
export const localDay = (date: string) => `${date}T00:00:00`
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Parses a grade typed with comma or dot; null when it is outside 1,0–7,0. */
export const parseGrade = (raw: string) => {
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) && n >= MIN_GRADE && n <= MAX_GRADE ? Math.round(n * 10) / 10 : null
}
