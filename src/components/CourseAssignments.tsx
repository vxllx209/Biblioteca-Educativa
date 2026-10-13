import { BookOpen, CalendarDays, CircleCheck, Clock, KeyRound, LogOut, MessageSquareText, PenLine, Presentation, Send } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getBook } from '../data/books'
import { getPracticeSet } from '../data/practice'
import { formatGrade, localDay, PASSING_GRADE } from '../data/school'
import { useAsync } from '../hooks/useAsync'
import { cn, daysUntil, dueLabel, formatDate } from '../lib/format'
import { classroom, type Assignment, type Course, type Submission } from '../services/classroom'
import { TextField } from './Form'
import { Modal } from './Modal'
import { SectionHeader } from './PageHeader'
import { RowSkeleton } from './States'
import { t } from '../i18n'

/** Student view of the courses they joined: assignments from their teachers, submissions and grades. */
export function CourseAssignments() {
  const { user } = useAuth()
  const toast = useToast()
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [leaving, setLeaving] = useState<Course | null>(null)

  const data = useAsync(async () => {
    const courses = await classroom.studentCourses(user!.id)
    const assignments = await classroom.assignments(courses.map((c) => c.id))
    const submissions = await classroom.submissions(assignments.map((a) => a.id))
    return { courses, assignments, submissions }
  }, [user?.id])

  const items = useMemo(() => {
    if (!data.data) return []
    const courseOf = new Map(data.data.courses.map((c) => [c.id, c]))
    const subOf = new Map(data.data.submissions.map((s) => [s.assignmentId, s]))
    return data.data.assignments
      .map((a) => ({ assignment: a, course: courseOf.get(a.courseId)!, submission: subOf.get(a.id) }))
      .filter((i) => i.course)
      .sort((a, b) => Number(!!a.submission) - Number(!!b.submission) || a.assignment.dueDate.localeCompare(b.assignment.dueDate))
  }, [data.data])

  const open = items.find((i) => i.assignment.id === openId)

  const join = async (e: FormEvent) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (clean.length !== 6) return setCodeError(t('El código tiene 6 caracteres.'))
    setBusy(true)
    try {
      const course = await classroom.joinCourse(user!.id, clean)
      toast(t('Te uniste a {course}', { course: `${course.name} · ${t(course.subject)}` }))
      setJoining(false)
      setCode('')
      setCodeError('')
      data.reload()
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : t('No pudimos unirte al curso.'))
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    if (!open || !answer.trim()) return
    setBusy(true)
    try {
      await classroom.submit(user!.id, open.assignment.id, answer)
      toast(open.submission ? t('Entrega actualizada') : t('¡Tarea entregada!'))
      setOpenId(null)
      data.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('No se pudo enviar la entrega'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const leave = async () => {
    if (!leaving) return
    setBusy(true)
    try {
      await classroom.leaveCourse(user!.id, leaving.id)
      toast(t('Saliste de {name}', { name: leaving.name }))
      data.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('No se pudo salir del curso'), 'error')
    } finally {
      setBusy(false)
      setLeaving(null)
    }
  }

  const openItem = (id: string, current?: Submission) => {
    setOpenId(id)
    setAnswer(current?.answer ?? '')
  }

  return (
    <section className="mb-10" aria-labelledby="course-tasks">
      <SectionHeader
        id="course-tasks"
        title={t('Tareas de mis cursos')}
        action={
          <button className="btn-secondary min-h-10" onClick={() => setJoining(true)}>
            <KeyRound className="size-4" aria-hidden /> {t('Unirme a un curso')}
          </button>
        }
      />

      {data.loading && !data.data ? (
        <RowSkeleton />
      ) : data.error ? (
        <p className="rounded-xl bg-error-soft px-4 py-3 text-sm text-error">
          {t('No pudimos cargar tus cursos:')} {data.error}{' '}
          <button className="font-semibold underline" onClick={data.reload}>
            {t('Reintentar')}
          </button>
        </p>
      ) : !data.data?.courses.length ? (
        <button
          onClick={() => setJoining(true)}
          className="flex w-full items-center gap-4 rounded-card border border-dashed border-line-active p-5 text-left transition-colors hover:bg-softer"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-accent">
            <Presentation className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-text">{t('¿Tu profesor te dio un código?')}</span>
            <span className="block text-sm text-muted">{t('Únete a su curso para ver y entregar las tareas que publique.')}</span>
          </span>
        </button>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {data.data.courses.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-1 pl-3 text-sm">
                <span className="font-medium text-text">{c.name}</span>
                <span className="text-muted">
                  {t(c.subject)} · {c.teacherName}
                </span>
                <button className="grid size-8 place-items-center rounded-full text-muted hover:bg-bg2 hover:text-text" aria-label={t('Salir de {name}', { name: c.name })} onClick={() => setLeaving(c)}>
                  <LogOut className="size-3.5" aria-hidden />
                </button>
              </span>
            ))}
          </div>
          {items.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {items.map(({ assignment, course, submission }) => (
                <li key={assignment.id}>
                  <button onClick={() => openItem(assignment.id, submission)} className="card flex w-full items-start gap-3 p-4 text-left transition-colors hover:border-line-active">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-soft text-accent">
                      <PenLine className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-text">{assignment.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {course.name} · {t(course.subject)}
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <StatusPill assignment={assignment} submission={submission} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-softer px-4 py-3 text-sm text-muted">{t('Tus profesores aún no publican tareas.')}</p>
          )}
        </>
      )}

      <Modal
        open={joining}
        onClose={() => setJoining(false)}
        title={t('Unirme a un curso')}
        description={t('Ingresa el código de 6 caracteres que te dio tu profesor(a).')}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setJoining(false)}>
              {t('Cancelar')}
            </button>
            <button className="btn-primary" type="submit" form="join-course" disabled={busy}>
              {busy ? t('Uniendo…') : t('Unirme')}
            </button>
          </>
        }
      >
        <form id="join-course" onSubmit={join} noValidate>
          <TextField
            label={t('Código del curso')}
            placeholder="ABC234"
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setCodeError('')
            }}
            error={codeError}
            className="[&_input]:text-center [&_input]:font-mono [&_input]:text-xl [&_input]:tracking-[0.3em]"
            autoFocus
          />
        </form>
      </Modal>

      <Modal
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.assignment.title ?? ''}
        description={open ? `${open.course.name} · ${t(open.course.subject)} · ${open.course.teacherName}` : ''}
        size="lg"
        footer={
          open && (
            <>
              <button className="btn-secondary" onClick={() => setOpenId(null)}>
                {t('Cerrar')}
              </button>
              {!open.submission?.reviewedAt && (
                <button className="btn-primary" onClick={submit} disabled={busy || !answer.trim()}>
                  <Send className="size-4" aria-hidden /> {open.submission ? t('Actualizar entrega') : t('Entregar')}
                </button>
              )}
            </>
          )
        }
      >
        {open && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <StatusPill assignment={open.assignment} submission={open.submission} />
            </div>
            {open.assignment.instructions && <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">{open.assignment.instructions}</p>}
            <Resources assignment={open.assignment} />

            {open.submission?.reviewedAt ? (
              <>
                <div className={cn('flex items-center gap-4 rounded-xl p-4', open.submission.grade! >= PASSING_GRADE ? 'bg-soft' : 'bg-error-soft')}>
                  <span className={cn('text-3xl font-bold tabular-nums', open.submission.grade! >= PASSING_GRADE ? 'text-accent' : 'text-error')}>
                    {formatGrade(open.submission.grade!)}
                  </span>
                  <span className="text-sm text-text">
                    {open.submission.feedback ? (
                      <>
                        <MessageSquareText className="mr-1 inline size-4 text-muted" aria-hidden />
                        {open.submission.feedback}
                      </>
                    ) : (
                      t('Tu profesor(a) revisó la entrega.')
                    )}
                  </span>
                </div>
                <div>
                  <p className="label">{t('Tu respuesta')}</p>
                  <p className="rounded-xl bg-softer p-4 text-[15px] whitespace-pre-line text-text">{open.submission.answer}</p>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="assignment-answer" className="label">
                  {t('Tu respuesta')}
                </label>
                <textarea
                  id="assignment-answer"
                  rows={7}
                  placeholder={t('Escribe aquí tu desarrollo. Puedes editarlo hasta que tu profesor(a) lo revise.')}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="field h-auto py-3"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!leaving}
        onClose={() => setLeaving(null)}
        size="sm"
        title={t('¿Salir del curso?')}
        description={leaving ? t('Dejarás de ver las tareas de {name}. Puedes volver con el mismo código.', { name: leaving.name }) : ''}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setLeaving(null)}>
              {t('Cancelar')}
            </button>
            <button className="btn-danger" onClick={leave} disabled={busy}>
              {t('Salir')}
            </button>
          </>
        }
      />
    </section>
  )
}

