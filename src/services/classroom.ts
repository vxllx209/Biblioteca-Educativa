import { storage } from '../lib/storage'
import { supabase } from '../lib/supabase'
import type { User } from '../types'
import { t } from '../i18n'

/**
 * Cursos, tareas y entregas. With Supabase configured everything goes through the
 * tables of the classroom migration (RLS decides who sees what); otherwise a shared
 * localStorage store lets a teacher and a student account on the same browser try it out.
 */
export interface Course {
  id: string
  teacherId: string
  teacherName: string
  name: string
  subject: string
  joinCode: string
  createdAt: string
}

export interface Member {
  studentId: string
  name: string
  avatarColor: string
  joinedAt: string
}

export interface Assignment {
  id: string
  courseId: string
  title: string
  instructions: string
  bookId?: string
  practiceSetId?: string
  /** yyyy-mm-dd */
  dueDate: string
  createdAt: string
}

export interface Submission {
  assignmentId: string
  studentId: string
  answer: string
  submittedAt: string
  grade?: number
  feedback?: string
  reviewedAt?: string
}

export type NewAssignment = Pick<Assignment, 'title' | 'instructions' | 'bookId' | 'practiceSetId' | 'dueDate'>

// Unambiguous characters only (no 0/O, 1/I/L) so codes are easy to dictate in class.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const newJoinCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
const fullName = (first?: string | null, last?: string | null) => [first, last].filter(Boolean).join(' ').trim() || t('Sin nombre')

// ---------- Supabase ----------

interface CourseRow {
  id: string
  teacher_id: string
  name: string
  subject: string
  join_code: string
  created_at: string
}
interface AssignmentRow {
  id: string
  course_id: string
  title: string
  instructions: string
  book_id: string | null
  practice_set_id: string | null
  due_date: string
  created_at: string
}
interface SubmissionRow {
  assignment_id: string
  student_id: string
  answer: string
  submitted_at: string
  grade: number | string | null
  feedback: string | null
  reviewed_at: string | null
}

