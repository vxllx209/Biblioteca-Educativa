import { BookOpen, ChevronDown, Headphones } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AudioPlayer } from '../components/AudioPlayer'
import { ErrorState } from '../components/States'
import { useAudio } from '../context/AudioContext'
import { getBook } from '../data/books'

export default function AudioPage() {
  const { id } = useParams()
  const book = getBook(id)
  const audio = useAudio()
  const navigate = useNavigate()
  const { load } = audio

  useEffect(() => {
    if (book?.hasAudio) load(book.id)
  }, [book, load])

  const minimize = () => (window.history.length > 1 ? navigate(-1) : navigate(`/book/${id}`))

  if (!book || !book.hasAudio)
    return (
      <div className="grid min-h-dvh place-items-center bg-bg p-6">
        <ErrorState
          title="Audiolibro no disponible"
          description="Este libro todavía no tiene versión en audio."
          action={
            <Link to={book ? `/book/${book.id}` : '/explore'} className="btn-primary">
              Volver
            </Link>
          }
        />
      </div>
    )

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <button onClick={minimize} className="icon-btn" aria-label="Minimizar reproductor">
            <ChevronDown className="size-5" />
          </button>
          <p className="flex flex-1 items-center justify-center gap-2 text-sm font-semibold text-muted">
            <Headphones className="size-4 text-accent" aria-hidden /> Audiolibro
          </p>
          <Link to={`/reader/${book.id}`} className="icon-btn" aria-label="Leer el libro">
            <BookOpen className="size-5" />
          </Link>
        </div>
      </header>
      <main className="px-5 py-8 sm:px-8 lg:py-14">{audio.book?.id === book.id && <AudioPlayer />}</main>
    </div>
  )
}
