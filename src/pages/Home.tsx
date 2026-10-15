import { ArrowRight, BookOpenText, ClipboardList, Compass, Crown, PenLine, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookCover } from '../components/BookCover'
import { CoverFan } from '../components/BrandPanel'
import { BookGrid } from '../components/BookGrid'
import { Modal } from '../components/Modal'
import { SectionHeader, TopActions } from '../components/PageHeader'
import { ProgressBar } from '../components/ProgressBar'
import { SearchBar } from '../components/SearchBar'
import { RowSkeleton } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { BOOKS, getBook } from '../data/books'
import { KIND_LABEL, PRACTICE_SETS } from '../data/practice'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { cn, relativeTime } from '../lib/format'
import type { Book, ReadingProgress } from '../types'
import { locale, t, plural } from '../i18n'

const TONES = {
  forest: 'from-primary to-forest text-mint shadow-glow',
  sage: 'from-sage to-secondary text-white shadow-[0_8px_20px_-8px_rgba(79,128,109,0.8)]',
  gold: 'from-gold to-[#a8732f] text-[#1f1607] shadow-[0_8px_20px_-8px_rgba(193,138,69,0.9)]',
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
  cta,
  tone,
}: {
  to: string
  icon: LucideIcon
  title: string
  description: string
  cta: string
  tone: keyof typeof TONES
}) {
  return (
    <Link to={to} className="card card-hover group relative flex items-center gap-4 overflow-hidden p-4 sm:flex-col sm:items-start sm:p-6">
      <span
        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-soft opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <span className={cn('relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br', TONES[tone])}>
        <Icon className="size-6" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-display text-lg text-text">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{description}</span>
      </span>
      <span className="relative hidden items-center gap-1.5 text-sm font-semibold text-accent sm:inline-flex">
        {cta}
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
      </span>
      <ArrowRight className="size-5 shrink-0 text-muted sm:hidden" aria-hidden />
    </Link>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
      <p className="font-display text-2xl leading-none text-white tabular-nums sm:text-[28px]">{value}</p>
      <p className="mt-1.5 truncate text-[11px] font-medium tracking-wide text-mint/70 uppercase">{label}</p>
    </div>
  )
}

