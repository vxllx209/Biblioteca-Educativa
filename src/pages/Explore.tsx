import { ArrowDownUp, SearchX } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookGrid } from '../components/BookGrid'
import { PageHeader, SectionHeader } from '../components/PageHeader'
import { PremiumBanner } from '../components/PremiumBanner'
import { SearchBar } from '../components/SearchBar'
import { EmptyState } from '../components/States'
import { BOOKS, CATEGORIES } from '../data/books'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { cn, normalize } from '../lib/format'
import type { Book, Category } from '../types'

/** Six cards per row-section, trimmed so the grid never leaves a lonely last row. */
const ONE_ROW = 'lg:max-xl:[&>*:nth-child(n+5)]:hidden xl:max-2xl:[&>*:nth-child(n+6)]:hidden'

type Sort = 'relevance' | 'recent' | 'popular'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'popular', label: 'Más populares' },
]

/** Scores a book against the query across title, author, subject, category and tags. 0 = no match. */
function score(book: Book, terms: string[]) {
  if (!terms.length) return 1
  const fields: [string, number][] = [
    [normalize(book.title), 5],
    [normalize(book.author), 3],
    [normalize(book.subject), 3],
    [normalize(book.category), 3],
    [normalize(book.tags.join(' ')), 2],
    [normalize(book.description), 1],
  ]
  let total = 0
  for (const term of terms) {
    const hit = fields.reduce((s, [text, w]) => s + (text.includes(term) ? w : 0), 0)
    if (!hit) return 0
    total += hit
  }
  return total
}

function sortBooks(list: { book: Book; s: number }[], sort: Sort) {
  const sorted = [...list]
  if (sort === 'recent') sorted.sort((a, b) => b.book.year - a.book.year)
  else if (sort === 'popular') sorted.sort((a, b) => b.book.popularity - a.book.popularity)
  else sorted.sort((a, b) => b.s - a.s || b.book.rating * b.book.popularity - a.book.rating * a.book.popularity)
  return sorted.map((x) => x.book)
}

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = (params.get('cat') as Category | null) ?? null
  const sort = (params.get('sort') as Sort | null) ?? 'relevance'
  const loading = useSimulatedLoading([category, sort], 350)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean)
    const scored = BOOKS.filter((b) => !category || b.category === category)
      .map((book) => ({ book, s: score(book, terms) }))
      .filter((x) => x.s > 0)
    return sortBooks(scored, sort)
  }, [query, category, sort])

  const filtering = !!query.trim() || !!category
  const recommended = useMemo(() => [...BOOKS].sort((a, b) => b.rating - a.rating).slice(0, 6), [])
  const popular = useMemo(() => [...BOOKS].sort((a, b) => b.popularity - a.popularity).slice(0, 6), [])
  const newest = useMemo(() => [...BOOKS].sort((a, b) => b.year - a.year).slice(0, 6), [])

  const sortControl = (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Ordenar por</span>
      <ArrowDownUp className="pointer-events-none absolute left-3.5 size-4 text-muted" aria-hidden />
      <select
        value={sort}
        onChange={(e) => update({ sort: e.target.value === 'relevance' ? null : e.target.value })}
        className="h-11 cursor-pointer appearance-none rounded-xl border border-line bg-surface pr-9 pl-10 text-sm font-medium text-text transition-colors outline-none hover:border-line-active focus:border-primary"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3.5 size-3 text-muted" viewBox="0 0 12 12" aria-hidden>
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </label>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Explorar" subtitle="Encuentra libros para aprender algo nuevo" />

      <SearchBar
        value={query}
        onChange={(q) => update({ q: q || null })}
        size="lg"
        placeholder="Busca por título, autor, materia o categoría"
        label="Buscar en el catálogo"
      />

      <div className="-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0 no-scrollbar">
        <div role="group" aria-label="Filtrar por categoría" className="flex w-max gap-2">
          {[null, ...CATEGORIES].map((c) => {
            const active = category === c
            return (
              <button
                key={c ?? 'all'}
                onClick={() => update({ cat: c })}
                aria-pressed={active}
                className={cn(
                  'chip',
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-surface text-muted hover:border-line-active hover:text-text',
                )}
              >
                {c ?? 'Todos'}
              </button>
            )
          })}
        </div>
      </div>

      {filtering ? (
        <section className="mt-8" aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {loading ? 'Buscando…' : (
                <>
                  <span className="font-semibold text-text">{results.length}</span> {results.length === 1 ? 'resultado' : 'resultados'}
                  {query && (
                    <>
                      {' '}para “<span className="font-medium text-text">{query}</span>”
                    </>
                  )}
                  {category && <> en {category}</>}
                </>
              )}
            </p>
            {sortControl}
          </div>
          <BookGrid
            books={results}
            loading={loading}
            empty={
              <EmptyState
                icon={SearchX}
                title="Sin resultados"
                description="No encontramos libros que coincidan. Revisa la ortografía o prueba con otra materia."
                action={
                  <button className="btn-secondary" onClick={() => update({ q: null, cat: null })}>
                    Limpiar filtros
                  </button>
                }
              />
            }
          />
        </section>
      ) : (
        <div className="mt-8 space-y-10 lg:space-y-12">
          <PremiumBanner />
          <section aria-labelledby="ex-reco">
            <SectionHeader id="ex-reco" title="Recomendados para ti" />
            <BookGrid books={recommended} loading={loading} skeletonCount={6} className={ONE_ROW} />
          </section>
          <section aria-labelledby="ex-pop">
            <SectionHeader id="ex-pop" title="Más populares" />
            <BookGrid books={popular} loading={loading} skeletonCount={6} className={ONE_ROW} />
          </section>
          <section aria-labelledby="ex-new">
            <SectionHeader id="ex-new" title="Nuevos libros" />
            <BookGrid books={newest} loading={loading} skeletonCount={6} className={ONE_ROW} />
          </section>
          <section aria-labelledby="ex-all">
            <SectionHeader id="ex-all" title="Todo el catálogo" action={sortControl} />
            <BookGrid books={results} loading={loading} skeletonCount={10} />
          </section>
        </div>
      )}
    </div>
  )
}
