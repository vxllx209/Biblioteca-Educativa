import { Crown, Headphones, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'
import type { Book } from '../types'
import { BookCover } from './BookCover'
import { FavoriteButton } from './FavoriteButton'
import { t } from '../i18n'

/** Bookstore-shelf card: the cover is the hero, details sit underneath. */
export function BookCard({ book }: { book: Book }) {
  const audio = useAudio()
  const navigate = useNavigate()
  return (
    <article className="group relative flex flex-col">
      <Link to={`/book/${book.id}`} className="flex flex-1 flex-col rounded-card focus-visible:outline-offset-4">
        <div className="relative overflow-hidden rounded-[14px] shadow-book transition-[transform,box-shadow] duration-500 ease-out-soft group-hover:-translate-y-1.5 group-hover:shadow-lift">
          <BookCover book={book} className="transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]" />
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          />
          {book.premium && (
            <span className="badge absolute bottom-2.5 left-2.5 bg-gradient-to-br from-gold to-[#a8732f] font-semibold text-[#1f1607] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)]">
              <Crown className="size-3.5" aria-hidden /> Premium
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-0.5 pt-3.5">
          <span className="eyebrow truncate text-[10px]">{t(book.category)}</span>
          <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-text transition-colors group-hover:text-accent">{book.title}</h3>
          <p className="line-clamp-1 text-[13px] text-muted">{book.author}</p>
          <p className="mt-auto flex items-center gap-1 pt-1 text-xs font-semibold text-text/80">
            <Star className="size-3.5 fill-gold text-gold" aria-hidden />
            {book.rating.toFixed(1)}
            <span className="sr-only">{t('de 5 estrellas')}</span>
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
          className="absolute top-[calc(0.625rem+2.75rem)] right-2.5 grid size-9 place-items-center rounded-full border border-white/40 bg-surface/90 text-muted shadow-card backdrop-blur transition-all duration-200 hover:text-accent active:scale-90 md:translate-x-1 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:focus-visible:translate-x-0 md:focus-visible:opacity-100"
          aria-label={t('Escuchar {title}', { title: book.title })}
        >
          <Headphones className="size-4" aria-hidden />
        </button>
      )}
    </article>
  )
}
