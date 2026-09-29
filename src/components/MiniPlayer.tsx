import { Pause, Play, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'
import { BookCover } from './BookCover'

/** Persistent player: above the bottom nav on mobile, floating over the content bottom on tablet/desktop. */
export function MiniPlayer() {
  const { book, track, position, duration, playing, toggle, close } = useAudio()
  if (!book) return null
  const pct = duration ? (position / duration) * 100 : 0
  return (
    <div
      className="fixed inset-x-3 bottom-[calc(68px+env(safe-area-inset-bottom)+8px)] z-40 animate-rise md:right-6 md:bottom-6 md:left-[calc(80px+24px)] lg:left-[calc(256px+32px)]"
      role="region"
      aria-label="Reproductor de audiolibro"
    >
      <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[18px] border border-line bg-surface shadow-pop">
        <div className="flex items-center gap-3 p-2.5 pr-3">
          <Link to={`/audio/${book.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl" aria-label={`Abrir reproductor: ${book.title}`}>
            <span className="w-10 shrink-0 overflow-hidden rounded-lg">
              <BookCover book={book} showText={false} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text">{book.title}</span>
              <span className="block truncate text-xs text-muted">{book.chapters[track]?.title}</span>
            </span>
          </Link>
          <button
            onClick={toggle}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white transition-all duration-200 hover:bg-primary-hover active:scale-95"
            aria-label={playing ? 'Pausar' : 'Reproducir'}
          >
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
          </button>
          <button
            onClick={close}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-bg2 hover:text-text"
            aria-label="Cerrar reproductor"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="h-1 bg-soft" aria-hidden>
          <div className="h-full bg-primary transition-[width] duration-200 dark:bg-secondary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
