import { SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/format'
import type { Book } from '../types'
import { BookCard } from './BookCard'
import { BookCardSkeleton, EmptyState } from './States'

interface Props {
  books: Book[]
  loading?: boolean
  skeletonCount?: number
  empty?: ReactNode
  className?: string
}

export function BookGrid({ books, loading = false, skeletonCount = 5, empty, className }: Props) {
  const grid = cn(
    'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    className,
  )
  if (loading)
    return (
      <div className={grid} aria-busy="true" aria-label="Cargando libros">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    )
  if (!books.length)
    return (
      empty ?? (
        <EmptyState icon={SearchX} title="No encontramos libros" description="Prueba con otra búsqueda o cambia los filtros." />
      )
    )
  return (
    <div className={grid}>
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  )
}