function ContinueCard({ book, progress }: { book: Book; progress: ReadingProgress }) {
  return (
    <article className="card card-hover group flex min-w-0 gap-4 p-4">
      <Link
        to={`/book/${book.id}`}
        className="w-[76px] shrink-0 overflow-hidden rounded-[10px] shadow-book transition-transform duration-500 ease-out-soft group-hover:-rotate-2"
        aria-label={t('Ver {title}', { title: book.title })}
      >
        <BookCover book={book} showText={false} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-text">{book.title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-muted">{book.author}</p>
        <p className="mt-0.5 truncate text-xs text-disabled">
          {book.chapters[progress.chapter]?.title.split('·')[0].trim()} · {relativeTime(progress.updatedAt)}
        </p>
        <ProgressBar value={progress.percent} showValue className="mt-auto pt-3" label={t('Progreso de {title}', { title: book.title })} />
      </div>
      <Link
        to={`/reader/${book.id}`}
        className="grid size-11 shrink-0 place-items-center self-center rounded-full bg-primary text-white shadow-glow transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label={t('Continuar leyendo {title}', { title: book.title })}
      >
        <ArrowRight className="size-5" />
      </Link>
    </article>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { progress, tasks, practice } = useLibrary()
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
  const pendingTasks = tasks.filter((task) => task.status !== 'completada').length
  // Practices for chapters already read in the books in progress; otherwise, applied exercises to start with.
  const toPractice = useMemo(() => {
    const open = PRACTICE_SETS.filter((s) => !practice[s.id])
    const fromReading = open.filter((s) => progress[s.bookId] && s.chapter <= progress[s.bookId].chapter)
    const pick = fromReading.length ? fromReading : open.filter((s) => s.kind === 'ejercicios')
    return pick.slice(0, 3)
  }, [practice, progress])

  const heroBooks = reading.length >= 3 ? reading.map((r) => r.book) : [...reading.map((r) => r.book), ...recommended]
  const today = new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })

  const search = (q: string) => navigate(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : '/explore')

  return (
    <div className="stagger space-y-10 lg:space-y-14">
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="eyebrow first-letter:uppercase">{today}</p>
          <TopActions />
        </div>

        <section className="forest-panel grid gap-8 rounded-[28px] p-6 shadow-lift sm:p-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-12 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <span className="gold-rule" aria-hidden />
            <h1 className="mt-5 font-display text-[34px] leading-[1.05] text-white sm:text-5xl lg:text-[56px]">
              {t('Hola, {name}', { name: user?.firstName ?? '' })}
            </h1>
            <p className="mt-3 text-base text-mint/75 sm:text-lg">{t('¿Qué quieres aprender hoy?')}</p>
            <SearchBar value={query} onChange={setQuery} onSubmit={search} size="lg" className="mt-7 max-w-xl" />
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-2.5 sm:gap-3">
              <Stat value={reading.length} label={t('En curso')} />
              <Stat value={pendingTasks} label={t('Pendientes')} />
              <Stat value={Object.keys(practice).length} label={t('Prácticas')} />
            </div>
          </div>
          <CoverFan books={heroBooks} size="lg" className="hidden h-full min-h-[280px] animate-float lg:block" />
        </section>
      </div>

      <section aria-label={t('Accesos rápidos')} className="grid gap-3 sm:grid-cols-3 sm:gap-5">
        <QuickAction
          to="/tasks"
          icon={ClipboardList}
          tone="forest"
          title={t('Mis tareas')}
          description={pendingTasks ? plural(pendingTasks, '{n} tarea pendiente', '{n} tareas pendientes') : t('Todo al día')}
          cta={t('Ver tareas')}
        />
        <QuickAction to="/explore" icon={Compass} tone="sage" title={t('Explorar')} description={t('Descubre nuevos libros')} cta={t('Explorar')} />
        <QuickAction to="/premium" icon={Crown} tone="gold" title="Premium" description={t('Audiolibros y contenido exclusivo')} cta={t('Ver planes')} />
      </section>

      <section aria-labelledby="continue-title">
        <SectionHeader
          id="continue-title"
          title={t('Continúa leyendo')}
          action={
            reading.length > 0 && (
              <button onClick={() => setShowAll(true)} className="link-more">
                {t('Ver todo')}
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
          <div className="card flex flex-col items-center gap-4 border-dashed p-6 text-center sm:flex-row sm:text-left">
            <span className="grid size-12 place-items-center rounded-full bg-soft text-accent">
              <BookOpenText className="size-6" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-text">{t('Aún no comienzas ningún libro')}</p>
              <p className="text-sm text-muted">{t('Elige un libro y tu progreso aparecerá aquí.')}</p>
            </div>
            <Link to="/explore" className="btn-primary">
              {t('Explorar libros')}
            </Link>
          </div>
        )}
      </section>

      {toPractice.length > 0 && (
        <section aria-labelledby="practice-title">
          <SectionHeader id="practice-title" title={t('Practica lo que leíste')} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {toPractice.map((s) => {
              const b = getBook(s.bookId)!
              return (
                <Link key={s.id} to={`/practice/${s.bookId}/${s.id}`} className="card card-hover group flex min-w-0 items-start gap-4 p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-soft to-softer text-accent ring-1 ring-line">
                    <PenLine className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-muted">{b.title}</span>
                    <span className="block font-semibold text-text">{s.title}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {t(KIND_LABEL[s.kind])} · {plural(s.questions.length, '{n} pregunta', '{n} preguntas')}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="reco-title">
        <SectionHeader
          id="reco-title"
          title={t('Recomendados para ti')}
          action={
            <Link to="/explore" className="link-more">
              {t('Ver todo')}
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

      <Modal open={showAll} onClose={() => setShowAll(false)} title={t('Continúa leyendo')} description={plural(reading.length, '{n} libro en progreso', '{n} libros en progreso')} size="lg">
        <div className="space-y-3">
          {reading.map(({ p, book }) => (
            <ContinueCard key={book.id} book={book} progress={p} />
          ))}
        </div>
      </Modal>
    </div>
  )
}
