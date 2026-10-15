import { BookOpen } from 'lucide-react'
import { cn } from '../lib/format'

/** Brand mark. `onDark` is for the forest surfaces (sidebar, auth brand panel). */
export function Logo({ compact = false, onDark = false, className }: { compact?: boolean; onDark?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'relative grid size-10 shrink-0 place-items-center rounded-xl',
          onDark
            ? 'bg-gradient-to-br from-mint to-sage text-forest shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-br from-primary to-forest text-mint shadow-glow',
        )}
      >
        <BookOpen className="size-5" strokeWidth={2} aria-hidden />
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-gold" aria-hidden />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={cn('block font-display text-[17px]', onDark ? 'text-white' : 'text-text')}>Biblioteca</span>
          <span className={cn('mt-1 block text-[10px] font-semibold tracking-[0.22em] uppercase', onDark ? 'text-sage' : 'text-secondary')}>
            Educativa
          </span>
        </span>
      )}
    </span>
  )
}
