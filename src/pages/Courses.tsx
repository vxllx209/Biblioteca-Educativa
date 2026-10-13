import { ChevronRight, Copy, Plus, Presentation } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TextField } from '../components/Form'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, ErrorState, RowSkeleton } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { SUBJECTS } from '../data/school'
import { useAsync } from '../hooks/useAsync'
import { copyCode } from '../lib/clipboard'
import { cn } from '../lib/format'
import { classroom } from '../services/classroom'

export default function Courses() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const courses = useAsync(() => classroom.teacherCourses(user!.id), [user?.id])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', subject: user?.subject ?? '' })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const errors = {
    name: form.name.trim() ? '' : 'Ponle un nombre al curso, por ejemplo «4° medio A».',
    subject: form.subject ? '' : 'Elige la asignatura.',
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (errors.name || errors.subject) return
    setSaving(true)
    try {
      const course = await classroom.createCourse(user!.id, form)
      toast('Curso creado. Comparte el código con tus estudiantes.')
      navigate(`/aula/${course.id}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo crear el curso', 'error')
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mis cursos"
        subtitle={user?.school ? `${user.school} · ${user.subject}` : 'Crea cursos, publica tareas y revisa entregas.'}
        actions={
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus className="size-5" aria-hidden /> Nuevo curso
          </button>
        }
      />

      {courses.loading && !courses.data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : courses.error ? (
        <ErrorState
          title="No pudimos cargar tus cursos"
          description={courses.error}
          action={
            <button className="btn-secondary" onClick={courses.reload}>
              Reintentar
            </button>
          }
        />
      ) : courses.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.data.map((c) => (
            <div key={c.id} className="card flex flex-col gap-4 p-5">
              <Link to={`/aula/${c.id}`} className="group flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-accent">
                  <Presentation className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-text group-hover:text-accent">{c.name}</span>
                  <span className="block truncate text-sm text-muted">{c.subject}</span>
                </span>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
              <button
                onClick={() => copyCode(c.joinCode, toast)}
                className="flex items-center justify-between rounded-xl border border-dashed border-line-active px-4 py-2 text-left hover:bg-softer"
                aria-label={`Copiar código ${c.joinCode}`}
              >
                <span>
                  <span className="block text-xs text-muted">Código para unirse</span>
                  <span className="font-mono text-lg font-semibold tracking-[0.2em] text-text">{c.joinCode}</span>
                </span>
                <Copy className="size-4 text-muted" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Presentation}
          title="Aún no tienes cursos"
          description="Crea un curso, comparte su código con tus estudiantes y empieza a publicar tareas."
          action={
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus className="size-5" aria-hidden /> Crear mi primer curso
            </button>
          }
        />
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nuevo curso"
        description="Tus estudiantes se unirán con un código que generamos para el curso."
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreating(false)}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit" form="new-course" disabled={saving}>
              {saving ? 'Creando…' : 'Crear curso'}
            </button>
          </>
        }
      >
        <form id="new-course" onSubmit={create} noValidate className="space-y-5">
          <TextField
            label="Nombre del curso"
            placeholder="4° medio A"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={submitted ? errors.name : ''}
            autoFocus
          />
          <div>
            <label htmlFor="course-subject" className="label">
              Asignatura
            </label>
            <select
              id="course-subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className={cn('field', submitted && errors.subject && 'border-error')}
            >
              <option value="">Elige una asignatura</option>
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {submitted && errors.subject && <p className="mt-1.5 text-[13px] text-error">{errors.subject}</p>}
          </div>
        </form>
      </Modal>
    </div>
  )
}