function StatusPill({ assignment, submission }: { assignment: Assignment; submission?: Submission }) {
  const due = localDay(assignment.dueDate)
  if (submission?.reviewedAt)
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold', submission.grade! >= PASSING_GRADE ? 'bg-soft text-accent' : 'bg-error-soft text-error')}>
        <CircleCheck className="size-3.5" aria-hidden /> {t('Nota {grade}', { grade: formatGrade(submission.grade!) })}
      </span>
    )
  return (
    <>
      <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold', submission ? 'bg-soft text-accent' : 'bg-bg2 text-muted')}>
        {submission ? <CircleCheck className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
        {submission ? t('Entregada · por revisar') : t('Pendiente')}
      </span>
      <span className={cn('inline-flex items-center gap-1 text-muted', !submission && daysUntil(due) < 0 && 'font-semibold text-error')}>
        <CalendarDays className="size-3.5" aria-hidden />
        {formatDate(due, { day: 'numeric', month: 'short' })} · {dueLabel(due)}
      </span>
    </>
  )
}

function Resources({ assignment }: { assignment: Assignment }) {
  const book = getBook(assignment.bookId)
  const set = assignment.practiceSetId ? getPracticeSet(assignment.practiceSetId) : undefined
  if (!book && !set) return null
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {book && (
        <Link to={`/book/${book.id}`} className="flex items-center gap-3 rounded-[14px] border border-line p-3 transition-colors hover:border-line-active">
          <BookOpen className="size-5 text-accent" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs text-muted">{t('Lectura')}</span>
            <span className="block truncate text-sm font-semibold text-text">{book.title}</span>
          </span>
        </Link>
      )}
      {set && (
        <Link to={`/practice/${set.bookId}/${set.id}`} className="flex items-center gap-3 rounded-[14px] border border-primary bg-softer p-3 transition-colors hover:bg-soft">
          <PenLine className="size-5 text-accent" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs text-muted">{t('Práctica')}</span>
            <span className="block truncate text-sm font-semibold text-text">{set.title}</span>
          </span>
        </Link>
      )}
    </div>
  )
}
