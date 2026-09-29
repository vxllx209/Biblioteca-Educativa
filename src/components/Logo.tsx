import { BookOpen } from 'lucide-react'
import { cn } from '../lib/format'

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-accent">
        <BookOpen className="size-5" strokeWidth={2} aria-hidden />
      </span>
      {!compact && <span className="text-[15px] leading-tight font-bold text-accent">Biblioteca Educativa</span>}
    </span>
  )
}
