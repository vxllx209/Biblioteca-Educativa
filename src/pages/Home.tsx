import { ArrowRight, BookOpenText, ClipboardList, Compass, Crown, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookCover } from '../components/BookCover'
import { BookGrid } from '../components/BookGrid'
import { Modal } from '../components/Modal'
import { SectionHeader, TopActions } from '../components/PageHeader'
import { ProgressBar } from '../components/ProgressBar'
import { SearchBar } from '../components/SearchBar'
import { RowSkeleton } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { BOOKS, getBook } from '../data/books'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { relativeTime } from '../lib/format'
import type { Book, ReadingProgress } from '../types'

function QuickAction({ to, icon: Icon, title, description, cta }: { to: string; icon: LucideIcon; title: string; description: string; cta: string }) {
  return (
    <Link
      to={to}
      className="card group flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-active sm:flex-col sm:items-start sm:p-5"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-soft text-accent">
        <Icon className="size-6" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-text">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{description}</span>
      </span>
      <span className="hidden items-center gap-1.5 text-sm font-semibold text-accent sm:inline-flex">
        {cta}
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </span>
      <ArrowRight className="size-5 shrink-0 text-muted sm:hidden" aria-hidden />
    </Link>
  )
}

function ContinueCard({ book, progress }: { book: Book; progress: ReadingProgress }) {
  return (
    <article className="card flex gap-4 p-4">
      <Link to={`/book/${book.id}`} className="w-[72px] shrink-0 overflow-hidden rounded-[10px] shadow-card" aria-label={`Ver ${book.title}`}>
        <BookCover book={book} showText={false} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-text">{book.title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-muted">{book.author}</p>
        <p className="mt-0.5 truncate text-xs text-disabled">
          {book.chapters[progress.chapter]?.title.split('·')[0].trim()} · {relativeTime(progress.updatedAt)}
        </p>
        <ProgressBar value={progress.percent} showValue className="mt-auto pt-3" label={`Progreso de ${book.title}`} />
      </div>
      <Link to={`/reader/${book.id}`} className="btn-primary hidden h-10 min-h-10 self-center px-4 text-sm sm:inline-flex">
        Continuar
      </Link>
      <Link
        to={`/reader/${book.id}`}
        className="grid size-11 shrink-0 place-items-center self-center rounded-full bg-primary text-white sm:hidden"
        aria-label={`Continuar leyendo ${book.title}`}
      >
        <ArrowRight className="size-5" />
      </Link>
    </article>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { progress, tasks } = useLibrary()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const loading = useSimulatedLoading()

  const reading = useMemo(
    () =>
      Object.values(progress)
        .filter((p) => p.percent < 100)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((p) => ({ p, book: getBook(p.bookId) }))
        .filter((x): x is { p: ReadingProgress; book: Book } => !!x.book),
    [progress],
  )
  const recommended = useMemo(
    () =>
      BOOKS.filter((b) => !progress[b.id])
        .sort((a, b) => b.rating * b.popularity - a.rating * a.popularity)
        .slice(0, 12),
    [progress],
  )
  const pendingTasks = tasks.filter((t) => t.status !== 'completada').length

  const search = (q: string) => navigate(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : '/explore')

  return (
    <div className="animate-fade-in space-y-10 lg:space-y-12">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] leading-tight font-bold tracking-tight text-text sm:text-[26px] lg:text-[32px]">
            Hola, {user?.firstName}
          </h1>
          <p className="mt-1 text-[15px] text-muted">¿Qué quieres aprender hoy?</p>
        </div>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={search}
          className="order-last w-full lg:order-none lg:w-[440px] xl:w-[500px]"
        />
        <TopActions />
      </header>

      <section aria-label="Accesos rápidos" className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <QuickAction
          to="/tasks"
          icon={ClipboardList}
          title="Mis tareas"
          description={pendingTasks ? `${pendingTasks} tareas pendientes` : 'Todo al día'}
          cta="Ver tareas"
        />
        <QuickAction to="/explore" icon={Compass} title="Explorar" description="Descubre nuevos libros" cta="Explorar" />
        <QuickAction to="/premium" icon={Crown} title="Premium" description="Audiolibros y contenido exclusivo" cta="Ver planes" />
      </section>

      <section aria-labelledby="continue-title">
        <SectionHeader
          id="continue-title"
          title="Continúa leyendo"
          action={
            reading.length > 0 && (
              <button onClick={() => setShowAll(true)} className="rounded-lg px-2 py-2 text-sm font-semibold text-accent hover:underline">
                Ver todo
              </button>
            )
          }
        />
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : reading.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reading.slice(0, 3).map(({ p, book }) => (
              <ContinueCard key={book.id} book={book} progress={p} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <span className="grid size-12 place-items-center rounded-full bg-soft text-accent">
              <BookOpenText className="size-6" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-text">Aún no comienzas ningún libro</p>
              <p className="text-sm text-muted">Elige un libro y tu progreso aparecerá aquí.</p>
            </div>
            <Link to="/explore" className="btn-primary">
              Explorar libros
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="reco-title">
        <SectionHeader
          id="reco-title"
          title="Recomendados para ti"
          action={
            <Link to="/explore" className="rounded-lg px-2 py-2 text-sm font-semibold text-accent hover:underline">
              Ver todo
            </Link>
          }
        />
        <BookGrid
          books={recommended}
          loading={loading}
          skeletonCount={6}
          className="xl:max-2xl:[&>*:nth-child(n+11)]:hidden"
        />
      </section>

      <Modal open={showAll} onClose={() => setShowAll(false)} title="Continúa leyendo" description={`${reading.length} libros en progreso`} size="lg">
        <div className="space-y-3">
          {reading.map(({ p, book }) => (
            <ContinueCard key={book.id} book={book} progress={p} />
          ))}
        </div>
      </Modal>
    </div>
  )
}
