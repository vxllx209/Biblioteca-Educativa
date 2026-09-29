import type { LucideIcon } from 'lucide-react'
import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/format'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex animate-fade-in flex-col items-center px-6 py-14 text-center', className)}>
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-soft text-accent">
        <Icon className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role="alert">
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-error-soft text-error">
        <CircleAlert className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function BookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface" aria-hidden>
      <div className="skeleton aspect-[2/3] rounded-none" />
      <div className="space-y-2 p-3.5 pb-4">
        <div className="skeleton h-4 w-16 rounded-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="card flex gap-4 p-4" aria-hidden>
      <div className="skeleton h-24 w-16 shrink-0" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton mt-4 h-2 w-full rounded-full" />
      </div>
    </div>
  )
}
