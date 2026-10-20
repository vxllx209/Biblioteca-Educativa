import { Headphones, Library, PenLine } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { BOOKS, getBook, totalAudioSeconds } from '../data/books'
import { PRACTICE_SETS } from '../data/practice'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { cn } from '../lib/format'
import type { Book } from '../types'
import { BookCover } from './BookCover'
import { Logo } from './Logo'
import { locale, t } from '../i18n'

const SHOWCASE = [...BOOKS].sort((a, b) => b.popularity - a.popularity).slice(0, 3)

/** Fanned stack of real covers, used on the brand panel and the home hero. */
export function CoverFan({ className, size = 'md', books = SHOWCASE }: { className?: string; size?: 'md' | 'lg'; books?: Book[] }) {
  const w = size === 'lg' ? 'w-[150px] xl:w-[170px]' : 'w-[118px]'
  return (
    <div className={cn('relative', className)} aria-hidden>
      {books.slice(0, 3).map((book, i) => (
        <div
          key={book.id}
          className={cn(
            'absolute top-1/2 left-1/2 overflow-hidden rounded-[10px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-transform duration-500 ease-out-soft',
            w,
          )}
          style={{
            transform: `translate(-50%, -50%) translateX(${(i - 1) * 62}%) rotate(${(i - 1) * 9}deg) translateY(${i === 1 ? -8 : 6}%)`,
            zIndex: i === 1 ? 2 : 1,
          }}
        >
          <BookCover book={book} />
        </div>
      ))}
    </div>
  )
}

/** Opening lines, copied from each book's text in public/books. */
const FIRST_LINES = [
  { id: 'don-quijote', text: 'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.' },
  { id: 'el-proceso', text: 'Alguien tenía que haber calumniado a Josef K, pues fue detenido una mañana sin haber hecho nada malo.' },
  { id: 'martin-fierro', text: 'Aquí me pongo a cantar\nAl compás de la vigüela,\nQue el hombre que lo desvela\nUna pena estraordinaria\nComo la ave solitaria\nCon el cantar se consuela.' },
  { id: 'marianela', text: 'Se puso el sol. Tras el breve crepúsculo vino tranquila y oscura la noche, en cuyo negro seno murieron poco a poco los últimos rumores de la tierra soñolienta.' },
].flatMap(({ id, text }) => {
  const book = getBook(id)
  return book ? [{ book, text }] : []
})

const ROTATE_MS = 7000

const FACTS = [
  { icon: Library, value: BOOKS.length, label: 'obras completas' },
  { icon: Headphones, value: Math.round(BOOKS.reduce((s, b) => s + totalAudioSeconds(b), 0) / 3600), label: 'horas de audiolibros' },
  { icon: PenLine, value: PRACTICE_SETS.reduce((s, p) => s + p.questions.length, 0), label: 'preguntas de práctica' },
]

/**
 * Index of the opening line on screen; advances every ROTATE_MS. Pausing keeps the time already
 * spent on the current line, so hovering never resets the rotation.
 */
function useFirstLine(paused: boolean) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [i, setI] = useState(0)
  const clock = useRef({ start: 0, left: ROTATE_MS })

  // A new line (by timer or by click) gets the full time.
  useEffect(() => {
    clock.current = { start: performance.now(), left: ROTATE_MS }
  }, [i])

  useEffect(() => {
    // Pausing runs the previous cleanup, which already banked the elapsed time.
    if (reduced || paused || FIRST_LINES.length < 2) return
    const c = clock.current
    c.start = performance.now()
    const id = setTimeout(() => setI((n) => (n + 1) % FIRST_LINES.length), c.left)
    return () => {
      clearTimeout(id)
      c.left = Math.max(0, c.left - (performance.now() - c.start))
    }
  }, [i, reduced, paused])
  return { i, setI, reduced }
}

/** The text appears word by word, like ink settling on the page. Whitespace (and verse line breaks) is kept as-is. */
function InkText({ text, from = 0 }: { text: string; from?: number }) {
  let n = 0
  return (
    <>
      {text.split(/(\s+)/).map((part, k) =>
        /^\s*$/.test(part) ? (
          part
        ) : (
          <span key={k} className="ink-word" style={{ animationDelay: `${Math.min(from + n++ * 32, 1600)}ms` }}>
            {part}
          </span>
        ),
      )}
    </>
  )
}

