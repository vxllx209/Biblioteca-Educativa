import { BookOpen, CalendarDays, ChevronRight, ClipboardList, Copy, Plus, Trash2, UserMinus, Users } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TextField } from '../components/Form'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, ErrorState, RowSkeleton } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { BOOKS, getBook } from '../data/books'
import { getPracticeSet, setsForBook } from '../data/practice'
import { localDay, todayISO } from '../data/school'
import { useAsync } from '../hooks/useAsync'
import { copyCode } from '../lib/clipboard'
import { cn, dueLabel, formatDate } from '../lib/format'
import { classroom, type NewAssignment } from '../services/classroom'

type Tab = 'tareas' | 'estudiantes'
type Confirm = { kind: 'course' } | { kind: 'assignment'; id: string; title: string } | { kind: 'member'; id: string; name: string }

const EMPTY: NewAssignment = { title: '', instructions: '', dueDate: '', bookId: '', practiceSetId: '' }

export default function CourseDetail() {
  const { courseId = '' } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('tareas')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<NewAssignment>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<Confirm | null>(null)

  const data = useAsync(async () => {
    const course = (await classroom.teacherCourses(user!.id)).find((c) => c.id === courseId)
    if (!course) return null
    const [members, assignments] = await Promise.all([classroom.members(courseId), classroom.assignments([courseId])])
    const submissions = await classroom.submissions(assignments.map((a) => a.id))
    return { course, members, assignments, submissions }
  }, [courseId, user?.id])

  const stats = useMemo(() => {
    const map = new Map<string, { sent: number; reviewed: number }>()
    data.data?.submissions.forEach((s) => {
      const e = map.get(s.assignmentId) ?? { sent: 0, reviewed: 0 }
      e.sent++
      if (s.reviewedAt) e.reviewed++
      map.set(s.assignmentId, e)
    })
    return map
  }, [data.data])

  const sets = form.bookId ? setsForBook(form.bookId) : []
  const errors = {
    title: form.title.trim() ? '' : 'Escribe un título para la tarea.',
    dueDate: !form.dueDate ? 'Elige la fecha de entrega.' : form.dueDate < todayISO() ? 'La fecha no puede estar en el pasado.' : '',
  }

  const createAssignment = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (errors.title || errors.dueDate) return
    setBusy(true)
    try {
      await classroom.createAssignment(courseId, form)
      toast('Tarea publicada para el curso')
      setCreating(false)
      setForm(EMPTY)
      setSubmitted(false)
      data.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo publicar la tarea', 'error')
    } finally {
      setBusy(false)
    }
  }

  const runConfirm = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      if (confirm.kind === 'course') {
        await classroom.deleteCourse(courseId)
        toast('Curso eliminado')
        return navigate('/aula', { replace: true })
      }
      if (confirm.kind === 'assignment') await classroom.deleteAssignment(confirm.id)
      else await classroom.removeMember(courseId, confirm.id)
      toast(confirm.kind === 'assignment' ? 'Tarea eliminada' : 'Estudiante quitado del curso')
      data.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo completar la acción', 'error')
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

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
        title="No pudimos cargar el curso"
        description={data.error}
        action={
          <button className="btn-secondary" onClick={data.reload}>
            Reintentar
          </button>
        }
      />
    )
  if (!data.data)
    return (
      <EmptyState
        icon={Users}
        title="Curso no encontrado"
        description="Puede que se haya eliminado o que pertenezca a otro profesor."
        action={
          <Link to="/aula" className="btn-secondary">
            Volver a mis cursos
          </Link>
        }
      />
    )

  const { course, members, assignments } = data.data

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={course.name}
        subtitle={course.subject}
        back
        actions={
          <button className="btn-ghost" onClick={() => setConfirm({ kind: 'course' })}>
            <Trash2 className="size-4" aria-hidden /> Eliminar curso
          </button>
        }
      />

      <section className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold text-text">Código del curso</p>
          <p className="text-[13px] text-muted">Tus estudiantes lo ingresan en «Mis tareas» para unirse.</p>
        </div>
        <button onClick={() => copyCode(course.joinCode, toast)} className="btn-secondary font-mono text-lg tracking-[0.2em]">
          {course.joinCode} <Copy className="size-4" aria-hidden />
        </button>
      </section>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex gap-2">
          {(
            [
              ['tareas', `Tareas (${assignments.length})`],
              ['estudiantes', `Estudiantes (${members.length})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn('chip', tab === value ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-muted hover:text-text')}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'tareas' && (
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus className="size-5" aria-hidden /> Nueva tarea
          </button>
        )}
      </div>

      {tab === 'tareas' ? (
        assignments.length ? (
          <ul className="space-y-3">
            {assignments.map((a) => {
              const s = stats.get(a.id) ?? { sent: 0, reviewed: 0 }
              const pending = s.sent - s.reviewed
              return (
                <li key={a.id} className="card flex items-center gap-3 p-4">
                  <Link to={`/aula/${course.id}/tarea/${a.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-accent">
                      <ClipboardList className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-text group-hover:text-accent">{a.title}</span>
                      <span className="flex flex-wrap gap-x-3 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {formatDate(localDay(a.dueDate))} · {dueLabel(localDay(a.dueDate))}
                        </span>
                        <span>
                          {s.sent}/{members.length} entregas
                        </span>
                        {pending > 0 && <span className="font-semibold text-accent">{pending} por revisar</span>}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-muted" aria-hidden />
                  </Link>
                  <button className="btn-ghost size-11 px-0" aria-label={`Eliminar ${a.title}`} onClick={() => setConfirm({ kind: 'assignment', id: a.id, title: a.title })}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState icon={ClipboardList} title="Sin tareas todavía" description="Publica una tarea: puedes vincular un libro y una práctica de la biblioteca." />
        )
      ) : members.length ? (
        <ul className="card divide-y divide-line">
          {members.map((m) => (
            <li key={m.studentId} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 place-items-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: m.avatarColor }} aria-hidden>
                {m.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text">{m.name}</span>
                <span className="block text-xs text-muted">Se unió el {formatDate(m.joinedAt)}</span>
              </span>
              <button className="btn-ghost size-11 px-0" aria-label={`Quitar a ${m.name}`} onClick={() => setConfirm({ kind: 'member', id: m.studentId, name: m.name })}>
                <UserMinus className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Users} title="Aún no hay estudiantes" description={`Comparte el código ${course.joinCode} para que se unan al curso.`} />
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nueva tarea"
        description={`Se publicará para ${course.name}.`}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreating(false)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit" form="new-assignment" disabled={busy}>
              {busy ? 'Publicando…' : 'Publicar tarea'}
            </button>
          </>
        }
      >
        <form id="new-assignment" onSubmit={createAssignment} noValidate className="space-y-5">
          <TextField
            label="Título"
            placeholder="Ensayo: la censura en Fahrenheit 451"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={submitted ? errors.title : ''}
            autoFocus
          />
          <div>
            <label htmlFor="assignment-instructions" className="label">
              Instrucciones
            </label>
            <textarea
              id="assignment-instructions"
              rows={4}
              placeholder="Qué deben hacer, extensión, criterios de evaluación…"
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              className="field h-auto py-3"
            />
          </div>
          <TextField
            label="Fecha de entrega"
            type="date"
            min={todayISO()}
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            error={submitted ? errors.dueDate : ''}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="assignment-book" className="label">
                Libro (opcional)
              </label>
              <select
                id="assignment-book"
                value={form.bookId}
                onChange={(e) => setForm((f) => ({ ...f, bookId: e.target.value, practiceSetId: '' }))}
                className="field"
              >
                <option value="">Sin libro</option>
                {BOOKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assignment-set" className="label">
                Práctica (opcional)
              </label>
              <select
                id="assignment-set"
                value={form.practiceSetId}
                onChange={(e) => setForm((f) => ({ ...f, practiceSetId: e.target.value }))}
                className="field"
                disabled={!sets.length}
              >
                <option value="">{form.bookId && !sets.length ? 'Este libro no tiene prácticas' : 'Sin práctica'}</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {form.bookId && (
            <p className="flex items-center gap-2 text-xs text-muted">
              <BookOpen className="size-4" aria-hidden />
              Los estudiantes verán un acceso directo a «{getBook(form.bookId)?.title}»
              {form.practiceSetId && ` y a la práctica «${getPracticeSet(form.practiceSetId)?.title}»`}.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.kind === 'course' ? '¿Eliminar el curso?' : confirm?.kind === 'assignment' ? '¿Eliminar la tarea?' : '¿Quitar al estudiante?'}
        description={
          confirm?.kind === 'course'
            ? `Se borrarán ${course.name}, sus tareas y todas las entregas. No se puede deshacer.`
            : confirm?.kind === 'assignment'
              ? `Se borrará «${confirm.title}» junto con sus entregas.`
              : confirm?.kind === 'member'
                ? `${confirm.name} dejará de ver las tareas del curso. Podrá volver a unirse con el código.`
                : ''
        }
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(null)}>
              Cancelar
            </button>
            <button className="btn-danger" onClick={runConfirm} disabled={busy}>
              {confirm?.kind === 'member' ? 'Quitar' : 'Eliminar'}
            </button>
          </>
        }
      />
    </div>
  )
}