function db() {
  if (!supabase) throw new Error('Supabase no está configurado')
  return supabase
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

async function profileNames(ids: string[]) {
  const map = new Map<string, { name: string; avatarColor: string }>()
  if (!ids.length) return map
  const rows = check(await db().from('profiles').select('id, first_name, last_name, avatar_color').in('id', [...new Set(ids)])) as {
    id: string
    first_name: string
    last_name: string
    avatar_color: string
  }[]
  rows.forEach((r) => map.set(r.id, { name: fullName(r.first_name, r.last_name), avatarColor: r.avatar_color }))
  return map
}

async function toCourses(rows: CourseRow[]): Promise<Course[]> {
  const names = await profileNames(rows.map((r) => r.teacher_id))
  return rows.map((r) => ({
    id: r.id,
    teacherId: r.teacher_id,
    teacherName: names.get(r.teacher_id)?.name ?? 'Profesor(a)',
    name: r.name,
    subject: r.subject,
    joinCode: r.join_code,
    createdAt: r.created_at,
  }))
}

const toAssignment = (r: AssignmentRow): Assignment => ({
  id: r.id,
  courseId: r.course_id,
  title: r.title,
  instructions: r.instructions,
  bookId: r.book_id ?? undefined,
  practiceSetId: r.practice_set_id ?? undefined,
  dueDate: r.due_date,
  createdAt: r.created_at,
})

const toSubmission = (r: SubmissionRow): Submission => ({
  assignmentId: r.assignment_id,
  studentId: r.student_id,
  answer: r.answer,
  submittedAt: r.submitted_at,
  grade: r.grade === null ? undefined : Number(r.grade),
  feedback: r.feedback ?? undefined,
  reviewedAt: r.reviewed_at ?? undefined,
})

const remote = {
  async teacherCourses(userId: string) {
    const rows = check(await db().from('courses').select('*').eq('teacher_id', userId).order('created_at', { ascending: false }))
    return toCourses(rows as CourseRow[])
  },
  async createCourse(userId: string, data: { name: string; subject: string }) {
    for (let attempt = 0; ; attempt++) {
      const res = await db()
        .from('courses')
        .insert({ teacher_id: userId, name: data.name.trim(), subject: data.subject })
        .select()
        .single()
      // 23505: the random join code collided with another course; try a new one.
      if (res.error?.code === '23505' && attempt < 3) continue
      return (await toCourses([check(res) as CourseRow]))[0]
    }
  },
  async deleteCourse(courseId: string) {
    check(await db().from('courses').delete().eq('id', courseId))
  },
  async members(courseId: string): Promise<Member[]> {
    const rows = check(await db().rpc('course_roster', { c: courseId })) as {
      student_id: string
      first_name: string | null
      last_name: string | null
      avatar_color: string | null
      joined_at: string
    }[]
    return rows
      .map((r) => ({ studentId: r.student_id, joinedAt: r.joined_at, name: fullName(r.first_name, r.last_name), avatarColor: r.avatar_color ?? '#4F806D' }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  },
  async removeMember(courseId: string, studentId: string) {
    check(await db().from('course_members').delete().eq('course_id', courseId).eq('student_id', studentId))
  },
  async assignments(courseIds: string[]) {
    if (!courseIds.length) return []
    const rows = check(await db().from('assignments').select('*').in('course_id', courseIds).order('due_date'))
    return (rows as AssignmentRow[]).map(toAssignment)
  },
  async createAssignment(courseId: string, data: NewAssignment) {
    const row = check(
      await db()
        .from('assignments')
        .insert({
          course_id: courseId,
          title: data.title.trim(),
          instructions: data.instructions.trim(),
          book_id: data.bookId || null,
          practice_set_id: data.practiceSetId || null,
          due_date: data.dueDate,
        })
        .select()
        .single(),
    )
    return toAssignment(row as AssignmentRow)
  },
  async deleteAssignment(assignmentId: string) {
    check(await db().from('assignments').delete().eq('id', assignmentId))
  },
  async submissions(assignmentIds: string[]) {
    if (!assignmentIds.length) return []
    const rows = check(await db().from('submissions').select('*').in('assignment_id', assignmentIds))
    return (rows as SubmissionRow[]).map(toSubmission)
  },
  async review(assignmentId: string, studentId: string, grade: number, feedback: string) {
    check(
      await db()
        .from('submissions')
        .update({ grade, feedback: feedback.trim() || null, reviewed_at: new Date().toISOString() })
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId),
    )
  },
  async joinCourse(_userId: string, code: string) {
    const res = await db().rpc('join_course', { code })
    if (res.error)
      throw new Error(
        res.error.message.includes('not found')
          ? t('No existe un curso con ese código.')
          : res.error.message.includes('teachers')
            ? t('Las cuentas de profesor no pueden unirse a cursos.')
            : res.error.message,
      )
    const course = (await remote.studentCourses(_userId)).find((c) => c.id === res.data)
    if (!course) throw new Error(t('No pudimos unirte al curso.'))
    return course
  },
  async leaveCourse(userId: string, courseId: string) {
    check(await db().from('course_members').delete().eq('course_id', courseId).eq('student_id', userId))
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async studentCourses(_userId: string): Promise<Course[]> {
    const rows = check(await db().rpc('my_courses')) as (CourseRow & { teacher_name: string | null })[]
    return rows.map((r) => ({
      id: r.id,
      teacherId: r.teacher_id,
      teacherName: r.teacher_name || 'Profesor(a)',
      name: r.name,
      subject: r.subject,
      joinCode: r.join_code,
      createdAt: r.created_at,
    }))
  },
  async submit(userId: string, assignmentId: string, answer: string) {
    check(
      await db()
        .from('submissions')
        .upsert({ assignment_id: assignmentId, student_id: userId, answer: answer.trim(), submitted_at: new Date().toISOString() }),
    )
  },
}

// ---------- Local (localStorage) ----------

interface LocalStore {
  courses: Omit<Course, 'teacherName'>[]
  members: { courseId: string; studentId: string; joinedAt: string }[]
  assignments: Assignment[]
  submissions: Submission[]
}

const KEY = 'classroom'
const read = (): LocalStore => storage.get<LocalStore>(KEY, { courses: [], members: [], assignments: [], submissions: [] })
function write(fn: (s: LocalStore) => LocalStore) {
  storage.set(KEY, fn(read()))
}
const localUsers = () => storage.get<User[]>('users', [])
const userName = (id: string) => {
  const u = localUsers().find((x) => x.id === id)
  return u ? { name: fullName(u.firstName, u.lastName), avatarColor: u.avatarColor } : { name: t('Sin nombre'), avatarColor: '#4F806D' }
}
const withTeacher = (c: Omit<Course, 'teacherName'>): Course => ({ ...c, teacherName: userName(c.teacherId).name })
const tick = () => new Promise((r) => setTimeout(r, 150))
const now = () => new Date().toISOString()

const local: typeof remote = {
  async teacherCourses(userId) {
    await tick()
    return read()
      .courses.filter((c) => c.teacherId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withTeacher)
  },
  async createCourse(userId, data) {
    await tick()
    const taken = new Set(read().courses.map((c) => c.joinCode))
    let joinCode = newJoinCode()
    while (taken.has(joinCode)) joinCode = newJoinCode()
    const course = { id: crypto.randomUUID(), teacherId: userId, name: data.name.trim(), subject: data.subject, joinCode, createdAt: now() }
    write((s) => ({ ...s, courses: [...s.courses, course] }))
    return withTeacher(course)
  },
  async deleteCourse(courseId) {
    await tick()
    write((s) => {
      const gone = new Set(s.assignments.filter((a) => a.courseId === courseId).map((a) => a.id))
      return {
        courses: s.courses.filter((c) => c.id !== courseId),
        members: s.members.filter((m) => m.courseId !== courseId),
        assignments: s.assignments.filter((a) => !gone.has(a.id)),
        submissions: s.submissions.filter((x) => !gone.has(x.assignmentId)),
      }
    })
  },
  async members(courseId) {
    await tick()
    return read()
      .members.filter((m) => m.courseId === courseId)
      .map((m) => ({ studentId: m.studentId, joinedAt: m.joinedAt, ...userName(m.studentId) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  },
  async removeMember(courseId, studentId) {
    await tick()
    write((s) => ({ ...s, members: s.members.filter((m) => !(m.courseId === courseId && m.studentId === studentId)) }))
  },
  async assignments(courseIds) {
    await tick()
    return read()
      .assignments.filter((a) => courseIds.includes(a.courseId))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  },
  async createAssignment(courseId, data) {
    await tick()
    const a: Assignment = {
      id: crypto.randomUUID(),
      courseId,
      title: data.title.trim(),
      instructions: data.instructions.trim(),
      bookId: data.bookId || undefined,
      practiceSetId: data.practiceSetId || undefined,
      dueDate: data.dueDate,
      createdAt: now(),
    }
    write((s) => ({ ...s, assignments: [...s.assignments, a] }))
    return a
  },
  async deleteAssignment(assignmentId) {
    await tick()
    write((s) => ({
      ...s,
      assignments: s.assignments.filter((a) => a.id !== assignmentId),
      submissions: s.submissions.filter((x) => x.assignmentId !== assignmentId),
    }))
  },
  async submissions(assignmentIds) {
    await tick()
    return read().submissions.filter((x) => assignmentIds.includes(x.assignmentId))
  },
  async review(assignmentId, studentId, grade, feedback) {
    await tick()
    write((s) => ({
      ...s,
      submissions: s.submissions.map((x) =>
        x.assignmentId === assignmentId && x.studentId === studentId ? { ...x, grade, feedback: feedback.trim() || undefined, reviewedAt: now() } : x,
      ),
    }))
  },
  async joinCourse(userId, code) {
    await tick()
    const course = read().courses.find((c) => c.joinCode === code.trim().toUpperCase())
    if (!course) throw new Error(t('No existe un curso con ese código.'))
    write((s) =>
      s.members.some((m) => m.courseId === course.id && m.studentId === userId)
        ? s
        : { ...s, members: [...s.members, { courseId: course.id, studentId: userId, joinedAt: now() }] },
    )
    return withTeacher(course)
  },
  async leaveCourse(userId, courseId) {
    await tick()
    write((s) => ({ ...s, members: s.members.filter((m) => !(m.courseId === courseId && m.studentId === userId)) }))
  },
  async studentCourses(userId) {
    await tick()
    const s = read()
    const ids = new Set(s.members.filter((m) => m.studentId === userId).map((m) => m.courseId))
    return s.courses.filter((c) => ids.has(c.id)).map(withTeacher)
  },
  async submit(userId, assignmentId, answer) {
    await tick()
    write((s) => {
      const existing = s.submissions.find((x) => x.assignmentId === assignmentId && x.studentId === userId)
      if (existing?.reviewedAt) throw new Error(t('La entrega ya fue revisada.'))
      const next: Submission = { assignmentId, studentId: userId, answer: answer.trim(), submittedAt: now() }
      return { ...s, submissions: [...s.submissions.filter((x) => x !== existing), next] }
    })
  },
}

export const classroom = supabase ? remote : local
