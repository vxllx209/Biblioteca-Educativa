import { BookOpen, CalendarDays, CircleCheck, ClipboardCheck, ClipboardList, PenLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { ProgressBar } from '../components/ProgressBar'
import { EmptyState, RowSkeleton } from '../components/States'
import { PriorityTag, STATUS_LABEL, StatusBadge } from '../components/StatusBadge'
import { TaskCard } from '../components/TaskCard'
import { useLibrary } from '../context/LibraryContext'
import { useToast } from '../context/ToastContext'
import { getBook } from '../data/books'
import { TASKS } from '../data/mock'
import { getPracticeSet } from '../data/practice'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { cn, dueLabel, formatDate } from '../lib/format'
import type { TaskStatus } from '../types'

type Filter = 'todas' | TaskStatus
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en-progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completadas' },
]

export default function Tasks() {
  const { tasks, updateTask, practice } = useLibrary()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('todas')
  const [openId, setOpenId] = useState<string | null>(null)
  const loading = useSimulatedLoading()

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todas: tasks.length, pendiente: 0, 'en-progreso': 0, completada: 0 }
    tasks.forEach((t) => c[t.status]++)
    return c
  }, [tasks])

  const visible = useMemo(
    () =>
      tasks
        .filter((t) => filter === 'todas' || t.status === filter)
        .sort((a, b) => Number(a.status === 'completada') - Number(b.status === 'completada') || a.dueDate.localeCompare(b.dueDate)),
    [tasks, filter],
  )
  const open = tasks.find((t) => t.id === openId) ?? null
  const book = open?.bookId ? getBook(open.bookId) : undefined
  const linkedId = open ? (open.practiceSetId ?? TASKS.find((t) => t.id === open.id)?.practiceSetId) : undefined
  const linkedSet = linkedId ? getPracticeSet(linkedId) : undefined
  const overall = tasks.length ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0

  return (
    <div className="animate-fade-in">
      <PageHeader title="Mis tareas" subtitle={`${counts.pendiente + counts['en-progreso']} pendientes · ${counts.completada} completadas`} />

      <section className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6" aria-label="Progreso general">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-soft text-accent">
          <ClipboardCheck className="size-6" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text">Progreso general</p>
          <ProgressBar value={overall} showValue size="md" className="mt-2" label="Progreso general de tareas" />
        </div>
      </section>

      <div className="-mx-4 mb-6 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div role="group" aria-label="Filtrar por estado" className="flex w-max gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                'chip gap-2',
                filter === f.value ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-muted hover:border-line-active hover:text-text',
              )}
            >
              {f.label}
              <span className={cn('rounded-full px-1.5 text-xs', filter === f.value ? 'bg-white/20' : 'bg-bg2')}>{counts[f.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : visible.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((t) => (
            <TaskCard key={t.id} task={t} onOpen={(task) => setOpenId(task.id)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={filter === 'completada' ? 'Aún no completas tareas' : 'No hay tareas aquí'}
          description={filter === 'todas' ? 'Cuando tus profesores asignen tareas aparecerán en esta sección.' : `No tienes tareas con estado “${FILTERS.find((f) => f.value === filter)?.label}”.`}
          action={
            filter !== 'todas' && (
              <button className="btn-secondary" onClick={() => setFilter('todas')}>
                Ver todas
              </button>
            )
          }
        />
      )}

      <Modal
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.title ?? ''}
        description={open?.subject}
        footer={
          open && (
            <>
              <button className="btn-secondary" onClick={() => setOpenId(null)}>
                Cerrar
              </button>
              {open.status !== 'completada' ? (
                <button
                  className="btn-primary"
                  onClick={() => {
                    updateTask(open.id, { status: 'completada' })
                    toast('¡Tarea completada!')
                  }}
                >
                  <CircleCheck className="size-5" aria-hidden /> Marcar como completada
                </button>
              ) : (
                <button className="btn-outline" onClick={() => updateTask(open.id, { status: 'en-progreso' })}>
                  Reabrir tarea
                </button>
              )}
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={open.status} />
              <PriorityTag priority={open.priority} />
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                <CalendarDays className="size-4" aria-hidden />
                {formatDate(open.dueDate, { weekday: 'long', day: 'numeric', month: 'long' })} · {dueLabel(open.dueDate)}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-muted">{open.description}</p>

            <div>
              <label htmlFor="task-progress" className="label flex justify-between">
                Progreso <span className="font-semibold text-accent tabular-nums">{open.progress}%</span>
              </label>
              <input
                id="task-progress"
                type="range"
                min={0}
                max={100}
                step={5}
                value={open.progress}
                onChange={(e) => updateTask(open.id, { progress: Number(e.target.value) })}
                className="range"
                style={{ ['--fill' as string]: `${open.progress}%` }}
              />
            </div>

            <fieldset>
              <legend className="label">Estado</legend>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateTask(open.id, { status: s })}
                    aria-pressed={open.status === s}
                    className={cn(
                      'min-h-11 rounded-xl border px-2 text-sm font-medium transition-colors',
                      open.status === s ? 'border-primary bg-softer text-accent dark:border-secondary' : 'border-line text-muted hover:border-line-active',
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </fieldset>

            {linkedSet && (
              <Link
                to={`/practice/${linkedSet.bookId}/${linkedSet.id}`}
                className="flex items-center gap-3 rounded-[14px] border border-primary bg-softer p-3 transition-colors hover:bg-soft dark:border-secondary"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-primary text-white">
                  <PenLine className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">
                    Práctica de la tarea{practice[linkedSet.id] ? ` · mejor resultado ${Math.round(practice[linkedSet.id].best * 100)}%` : ''}
                  </span>
                  <span className="block truncate text-sm font-semibold text-text">{linkedSet.title}</span>
                </span>
                <span className="text-sm font-semibold text-accent">Resolver</span>
              </Link>
            )}
            {book && (
              <Link to={`/book/${book.id}`} className="flex items-center gap-3 rounded-[14px] border border-line p-3 transition-colors hover:border-line-active">
                <span className="grid size-10 place-items-center rounded-lg bg-soft text-accent">
                  <BookOpen className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">Material de apoyo</span>
                  <span className="block truncate text-sm font-semibold text-text">{book.title}</span>
                </span>
              </Link>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
