import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { cn } from '../lib/format'

export type ToastVariant = 'success' | 'error' | 'info'
export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

const styles: Record<ToastVariant, { icon: typeof Info; className: string; iconClass: string }> = {
  success: { icon: CircleCheck, className: 'bg-primary text-white border-transparent', iconClass: '' },
  error: { icon: CircleAlert, className: 'bg-surface text-text border-error/40', iconClass: 'text-error' },
  info: { icon: Info, className: 'bg-surface text-text border-line', iconClass: 'text-accent' },
}

export function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const { icon: Icon, className, iconClass } = styles[item.variant]
  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-xl border py-2 pr-2 pl-4 text-sm font-medium shadow-pop',
        className,
      )}
    >
      <Icon className={cn('size-5 shrink-0', iconClass)} aria-hidden />
      <p className="flex-1 py-1">{item.message}</p>
      <button
        onClick={onClose}
        className="grid size-9 shrink-0 place-items-center rounded-lg opacity-70 transition-opacity hover:opacity-100"
        aria-label="Cerrar notificación"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
