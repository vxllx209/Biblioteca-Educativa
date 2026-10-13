import { Heart } from 'lucide-react'
import { useState } from 'react'
import { useLibrary } from '../context/LibraryContext'
import { cn } from '../lib/format'
import type { Book } from '../types'
import { t } from '../i18n'

export function FavoriteButton({ book, className, size = 'md' }: { book: Book; className?: string; size?: 'sm' | 'md' }) {
  const { isFavorite, toggleFavorite } = useLibrary()
  const active = isFavorite(book.id)
  const [bump, setBump] = useState(0)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(book.id)
        setBump((n) => n + 1)
      }}
      aria-pressed={active}
      aria-label={active ? t('Quitar {title} de favoritos', { title: book.title }) : t('Agregar {title} a favoritos', { title: book.title })}
      className={cn(
        'grid shrink-0 place-items-center rounded-full border transition-all duration-200 active:scale-90',
        size === 'sm' ? 'size-9' : 'size-11',
        active
          ? 'border-transparent bg-surface text-accent shadow-card'
          : 'border-line bg-surface/90 text-muted backdrop-blur hover:text-accent',
        className,
      )}
    >
      <Heart
        key={bump}
        className={cn('size-[18px]', bump > 0 && 'animate-pop', active && 'fill-current')}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  )
}
