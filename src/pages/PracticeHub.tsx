import { ArrowRight, BookOpen, CircleCheck, Crown, PenLine, Target } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BookCover } from '../components/BookCover'
import { PageHeader } from '../components/PageHeader'
import { ErrorState } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { getBook, PREVIEW_CHAPTERS } from '../data/books'
import { freeSetId, KIND_LABEL, setsForBook, SUBJECT_APPROACH } from '../data/practice'
import { cn } from '../lib/format'

export default function PracticeHub() {
  const { bookId } = useParams()
  const [params] = useSearchParams()
  const book = getBook(bookId)
  const navigate = useNavigate()
  const { isPremium } = useAuth()
  const { practice, progress } = useLibrary()
  const current = progress[bookId ?? '']?.chapter ?? 0
  const highlight = params.get('cap') !== null ? Number(params.get('cap')) : null
  const [freeChapter, setFreeChapter] = useState(highlight ?? current)

  if (!book)
    return (
      <ErrorState
        title="Libro no encontrado"
        description="No encontramos prácticas para este libro."
        action={
          <Link to="/explore" className="btn-primary">
            Ir a Explorar
          </Link>
        }
      />
    )

  const sets = setsForBook(book.id)
  const lockedChapter = (c: number) => book.premium && !isPremium && c >= PREVIEW_CHAPTERS
  const done = sets.filter((s) => practice[s.id]).length

  return (
    <div className="animate-fade-in">
      <PageHeader title="Práctica" subtitle={`${book.title} · ${book.author}`} back />

      <section className="card mb-8 flex flex-col gap-5 rounded-[18px] p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="w-20 shrink-0 overflow-hidden rounded-[10px] shadow-card">
          <BookCover book={book} showText={false} />
        </div>
        <div className="flex-1">
          <span className="badge bg-soft text-accent">{book.category}</span>
          <p className="mt-2 text-[15px] text-text">{SUBJECT_APPROACH[book.category]}</p>
          <p className="mt-2 text-sm text-muted">
            {sets.length ? `${done} de ${sets.length} prácticas completadas` : 'Este libro tiene práctica libre por capítulo.'}
          </p>
        </div>
      </section>

      {sets.length > 0 && (
        <section aria-labelledby="guided" className="mb-10">
          <h2 id="guided" className="mb-4 text-lg font-semibold text-text sm:text-xl">
            Prácticas guiadas
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {sets.map((s) => {
              const r = practice[s.id]
              const locked = lockedChapter(s.chapter)
              const hi = highlight === s.chapter
              return (
                <li key={s.id} className="min-w-0">
                  <Link
                    to={locked ? '/premium' : `/practice/${book.id}/${s.id}`}
                    className={cn(
                      'card group flex h-full flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-active',
                      hi && 'border-line-active ring-2 ring-soft',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-accent">
                        {s.kind === 'ejercicios' ? <Target className="size-5" aria-hidden /> : <PenLine className="size-5" aria-hidden />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-muted">{book.chapters[s.chapter]?.title}</p>
                        <h3 className="font-semibold text-text">{s.title}</h3>
                      </div>
                      {locked ? (
                        <Crown className="size-4 shrink-0 text-accent" aria-label="Premium" />
                      ) : r ? (
                        <span className="badge shrink-0 bg-success-soft text-success">
                          <CircleCheck className="size-3.5" aria-hidden /> {Math.round(r.best * 100)}%
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted">{s.description}</p>
                    <p className="mt-auto flex items-center justify-between pt-1 text-xs font-medium text-muted">
                      <span>
                        {KIND_LABEL[s.kind]} · {s.questions.length} preguntas
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                        {r ? 'Repetir' : 'Empezar'} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="free" className="card rounded-[18px] p-5 sm:p-6">
        <h2 id="free" className="text-lg font-semibold text-text">
          Práctica libre por capítulo
        </h2>
        <p className="mt-1 text-sm text-muted">
          Preguntas de desarrollo adaptadas a {book.category.toLowerCase()} para cualquier capítulo: escribe, dibuja en la pizarra y autoevalúate.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Capítulo</span>
            <select
              value={freeChapter}
              onChange={(e) => setFreeChapter(Number(e.target.value))}
              className="field cursor-pointer appearance-none truncate pr-10"
            >
              {book.chapters.map((c, i) => (
                <option key={i} value={i} disabled={lockedChapter(i)}>
                  {c.title}
                  {lockedChapter(i) ? ' (Premium)' : ''}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => navigate(`/practice/${book.id}/${freeSetId(book.id, freeChapter)}`)} disabled={lockedChapter(freeChapter)} className="btn-primary h-12">
            Practicar este capítulo
          </button>
        </div>
      </section>

      <div className="mt-8 flex justify-center">
        <Link to={`/reader/${book.id}`} className="btn-secondary">
          <BookOpen className="size-4" aria-hidden /> Volver a la lectura
        </Link>
      </div>
    </div>
  )
}
