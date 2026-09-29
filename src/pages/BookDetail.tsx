import { ArrowLeft, ArrowRight, BookOpen, Check, CircleCheck, Crown, Download, ExternalLink, Headphones, LoaderCircle, PenLine, Share2, Star } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookCover } from '../components/BookCover'
import { BookGrid } from '../components/BookGrid'
import { FavoriteButton } from '../components/FavoriteButton'
import { SectionHeader, TopActions } from '../components/PageHeader'
import { PremiumGate } from '../components/PremiumGate'
import { ProgressBar } from '../components/ProgressBar'
import { ErrorState } from '../components/States'
import { useAudio } from '../context/AudioContext'
import { useLibrary } from '../context/LibraryContext'
import { useToast } from '../context/ToastContext'
import { BOOKS, formatYear, getBook, totalAudioSeconds } from '../data/books'
import { KIND_LABEL, setsForBook, SUBJECT_APPROACH } from '../data/practice'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { formatTime } from '../lib/format'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-4 ${i <= Math.round(rating) ? 'fill-warning text-warning' : 'text-line-active'}`} />
      ))}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[320px_1fr] lg:gap-12" aria-busy="true" aria-label="Cargando libro">
      <div className="skeleton mx-auto aspect-[2/3] w-52 rounded-[18px] md:w-full" />
      <div className="space-y-4">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-9 w-3/4" />
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-20 w-full" />
        <div className="flex gap-3">
          <div className="skeleton h-12 w-36 rounded-xl" />
          <div className="skeleton h-12 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function BookDetail() {
  const { id } = useParams()
  const book = getBook(id)
  const navigate = useNavigate()
  const toast = useToast()
  const audio = useAudio()
  const { progress, isDownloaded, downloading, startDownload, canAccess, practice } = useLibrary()
  const [gate, setGate] = useState<string | null>(null)
  const loading = useSimulatedLoading([id], 400)

  const related = useMemo(() => {
    if (!book) return []
    const same = BOOKS.filter((b) => b.id !== book.id && b.category === book.category)
    const others = BOOKS.filter((b) => b.id !== book.id && b.category !== book.category).sort((a, b) => b.popularity - a.popularity)
    return [...same, ...others].slice(0, 6)
  }, [book])

  if (!book)
    return (
      <ErrorState
        title="Libro no encontrado"
        description="El libro que buscas no existe o ya no está disponible."
        action={
          <Link to="/explore" className="btn-primary">
            Ir a Explorar
          </Link>
        }
      />
    )

  const p = progress[book.id]
  const downloaded = isDownloaded(book.id)
  const dl = downloading[book.id]
  const locked = !canAccess(book)

  const share = async () => {
    const url = `${window.location.origin}/book/${book.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title, text: `${book.title} — ${book.author}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast('Enlace copiado al portapapeles')
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast('No se pudo compartir el enlace', 'error')
    }
  }

  const listen = () => {
    audio.load(book.id, { autoplay: true })
    navigate(`/audio/${book.id}`)
  }

  const download = () => {
    if (locked) return setGate('Descarga este libro y léelo sin conexión con un plan Premium.')
    startDownload(book)
  }

  const info = [
    { label: 'Autor', value: book.author },
    { label: 'Categoría', value: book.category },
    { label: 'Páginas', value: `≈ ${book.pages.toLocaleString('es-ES')}` },
    { label: 'Idioma', value: book.language },
    { label: 'Fecha de publicación', value: formatYear(book.year) },
  ]
  const extra: { label: string; value: ReactNode }[] = [
    { label: 'Edición', value: book.edition },
    { label: 'Materia', value: book.subject },
    { label: 'Extensión', value: `${book.words.toLocaleString('es-ES')} palabras · ${book.chapters.length} secciones` },
    {
      label: 'Audiolibro',
      value: book.hasAudio ? `${formatTime(totalAudioSeconds(book))} · ${book.audio!.tracks.length} pistas` : 'No disponible',
    },
    { label: 'Tamaño de descarga', value: book.sizeMB < 1 ? `${Math.round(book.sizeMB * 1024)} KB` : `${book.sizeMB.toFixed(1)} MB` },
    {
      label: 'Fuente del texto',
      value: (
        <a href={book.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
          {book.sourceUrl.includes('wikisource') ? 'Wikisource' : 'Project Gutenberg'} <ExternalLink className="size-3" aria-hidden />
        </a>
      ),
    },
    { label: 'Derechos', value: 'Dominio público' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between gap-3 md:mb-8">
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Volver">
          <ArrowLeft className="size-5" />
        </button>
        <TopActions />
      </div>

      {loading ? (
        <DetailSkeleton />
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[320px_1fr] lg:gap-12">
            <div className="mx-auto w-52 sm:w-60 md:w-full">
              <div className="overflow-hidden rounded-[18px] shadow-pop md:sticky md:top-8">
                <BookCover book={book} />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-soft text-accent">{book.category}</span>
                {book.premium && (
                  <span className="badge border border-line-active text-accent">
                    <Crown className="size-3.5" aria-hidden /> Premium
                  </span>
                )}
                {downloaded && (
                  <span className="badge bg-success-soft text-success">
                    <Check className="size-3.5" aria-hidden /> Sin conexión
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-[26px] leading-tight font-bold tracking-tight text-text sm:text-[30px] lg:text-4xl">{book.title}</h1>
              <p className="mt-2 text-base text-muted">{book.author}</p>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <Stars rating={book.rating} />
                <span className="font-semibold text-text">{book.rating.toFixed(1)}</span>
                <span>({book.ratingsCount.toLocaleString('es-ES')} valoraciones)</span>
              </div>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">{book.description}</p>

              {p && (
                <div className="mt-5 max-w-md rounded-[14px] bg-softer p-4">
                  <p className="mb-2 text-sm font-medium text-text">
                    Vas en «{book.chapters[p.chapter]?.title}» · {Math.round(p.percent)}% leído
                  </p>
                  <ProgressBar value={p.percent} showValue size="md" label="Progreso de lectura" />
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to={`/reader/${book.id}`} className="btn-primary h-12 flex-1 sm:flex-none">
                  <BookOpen className="size-5" aria-hidden />
                  {p ? 'Continuar leyendo' : 'Leer ahora'}
                </Link>
                {book.hasAudio && (
                  <button onClick={listen} className="btn-outline h-12 flex-1 sm:flex-none">
                    <Headphones className="size-5" aria-hidden />
                    Escuchar
                  </button>
                )}
                <button
                  onClick={download}
                  disabled={downloaded || dl !== undefined}
                  className="btn-secondary h-12 w-full disabled:opacity-100 sm:w-auto"
                  aria-live="polite"
                >
                  {dl !== undefined ? (
                    <>
                      <LoaderCircle className="size-5 animate-spin" aria-hidden /> Descargando {Math.round(dl)}%
                    </>
                  ) : downloaded ? (
                    <>
                      <Check className="size-5" aria-hidden /> Descargado
                    </>
                  ) : (
                    <>
                      <Download className="size-5" aria-hidden /> Descargar
                    </>
                  )}
                </button>
                <div className="flex gap-3">
                  <FavoriteButton book={book} className="size-12" />
                  <button onClick={share} className="icon-btn size-12" aria-label="Compartir">
                    <Share2 className="size-5" />
                  </button>
                </div>
              </div>
              {locked && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <Crown className="size-4 text-accent" aria-hidden />
                  Puedes leer el primer capítulo gratis.{' '}
                  <Link to="/premium" className="font-semibold text-accent hover:underline">
                    Hazte Premium
                  </Link>
                </p>
              )}

              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-3 xl:grid-cols-5">
                {info.map((i) => (
                  <div key={i.label} className="bg-surface p-4">
                    <dt className="text-xs text-muted">{i.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-text">{i.value}</dd>
                  </div>
                ))}
                <div className="bg-surface xl:hidden" aria-hidden />
              </dl>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="card p-6 sm:p-8" aria-labelledby="synopsis">
              <h2 id="synopsis" className="text-lg font-semibold text-text sm:text-xl">
                Sinopsis
              </h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-muted">{book.synopsis}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {book.tags.map((t) => (
                  <Link key={t} to={`/explore?q=${encodeURIComponent(t)}`} className="chip min-h-9 border-line text-xs text-muted hover:border-line-active hover:text-accent">
                    #{t}
                  </Link>
                ))}
              </div>
            </section>
            <section className="card p-6 sm:p-8" aria-labelledby="extra-info">
              <h2 id="extra-info" className="text-lg font-semibold text-text sm:text-xl">
                Información adicional
              </h2>
              <dl className="mt-4 divide-y divide-line">
                {extra.map((i) => (
                  <div key={i.label} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-muted">{i.label}</dt>
                    <dd className="text-right font-medium text-text">{i.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="mt-12" aria-labelledby="practice-title">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="practice-title" className="text-lg font-semibold text-text sm:text-xl">
                Practica lo que lees
              </h2>
              <Link to={`/practice/${book.id}`} className="rounded-lg px-2 py-2 text-sm font-semibold text-accent hover:underline">
                Ver todo
              </Link>
            </div>
            <p className="mb-4 max-w-3xl text-sm text-muted">{SUBJECT_APPROACH[book.category]}</p>
            <ul className="grid gap-3 md:grid-cols-2">
              {setsForBook(book.id)
                .slice(0, 4)
                .map((s) => (
                  <li key={s.id} className="min-w-0">
                    <Link to={`/practice/${book.id}/${s.id}`} className="card group flex items-center gap-3 p-4 transition-colors hover:border-line-active">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-accent">
                        <PenLine className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-text">{s.title}</span>
                        <span className="block truncate text-xs text-muted">
                          {book.chapters[s.chapter]?.title} · {KIND_LABEL[s.kind]} · {s.questions.length} preguntas
                        </span>
                      </span>
                      {practice[s.id] ? (
                        <span className="badge shrink-0 bg-success-soft text-success">
                          <CircleCheck className="size-3.5" aria-hidden /> {Math.round(practice[s.id].best * 100)}%
                        </span>
                      ) : (
                        <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                      )}
                    </Link>
                  </li>
                ))}
              <li className="min-w-0">
                <Link to={`/practice/${book.id}`} className="card flex h-full items-center gap-3 border-dashed p-4 text-sm text-muted transition-colors hover:border-line-active hover:text-accent">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg2">
                    <PenLine className="size-5" aria-hidden />
                  </span>
                  Práctica libre de cualquier capítulo, con espacio de desarrollo y pizarra
                </Link>
              </li>
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="related">
            <SectionHeader id="related" title="Libros relacionados" />
            <BookGrid books={related} className="lg:max-xl:[&>*:nth-child(n+5)]:hidden xl:max-2xl:[&>*:nth-child(n+6)]:hidden" />
          </section>
        </>
      )}
      <PremiumGate open={!!gate} onClose={() => setGate(null)} message={gate ?? ''} />
    </div>
  )
}
