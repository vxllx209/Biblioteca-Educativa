import { Crown, Headphones, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'
import type { Book } from '../types'
import { BookCover } from './BookCover'
import { FavoriteButton } from './FavoriteButton'

export function BookCard({ book }: { book: Book }) {
  const audio = useAudio()
  const navigate = useNavigate()
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-active">
      <Link to={`/book/${book.id}`} className="flex flex-1 flex-col rounded-card focus-visible:outline-offset-[-2px]">
        <div className="relative overflow-hidden rounded-t-card">
          <BookCover book={book} className="transition-transform duration-300 group-hover:scale-[1.02]" />
          {book.premium && (
            <span className="badge absolute bottom-2.5 left-2.5 bg-surface/95 text-accent shadow-card">
              <Crown className="size-3.5" aria-hidden /> Premium
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3.5 pb-4">
          <span className="badge w-fit bg-soft text-accent">{book.category}</span>
          <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-text">{book.title}</h3>
          <p className="line-clamp-1 text-[13px] text-muted">{book.author}</p>
          <p className="mt-auto flex items-center gap-1 pt-1 text-xs font-medium text-muted">
            <Star className="size-3.5 fill-warning text-warning" aria-hidden />
            {book.rating.toFixed(1)}
            <span className="sr-only">de 5 estrellas</span>
          </p>
        </div>
      </Link>
      <FavoriteButton book={book} size="sm" className="absolute top-2.5 right-2.5" />
      {book.hasAudio && (
        <button
          type="button"
          onClick={() => {
            audio.load(book.id, { autoplay: true })
            navigate(`/audio/${book.id}`)
          }}
          className="absolute top-[calc(0.625rem+2.75rem)] right-2.5 grid size-9 place-items-center rounded-full border border-line bg-surface/90 text-muted backdrop-blur transition-all duration-200 hover:text-accent active:scale-90"
          aria-label={`Escuchar ${book.title}`}
        >
          <Headphones className="size-4" aria-hidden />
        </button>
      )}
    </article>
  )
}
