import { CalendarDays, ChevronRight } from 'lucide-react'
import { cn, daysUntil, dueLabel, formatDate } from '../lib/format'
import type { Task } from '../types'
import { ProgressBar } from './ProgressBar'
import { PriorityTag, StatusBadge } from './StatusBadge'

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const overdue = task.status !== 'completada' && daysUntil(task.dueDate) < 0
  const soon = task.status !== 'completada' && !overdue && daysUntil(task.dueDate) <= 2
  return (
    <button
      onClick={() => onOpen(task)}
      className="card group flex w-full flex-col gap-4 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-line-active"
      aria-label={`Abrir tarea: ${task.title}`}
    >
      <div className="flex w-full items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-secondary uppercase">{task.subject}</p>
          <h3 className={cn('mt-1 text-base font-semibold text-text', task.status === 'completada' && 'text-muted line-through decoration-1')}>
            {task.title}
          </h3>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium',
            overdue ? 'text-error' : soon ? 'text-warning' : 'text-muted',
          )}
          title={formatDate(task.dueDate)}
        >
          <CalendarDays className="size-4" aria-hidden />
          {task.status === 'completada' ? formatDate(task.dueDate) : dueLabel(task.dueDate)}
        </span>
        <PriorityTag priority={task.priority} />
      </div>
      <div className="flex w-full items-center gap-2">
        <ProgressBar
          value={task.progress}
          showValue
          className="flex-1"
          label={`Progreso de ${task.title}`}
          tone={task.status === 'completada' ? 'success' : 'primary'}
        />
        <ChevronRight className="size-4 text-disabled transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </div>
    </button>
  )
}
