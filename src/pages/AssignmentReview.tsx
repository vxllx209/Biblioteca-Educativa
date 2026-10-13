import { BookOpen, CalendarDays, CircleCheck, Clock, PenLine } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, ErrorState, RowSkeleton } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getBook } from '../data/books'
import { getPracticeSet } from '../data/practice'
import { formatGrade, localDay, MAX_GRADE, MIN_GRADE, PASSING_GRADE, parseGrade } from '../data/school'
import { useAsync } from '../hooks/useAsync'
import { cn, dueLabel, formatDate, relativeTime } from '../lib/format'
import { classroom, type Member, type Submission } from '../services/classroom'
import { t } from '../i18n'

type Filter = 'todas' | 'por-revisar' | 'revisadas' | 'sin-entrega'

export default function AssignmentReview() {
  const { courseId = '', assignmentId = '' } = useParams()
  const { user } = useAuth()
  const [filter, setFilter] = useState<Filter>('todas')

  const data = useAsync(async () => {
    const course = (await classroom.teacherCourses(user!.id)).find((c) => c.id === courseId)
    if (!course) return null
    const assignment = (await classroom.assignments([courseId])).find((a) => a.id === assignmentId)
    if (!assignment) return null
    const [members, submissions] = await Promise.all([classroom.members(courseId), classroom.submissions([assignmentId])])
    return { course, assignment, members, submissions }
  }, [courseId, assignmentId, user?.id])

  if (data.loading && !data.data)
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    )
  if (data.error)
    return (
      <ErrorState
        title={t('No pudimos cargar las entregas')}
        description={data.error}
        action={
          <button className="btn-secondary" onClick={data.reload}>
            {t('Reintentar')}
          </button>
        }
      />
    )
  if (!data.data)
    return (
      <EmptyState
        icon={PenLine}
        title={t('Tarea no encontrada')}
        description={t('Puede que se haya eliminado.')}
        action={
          <Link to={`/aula/${courseId}`} className="btn-secondary">
            {t('Volver al curso')}
          </Link>
        }
      />
    )

  const { course, assignment, members, submissions } = data.data
  const byStudent = new Map(submissions.map((s) => [s.studentId, s]))
  const rows = members.map((m) => ({ member: m, submission: byStudent.get(m.studentId) }))
  const statusOf = (s?: Submission): Filter => (!s ? 'sin-entrega' : s.reviewedAt ? 'revisadas' : 'por-revisar')
  const count = (f: Filter) => (f === 'todas' ? rows.length : rows.filter((r) => statusOf(r.submission) === f).length)
  const visible = rows
    .filter((r) => filter === 'todas' || statusOf(r.submission) === filter)
    .sort((a, b) => order(statusOf(a.submission)) - order(statusOf(b.submission)))
  const graded = submissions.filter((s) => s.grade !== undefined)
  const average = graded.length ? graded.reduce((sum, s) => sum + s.grade!, 0) / graded.length : null
  const book = getBook(assignment.bookId)
  const set = assignment.practiceSetId ? getPracticeSet(assignment.practiceSetId) : undefined

  return (
    <div className="animate-fade-in">
      <PageHeader title={assignment.title} subtitle={`${course.name} · ${t(course.subject)}`} back />

      <section className="card mb-6 space-y-4 p-5">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            {formatDate(localDay(assignment.dueDate), { weekday: 'long', day: 'numeric', month: 'long' })} · {dueLabel(localDay(assignment.dueDate))}
          </span>
          {book && (
            <Link to={`/book/${book.id}`} className="inline-flex items-center gap-1.5 hover:text-accent">
              <BookOpen className="size-4" aria-hidden /> {book.title}
            </Link>
          )}
          {set && (
            <span className="inline-flex items-center gap-1.5">
              <PenLine className="size-4" aria-hidden /> {set.title}
            </span>
          )}
        </div>
        {assignment.instructions && <p className="text-[15px] leading-relaxed whitespace-pre-line text-text">{assignment.instructions}</p>}
        <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
          <Stat label={t('Entregas')} value={`${submissions.length}/${members.length}`} />
          <Stat label={t('Por revisar')} value={String(count('por-revisar'))} />
          <Stat label={t('Promedio')} value={average === null ? '—' : formatGrade(average)} />
        </dl>
      </section>

      <div role="group" aria-label={t('Filtrar entregas')} className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        {(
          [
            ['todas', 'Todas'],
            ['por-revisar', 'Por revisar'],
            ['revisadas', 'Revisadas'],
            ['sin-entrega', 'Sin entrega'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn('chip gap-2', filter === value ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-muted hover:text-text')}
          >
            {t(label)}
            <span className={cn('rounded-full px-1.5 text-xs', filter === value ? 'bg-white/20' : 'bg-bg2')}>{count(value)}</span>
          </button>
        ))}
      </div>

      {members.length === 0 ? (
        <EmptyState icon={PenLine} title={t('El curso no tiene estudiantes')} description={t('Comparte el código {code} para que se unan.', { code: course.joinCode })} />
      ) : visible.length ? (
        <ul className="space-y-4">
          {visible.map(({ member, submission }) => (
            <ReviewCard key={member.studentId} member={member} submission={submission} assignmentId={assignment.id} onSaved={data.reload} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted">{t('No hay entregas en este filtro.')}</p>
      )}
    </div>
  )
}

const order = (f: Filter) => ({ 'por-revisar': 0, revisadas: 1, 'sin-entrega': 2, todas: 3 })[f]

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-xl font-semibold text-text tabular-nums">{value}</dd>
    </div>
  )
}

function ReviewCard({ member, submission, assignmentId, onSaved }: { member: Member; submission?: Submission; assignmentId: string; onSaved: () => void }) {
  const toast = useToast()
  const [grade, setGrade] = useState(submission?.grade !== undefined ? formatGrade(submission.grade) : '')
  const [feedback, setFeedback] = useState(submission?.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)
  const parsed = parseGrade(grade)
  const gradeError = touched && parsed === null ? t('Nota entre {min} y {max}.', { min: formatGrade(MIN_GRADE), max: formatGrade(MAX_GRADE) }) : ''

  const save = async () => {
    setTouched(true)
    if (parsed === null || !submission) return
    setSaving(true)
    try {
      await classroom.review(assignmentId, member.studentId, parsed, feedback)
      toast(t('Nota {grade} guardada para {name}', { grade: formatGrade(parsed), name: member.name }))
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('No se pudo guardar la revisión'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: member.avatarColor }} aria-hidden>
          {member.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-text">{member.name}</span>
          <span className="block text-xs text-muted">
            {submission ? t('Entregó {when}', { when: relativeTime(submission.submittedAt).toLowerCase() }) : t('Aún no entrega')}
          </span>
        </span>
        {submission?.reviewedAt ? (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', submission.grade! >= PASSING_GRADE ? 'bg-soft text-accent' : 'bg-error-soft text-error')}>
            <CircleCheck className="size-3.5" aria-hidden /> {formatGrade(submission.grade!)}
          </span>
        ) : submission ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-bg2 px-2.5 py-1 text-xs font-semibold text-muted">
            <Clock className="size-3.5" aria-hidden /> {t('Por revisar')}
          </span>
        ) : null}
      </div>

      {submission && (
        <>
          <p className="mt-4 rounded-xl bg-softer p-4 text-[15px] leading-relaxed whitespace-pre-line text-text">{submission.answer}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
            <div>
              <label htmlFor={`grade-${member.studentId}`} className="label">
                {t('Nota')}
              </label>
              <input
                id={`grade-${member.studentId}`}
                inputMode="decimal"
                placeholder={formatGrade(6.5)}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={!!gradeError}
                className={cn('field text-center text-lg font-semibold', gradeError && 'border-error')}
              />
            </div>
            <div>
              <label htmlFor={`feedback-${member.studentId}`} className="label">
                {t('Retroalimentación')}
              </label>
              <input
                id={`feedback-${member.studentId}`}
                placeholder={t('Qué hizo bien y qué puede mejorar')}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="field"
              />
            </div>
            <button className="btn-primary h-12" onClick={save} disabled={saving}>
              {saving ? t('Guardando…') : submission.reviewedAt ? t('Actualizar') : t('Guardar nota')}
            </button>
          </div>
          {gradeError && <p className="mt-1.5 text-[13px] text-error">{gradeError}</p>}
        </>
      )}
    </li>
  )
}
