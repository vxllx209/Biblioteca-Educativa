import type { TaskPriority, TaskStatus } from '../types'
import { cn } from '../lib/format'

export const STATUS_LABEL: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  'en-progreso': 'En progreso',
  completada: 'Completada',
}

const statusClass: Record<TaskStatus, string> = {
  pendiente: 'bg-bg2 text-muted',
  'en-progreso': 'bg-soft text-accent',
  completada: 'bg-success-soft text-success',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn('badge', statusClass[status])}>{STATUS_LABEL[status]}</span>
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = { alta: 'Alta', media: 'Media', baja: 'Baja' }

const priorityDot: Record<TaskPriority, string> = { alta: 'bg-error', media: 'bg-warning', baja: 'bg-secondary' }

export function PriorityTag({ priority }: { priority: TaskPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span className={cn('size-2 rounded-full', priorityDot[priority])} aria-hidden />
      Prioridad {PRIORITY_LABEL[priority].toLowerCase()}
    </span>
  )
}