/** A page from a real book in the collection; cycles through several opening lines. */
export function FirstLines() {
  const [paused, setPaused] = useState(false)
  const { i, setI, reduced } = useFirstLine(paused)
  const tiltRef = useRef<HTMLDivElement>(null)

  // The page leans slightly toward the pointer.
  const tilt = (e: ReactPointerEvent<HTMLElement>) => {
    const el = tiltRef.current
    if (!el || e.pointerType !== 'mouse' || reduced) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg)`
  }
  const untilt = () => {
    setPaused(false)
    if (tiltRef.current) tiltRef.current.style.transform = ''
  }

  if (!FIRST_LINES.length) return null
  const { book, text } = FIRST_LINES[i]

  return (
    <figure className="relative w-full max-w-[460px]" onPointerEnter={() => setPaused(true)} onPointerMove={tilt} onPointerLeave={untilt}>
      <div ref={tiltRef} className="transition-transform duration-500 ease-out-soft will-change-transform">
        <div className="paper-settle relative rotate-[-1.5deg] rounded-[6px] bg-[#f4eee0] px-6 pt-6 pb-5 text-[#2b2a26] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] sm:px-8 sm:pt-8">
          {/* Gutter shading, as if the page were bound on the left. */}
          <span className="pointer-events-none absolute inset-y-0 left-0 w-10 rounded-l-[6px] bg-gradient-to-r from-[rgba(70,50,20,0.18)] to-transparent" aria-hidden />
          <div key={book.id}>
            <blockquote className="min-h-[9rem] font-serif text-[16px] leading-[1.6] whitespace-pre-line sm:min-h-[10.5rem] sm:text-[19px]">
              <span className="dropcap-in float-left mt-1 mr-2 font-display text-[3.1em] leading-[0.8] text-[#285b4a]">{text[0]}</span>
              <InkText text={text.slice(1)} from={250} />
            </blockquote>
            <figcaption className="mt-5 flex animate-rise items-center gap-3 border-t border-[#2b2a26]/15 pt-4 [animation-delay:500ms]">
              <div className="w-8 shrink-0 overflow-hidden rounded-[3px] shadow-sm">
                <BookCover book={book} showText={false} />
              </div>
              <div className="min-w-0 text-sm leading-tight">
                <p className="truncate font-semibold">{book.title}</p>
                <p className="truncate text-[#2b2a26]/65">{book.author}</p>
              </div>
            </figcaption>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 sm:mt-6 lg:justify-start" role="group" aria-label={t('Primeras líneas')}>
        {FIRST_LINES.map((x, k) => (
          <button
            key={x.book.id}
            type="button"
            onClick={() => setI(k)}
            aria-label={x.book.title}
            aria-pressed={k === i}
            className="group grid h-6 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span className={cn('relative block h-1 overflow-hidden rounded-full bg-white/20 transition-[width] duration-300', k === i ? 'w-10' : 'w-4 group-hover:bg-white/35')}>
              {k === i && (
                <span
                  key={i}
                  className="welcome-progress absolute inset-0 origin-left rounded-full bg-gold"
                  style={{ animationDuration: `${ROTATE_MS}ms`, animationPlayState: paused || reduced ? 'paused' : 'running' }}
                />
              )}
            </span>
          </button>
        ))}
      </div>
    </figure>
  )
}

/** Small-screen stand-in for the brand panel: the same rotating opening line, set as a quiet epigraph. */
export function FirstLineEpigraph({ className }: { className?: string }) {
  const desktop = useMediaQuery('(min-width: 1024px)')
  if (desktop || !FIRST_LINES.length) return null
  return <Epigraph className={className} />
}

function Epigraph({ className }: { className?: string }) {
  const { i } = useFirstLine(false)
  const { book, text } = FIRST_LINES[i]
  return (
    <figure key={book.id} className={cn('mx-auto max-w-[320px] text-center', className)}>
      <blockquote className="line-clamp-2 min-h-[2.75em] font-serif text-[15px] leading-snug text-muted italic">
        <InkText text={text.replace(/\n/g, ' ')} />
      </blockquote>
      <figcaption className="mt-1.5 animate-fade-in text-xs font-medium text-secondary [animation-delay:400ms]">{book.title}</figcaption>
    </figure>
  )
}

/** Forest brand panel shown next to the auth forms on large screens. `title` comes already translated. */
export function BrandPanel({ title }: { title?: string }) {
  return (
    <aside className="forest-panel flex h-full flex-col rounded-[28px] p-10 xl:p-12">
      <div className="flex items-center justify-between gap-4">
        <Link to="/welcome" className="rounded-xl" aria-label={t('Volver a la bienvenida')}>
          <Logo onDark />
        </Link>
        <Link to="/" className="rounded-full px-3 py-1.5 text-sm font-medium text-mint/80 transition-colors hover:bg-white/10 hover:text-white">
          {t('Conoce la biblioteca')}
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-8 py-6">
        <h2 className="max-w-md animate-rise font-display text-[34px] leading-[1.1] text-white xl:text-[40px]">{title ?? t('Toda gran historia empieza con una primera línea.')}</h2>
        <FirstLines />
      </div>

      {/* Short laptop screens: the quote matters more than the totals. */}
      <LibraryFacts onDark className="[@media(max-height:780px)]:hidden" />
    </aside>
  )
}

/** Collection totals: a hairline strip on the forest panel, a bordered card elsewhere. */
export function LibraryFacts({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-3', onDark ? 'border-t border-white/10 pt-6' : 'divide-x divide-line rounded-2xl border border-line', className)}>
      {FACTS.map(({ icon: Icon, value, label }) => (
        <div key={label} className={cn('flex flex-col-reverse', !onDark && 'items-center px-2 py-4 text-center')}>
          <dt className={cn('mt-0.5 leading-tight', onDark ? 'text-xs text-mint/65' : 'text-[11px] text-muted')}>{t(label)}</dt>
          <dd className={cn('font-display tabular-nums', onDark ? 'text-2xl text-white' : 'text-xl text-text')}>{value.toLocaleString(locale())}</dd>
          {!onDark && <Icon className="mb-2 size-4 text-secondary" aria-hidden />}
        </div>
      ))}
    </dl>
  )
}
