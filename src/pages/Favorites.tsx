import { Heart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookGrid } from '../components/BookGrid'
import { PageHeader } from '../components/PageHeader'
import { SearchBar } from '../components/SearchBar'
import { EmptyState } from '../components/States'
import { useLibrary } from '../context/LibraryContext'
import { getBook } from '../data/books'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { normalize } from '../lib/format'
import type { Book } from '../types'

export default function Favorites() {
  const { favorites } = useLibrary()
  const [query, setQuery] = useState('')
  const loading = useSimulatedLoading()

  const books = useMemo(() => favorites.map((id) => getBook(id)).filter((b): b is Book => !!b), [favorites])
  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return books
    return books.filter((b) => normalize(`${b.title} ${b.author} ${b.category} ${b.subject}`).includes(q))
  }, [books, query])

  const count = books.length
  return (
    <div className="animate-fade-in">
      <PageHeader title="Mis favoritos" subtitle={count === 1 ? '1 libro guardado' : `${count} libros guardados`} />
      {count > 0 && (
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar en tus favoritos" label="Buscar en favoritos" className="mb-6 max-w-xl" />
      )}
      <BookGrid
        books={filtered}
        loading={loading}
        skeletonCount={4}
        empty={
          count === 0 ? (
            <EmptyState
              icon={Heart}
              title="Aún no tienes favoritos"
              description="Toca el corazón en cualquier libro para guardarlo aquí y encontrarlo rápidamente."
              action={
                <Link to="/explore" className="btn-primary">
                  Explorar libros
                </Link>
              }
            />
          ) : undefined
        }
      />
    </div>
  )
}
