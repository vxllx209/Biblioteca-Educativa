import { LoaderCircle, Pause, Play, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'
import { BookCover } from './BookCover'
import { t } from '../i18n'

/** Persistent player: above the bottom nav on mobile, floating over the content bottom on tablet/desktop. */
export function MiniPlayer() {
  const { book, track, position, duration, playing, status, toggle, close } = useAudio()
  if (!book) return null
  const pct = duration ? (position / duration) * 100 : 0
  return (
    <div
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-40 animate-rise md:right-6 md:bottom-6 md:left-[calc(80px+24px)] lg:left-[calc(256px+40px)]"
      role="region"
      aria-label={t('Reproductor de audiolibro')}
    >
      <div className="glass mx-auto max-w-[1240px] overflow-hidden rounded-[22px] shadow-pop">
        <div className="flex items-center gap-3 p-2.5 pr-3">
          <Link to={`/audio/${book.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl" aria-label={t('Abrir reproductor: {title}', { title: book.title })}>
            <span className="w-11 shrink-0 overflow-hidden rounded-lg shadow-book">
              <BookCover book={book} showText={false} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text">{book.title}</span>
              <span className="block truncate text-xs text-muted">{status === 'error' ? t('Sin conexión: toca para reintentar') : book.audio?.tracks[track]?.title}</span>
            </span>
          </Link>
          <button
            onClick={toggle}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white shadow-glow transition-all duration-200 hover:scale-105 hover:bg-primary-hover active:scale-95"
            aria-label={playing ? t('Pausar') : t('Reproducir')}
          >
            {playing && status === 'loading' ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : playing ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="ml-0.5 size-5 fill-current" />
            )}
          </button>
          <button
            onClick={close}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-bg2 hover:text-text"
            aria-label={t('Cerrar reproductor')}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="h-1 bg-soft" aria-hidden>
          <div className="h-full rounded-r-full bg-gradient-to-r from-secondary to-primary transition-[width] duration-200 dark:to-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
