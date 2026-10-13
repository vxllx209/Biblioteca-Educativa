import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  FileText,
  Headphones,
  Moon,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { BookCover } from '../components/BookCover'
import { CATEGORY_ICONS } from '../components/icons'
import { BOOKS, CATEGORIES, formatYear, getBook, totalAudioSeconds } from '../data/books'
import { KIND_LABEL, PRACTICE_SETS } from '../data/practice'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { cn } from '../lib/format'
import { locale, t } from '../i18n'
import type { Book, Category, Question } from '../types'
import './landing.css'

type ChoiceQuestion = Extract<Question, { kind: 'choice' }>

/* ------------------------------------------------------------------ data */

const QUIJOTE = getBook('don-quijote')!
const OPENING =
  'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.'

const STATS = {
  books: BOOKS.length,
  words: BOOKS.reduce((s, b) => s + b.words, 0),
  audioHours: BOOKS.reduce((s, b) => s + totalAudioSeconds(b), 0) / 3600,
  questions: PRACTICE_SETS.reduce((s, p) => s + p.questions.length, 0),
  chapters: BOOKS.reduce((s, b) => s + b.chapters.length, 0),
}

const AUTHORS = [...new Set(BOOKS.map((b) => b.author).filter((a) => !a.startsWith('Biblioteca Educativa') && a !== 'Anónimo'))]

/** One multiple-choice question per book, so the demo tours several subjects. */
const QUIZ = (() => {
  const seen = new Set<string>()
  const out: { q: ChoiceQuestion; book: Book }[] = []
  for (const set of PRACTICE_SETS) {
    if (seen.has(set.bookId)) continue
    const q = set.questions.find((x): x is ChoiceQuestion => x.kind === 'choice' && x.options.length <= 4)
    const book = getBook(set.bookId)
    if (q && book) {
      seen.add(set.bookId)
      out.push({ q, book })
    }
  }
  // Interleave subjects instead of showing all the science ones first.
  const byCat = new Map<Category, typeof out>()
  out.forEach((x) => byCat.set(x.book.category, [...(byCat.get(x.book.category) ?? []), x]))
  const mixed: typeof out = []
  for (let i = 0; mixed.length < 5 && i < out.length; i++) for (const list of byCat.values()) if (list[i] && mixed.length < 5) mixed.push(list[i])
  return mixed
})()

/* ----------------------------------------------------------------- hooks */

const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

function useInView<T extends Element>(threshold = 0, onChange?: (inView: boolean) => void) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const cb = useRef(onChange)
  useEffect(() => {
    cb.current = onChange
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting)
        cb.current?.(e.isIntersecting)
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

/** Sets --mx/--my on every .lp-spot inside the element, for the cursor spotlight. */
function spotlight(e: ReactPointerEvent<HTMLElement>) {
  for (const card of e.currentTarget.querySelectorAll<HTMLElement>('.lp-spot')) {
    const r = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${e.clientX - r.left}px`)
    card.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
}

/* ------------------------------------------------------------ primitives */

function Magnetic({ children, className, to, onClick }: { children: ReactNode; className?: string; to?: string; onClick?: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) * 0.3
    const y = (e.clientY - r.top - r.height / 2) * 0.4
    el.style.transform = `translate(${x}px, ${y}px)`
  }
  const leave = () => ref.current && (ref.current.style.transform = '')
  const cls = cn('inline-flex transition-transform duration-300 ease-out will-change-transform', className)
  return to ? (
    <Link ref={ref as Ref<HTMLAnchorElement>} to={to} className={cls} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </Link>
  ) : (
    <button ref={ref as Ref<HTMLButtonElement>} type="button" className={cls} onClick={onClick} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </button>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="lp-reveal inline-flex items-center gap-2 rounded-full border border-[var(--lp-line2)] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-[var(--lp-gold)] uppercase">
      <Sparkles className="size-3.5" aria-hidden />
      {children}
    </p>
  )
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="lp-reveal lp-serif mt-5 text-[34px] leading-[1.08] font-bold tracking-tight sm:text-5xl" style={{ '--d': '80ms' } as CSSProperties}>
        {title}
      </h2>
      {sub && (
        <p className="lp-reveal mt-5 text-base text-[var(--lp-muted)] sm:text-lg" style={{ '--d': '160ms' } as CSSProperties}>
          {sub}
        </p>
      )}
    </div>
  )
}

function CountUp({ value, run, format }: { value: number; run: boolean; format: (n: number) => string }) {
  const [n, setN] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (!run || done.current) return
    done.current = true
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 2200)
      setN(value * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, value])
  return <>{format(n)}</>
}

/* --------------------------------------------------------- letter field */

const GLYPHS = 'aábcdeéfghiíjklmnñoópqrstuúvwxyz¿?¡!∑π∫√∞αβθλΩ§¶&'.split('')

/** Canvas of drifting letters that scatter and light up around the cursor. */
function LetterField({ active, reduced }: { active: boolean; reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  type P = { x: number; y: number; vx: number; vy: number; bvx: number; bvy: number; s: number; c: string; a: number; r: number; vr: number; gold: boolean }
  const state = useRef<{ ps: P[]; w: number; h: number; mx: number; my: number }>({ ps: [], w: 0, h: 0, mx: -9999, my: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const s = state.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const make = (): P => {
      const bvx = (Math.random() - 0.5) * 0.2
      const bvy = -(0.1 + Math.random() * 0.35)
      return {
        x: Math.random() * s.w,
        y: Math.random() * s.h,
        vx: bvx,
        vy: bvy,
        bvx,
        bvy,
        s: 11 + Math.random() * 28,
        c: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        a: 0.04 + Math.random() * 0.16,
        r: (Math.random() - 0.5) * 0.8,
        vr: (Math.random() - 0.5) * 0.004,
        gold: Math.random() < 0.14,
      }
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const changed = Math.abs(rect.width - s.w) > 40 || !s.ps.length
      s.w = rect.width
      s.h = rect.height
      canvas.width = s.w * dpr
      canvas.height = s.h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (changed) s.ps = Array.from({ length: Math.round(Math.min(120, (s.w * s.h) / 8500)) }, make)
    }
    const draw = () => {
      ctx.clearRect(0, 0, s.w, s.h)
      for (const p of s.ps) {
        const dx = p.x - s.mx
        const dy = p.y - s.my
        const d = Math.hypot(dx, dy) || 1
        if (d < 170) {
          const f = ((170 - d) / 170) * 0.55
          p.vx += (dx / d) * f
          p.vy += (dy / d) * f
        }
        p.vx += (p.bvx - p.vx) * 0.04
        p.vy += (p.bvy - p.vy) * 0.04
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        if (p.y < -50) Object.assign(p, { y: s.h + 40, x: Math.random() * s.w })
        if (p.x < -50) p.x = s.w + 40
        if (p.x > s.w + 50) p.x = -40
        const glow = Math.max(0, 1 - d / 230)
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.r)
        ctx.font = `${p.s}px 'Noto Serif', Georgia, serif`
        ctx.fillStyle = p.gold || glow > 0.35 ? `rgba(217,163,91,${p.a + glow * 0.75})` : `rgba(220,235,228,${p.a + glow * 0.6})`
        ctx.fillText(p.c, 0, 0)
        ctx.restore()
      }
    }
    resize()
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      s.mx = e.clientX - r.left
      s.my = e.clientY - r.top
    }
    const onLeave = () => Object.assign(s, { mx: -9999, my: -9999 })
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    let raf = 0
    if (reduced || !active) draw()
    else {
      const loop = () => {
        draw()
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [active, reduced])

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden />
}

/* -------------------------------------------------------------- 3D book */

const LEAVES = [
  { z: 0.3, open: -177.4, delay: '0.25s' },
  { z: 0.7, open: -176.6, delay: '0.42s' },
  { z: 1.1, open: -175.8, delay: '0.59s' },
  { z: 1.5, open: -175, delay: '0.76s' },
]

function PageLines({ n = 14 }: { n?: number }) {
  return (
    <div className="flex h-full flex-col justify-center gap-[7%] px-[12%] opacity-30" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="h-[2px] rounded bg-[var(--lp-ink)]" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
      ))}
    </div>
  )
}

function HeroBook({ open, onToggle, bookRef }: { open: boolean; onToggle: () => void; bookRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div className="lp-scene relative">
      <div className={cn('lp-book-shift', open && 'is-open')}>
        <div
          ref={bookRef}
          className={cn('lp-book', open && 'is-open')}
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())}
          aria-label={open ? t('Cerrar el libro') : t('Abrir el libro')}
          aria-pressed={open}
        >
          <div className="lp-back" />
          <div className="lp-spine" />
          <div className="lp-edge" />
          <div className="lp-page lp-serif flex flex-col p-[10%] pl-[11%]">
            <p className="text-center text-[calc(var(--bw)*0.032)] tracking-[0.2em] text-[var(--lp-forest)] uppercase">{t('Capítulo primero')}</p>
            <p className="lp-page-text mt-[6%] flex-1">{OPENING}</p>
            <p className="text-center text-[calc(var(--bw)*0.035)] opacity-60">— 1 —</p>
          </div>
          {LEAVES.map((l, i) => (
            <div key={i} className="lp-leaf" style={{ '--z': l.z, '--open': `${l.open}deg`, '--delay': open ? l.delay : `${0.5 - i * 0.12}s` } as CSSProperties}>
              <div className="lp-face">
                <PageLines />
              </div>
              <div className="lp-face is-back lp-serif">
                {i === LEAVES.length - 1 ? (
                  <div className="flex h-full flex-col items-center justify-center p-[12%] text-center">
                    <span className="text-[calc(var(--bw)*0.035)] tracking-[0.25em] text-[var(--lp-forest)] uppercase">Miguel de Cervantes</span>
                    <span className="my-[8%] h-px w-1/3 bg-[var(--lp-forest)]/40" />
                    <span className="text-[calc(var(--bw)*0.085)] leading-tight font-bold">El ingenioso hidalgo don Quijote de la Mancha</span>
                    <span className="mt-[8%] text-[calc(var(--bw)*0.09)] text-[var(--lp-gold)]">❦</span>
                    <span className="mt-[8%] text-[calc(var(--bw)*0.034)] opacity-60">{t('Que trata de la condición y ejercicio del famoso hidalgo')}</span>
                  </div>
                ) : (
                  <PageLines />
                )}
              </div>
            </div>
          ))}
          <div className="lp-cover">
            <div className="lp-face">
              <BookCover book={QUIJOTE} className="h-full" />
              <div className="lp-cover-gloss" />
            </div>
            <div className="lp-face is-back grid place-items-center">
              <span className="lp-serif text-center text-[calc(var(--bw)*0.05)] leading-snug text-[var(--lp-mint)]/50">
                Ex libris
                <br />
                <span className="text-[calc(var(--bw)*0.07)] text-[var(--lp-gold)]/70">Biblioteca Educativa</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="lp-shadow" aria-hidden />
    </div>
  )
}

/* ------------------------------------------------------------------ hero */

const CYCLE = ['pensar', 'descubrir', 'preguntar', 'crecer', 'imaginar']

function WordCycle({ reduced }: { reduced: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setI((n) => (n + 1) % CYCLE.length), 2400)
    return () => clearInterval(id)
  }, [reduced])
  return (
    <span className="lp-cycle">
      {CYCLE.map((w, k) => (
        <span key={w} className="lp-shine pr-[0.1em] italic" data-state={k === i ? 'in' : k === (i + CYCLE.length - 1) % CYCLE.length ? 'out' : 'next'} aria-hidden={k !== i}>
          {t(w)}.
        </span>
      ))}
    </span>
  )
}

function Hero({ reduced }: { reduced: boolean }) {
  const [sectionRef, inView] = useInView<HTMLElement>()
  const [open, setOpen] = useState(false)
  const openRef = useRef(open)
  const bookRef = useRef<HTMLDivElement>(null)
  const pointer = useRef({ x: 0, y: 0 })

  const applyTilt = () => {
    const el = bookRef.current
    if (!el) return
    const { x, y } = pointer.current
    const [rx, ry] = openRef.current ? [24, 0] : [10, -30]
    el.style.setProperty('--rx', `${rx - y * 12}deg`)
    el.style.setProperty('--ry', `${ry + x * 22}deg`)
  }

  useEffect(() => {
    openRef.current = open
    applyTilt()
  }, [open])

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), reduced ? 0 : 1700)
    return () => clearTimeout(id)
  }, [reduced])

  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || reduced) return
    pointer.current = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 }
    applyTilt()
  }

  return (
    <section ref={sectionRef} onPointerMove={onMove} className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 lg:min-h-dvh lg:pb-28">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute top-[-20%] left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(40,91,74,0.55),transparent)]" />
        <div className="absolute right-[-10%] bottom-[-30%] size-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(217,163,91,0.14),transparent)]" />
        <LetterField active={inView} reduced={reduced} />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--lp-bg)]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="text-center lg:text-left">
          <p className="lp-reveal inline-flex items-center gap-2 rounded-full border border-[var(--lp-line2)] bg-white/[0.04] py-1.5 pr-4 pl-1.5 text-sm text-[var(--lp-mint)] backdrop-blur">
            <span className="rounded-full bg-[var(--lp-gold)] px-2 py-0.5 text-xs font-bold text-[#1a1408]">{t('Nuevo')}</span>
            {t('{n} obras completas, gratis para leer', { n: STATS.books })}
          </p>
          <h1 className="lp-reveal lp-serif mt-7 text-[44px] leading-[1.02] font-bold tracking-tight sm:text-7xl xl:text-[84px]" style={{ '--d': '100ms' } as CSSProperties}>
            {t('Una biblioteca que te enseña a')} <WordCycle reduced={reduced} />
          </h1>
          <p className="lp-reveal mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--lp-muted)] lg:mx-0" style={{ '--d': '200ms' } as CSSProperties}>
            {t('Clásicos reales de dominio público, audiolibros narrados y prácticas por materia para 4° medio. Lee, escucha y piensa en un solo lugar, incluso sin conexión.')}
          </p>
          <div className="lp-reveal mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start" style={{ '--d': '300ms' } as CSSProperties}>
            <Magnetic
              to="/register"
              className="group h-14 items-center gap-2 rounded-full bg-[var(--lp-mint)] px-8 text-base font-semibold text-[#10201a] shadow-[0_0_0_6px_rgba(220,235,228,0.08),0_20px_50px_-10px_rgba(220,235,228,0.35)]"
            >
              {t('Empieza gratis')}
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Magnetic>
            <a href="#lector" className="inline-flex h-14 items-center gap-2 rounded-full border border-[var(--lp-line2)] px-7 font-semibold text-[var(--lp-mint)] transition-colors hover:bg-white/5">
              <Play className="size-4" aria-hidden /> {t('Míralo en acción')}
            </a>
          </div>
          <p className="lp-reveal mt-8 text-sm text-[var(--lp-muted)]" style={{ '--d': '400ms' } as CSSProperties}>
            {t('Textos de Project Gutenberg y Wikisource · Audio de LibriVox')}
          </p>
        </div>

        <div className="lp-reveal flex flex-col items-center" style={{ '--d': '250ms' } as CSSProperties}>
          <HeroBook open={open} onToggle={() => setOpen((o) => !o)} bookRef={bookRef} />
          <p className="mt-12 inline-flex items-center gap-2 text-xs tracking-wider text-[var(--lp-muted)] uppercase">
            <MousePointerClick className="size-4 text-[var(--lp-gold)]" aria-hidden />
            {open ? t('Toca para cerrarlo') : t('Toca el libro para abrirlo')}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- stats */

function Stats() {
  const [ref, inView] = useInView<HTMLDivElement>(0.3)
  const nf = (digits = 0) => (n: number) => n.toLocaleString(locale(), { maximumFractionDigits: digits, minimumFractionDigits: digits })
  const items = [
    { value: STATS.books, label: t('obras completas'), format: nf() },
    { value: STATS.words / 1e6, label: t('millones de palabras'), format: nf(1) },
    { value: STATS.audioHours, label: t('horas de audiolibros'), format: nf() },
    { value: STATS.questions, label: t('preguntas de práctica'), format: nf() },
  ]
  return (
    <section className="relative px-4 py-16 sm:px-6">
      <div ref={ref} className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[var(--lp-line)] bg-[var(--lp-line)] lg:grid-cols-4">
        {items.map((s, i) => (
          <div key={s.label} className="lp-reveal bg-[var(--lp-bg)] px-5 py-9 text-center sm:py-12" style={{ '--d': `${i * 90}ms` } as CSSProperties}>
            <p className="lp-serif text-4xl font-bold tracking-tight text-[var(--lp-mint)] tabular-nums sm:text-6xl">
              <CountUp value={s.value} run={inView} format={s.format} />
            </p>
            <p className="mt-2 text-sm text-[var(--lp-muted)] sm:text-base">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function AuthorMarquee() {
  const row = [...AUTHORS, ...AUTHORS]
  return (
    <div className="lp-marquee-wrap relative overflow-hidden py-6 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-hidden>
      <div className="lp-marquee flex w-max gap-10" style={{ '--dur': '70s' } as CSSProperties}>
        {row.map((a, i) => (
          <span key={i} className="lp-serif flex items-center gap-10 text-4xl whitespace-nowrap text-transparent italic [-webkit-text-stroke:1px_rgba(220,235,228,0.3)] transition-colors hover:text-[var(--lp-gold)] sm:text-6xl">
            {a}
            <span className="text-2xl text-[var(--lp-gold)] [-webkit-text-stroke:0]">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ cover ring */

function CoverRing({ reduced }: { reduced: boolean }) {
  const [cat, setCat] = useState<Category | 'all'>('all')
  const items = useMemo(() => (cat === 'all' ? [...BOOKS].sort((a, b) => b.popularity - a.popularity).slice(0, 16) : BOOKS.filter((b) => b.category === cat)), [cat])
  const [selected, setSelected] = useState(items[0].id)
  const [stageRef, inView] = useInView<HTMLDivElement>()
  const ringRef = useRef<HTMLDivElement>(null)
  const small = useMediaQuery('(max-width: 640px)')
  const cw = small ? 112 : 150
  const n = Math.max(items.length, 8)
  const step = 360 / n
  const radius = Math.max(small ? 200 : 300, (cw + 26) / (2 * Math.tan(Math.PI / n)))
  const motion = useRef({ angle: 0, vel: 0, target: null as number | null, dragging: false, lastX: 0, moved: 0 })

  useEffect(() => {
    motion.current.target = 0
    motion.current.angle = motion.current.angle % 360
  }, [items])

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) return
    const m = motion.current
    const render = () => {
      ring.style.transform = `translateZ(${-radius}px) rotateX(-6deg) rotateY(${m.angle}deg)`
    }
    if (!inView) return render()
    let raf = 0
    const loop = () => {
      if (!m.dragging) {
        if (m.target !== null) {
          const diff = ((((m.target - m.angle) % 360) + 540) % 360) - 180
          m.angle += diff * 0.1
          if (Math.abs(diff) < 0.05) m.target = null
          m.vel = 0
        } else {
          m.vel += ((reduced ? 0 : -0.06) - m.vel) * 0.03
          m.angle += m.vel
        }
      }
      render()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [inView, radius, reduced])

  const down = (e: ReactPointerEvent) => {
    const m = motion.current
    Object.assign(m, { dragging: true, lastX: e.clientX, moved: 0, target: null })
  }
  const move = (e: ReactPointerEvent) => {
    const m = motion.current
    if (!m.dragging) return
    const dx = e.clientX - m.lastX
    m.lastX = e.clientX
    m.moved += Math.abs(dx)
    m.vel = dx * 0.22
    m.angle += m.vel
  }
  const up = () => (motion.current.dragging = false)

  const pick = (i: number) => {
    if (motion.current.moved > 6) return
    setSelected(items[i].id)
    motion.current.target = -i * step
  }

  const book = items.find((b) => b.id === selected) ?? items[0]
  const cats = CATEGORIES.filter((c) => BOOKS.some((b) => b.category === c))

  return (
    <section id="biblioteca" className="scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <SectionTitle
        eyebrow={t('La colección')}
        title={
          <>
            {t('Clásicos de verdad.')} <span className="lp-shine italic">{t('No resúmenes.')}</span>
          </>
        }
        sub={t('Arrastra para girar la estantería. Toca una portada para conocer la obra.')}
      />

      <div className="lp-reveal mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2" role="toolbar" aria-label={t('Filtrar por materia')}>
        {(['all', ...cats] as const).map((c) => {
          const Icon = c === 'all' ? BookOpen : CATEGORY_ICONS[c]
          const active = cat === c
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCat(c)
                const first = c === 'all' ? [...BOOKS].sort((a, b) => b.popularity - a.popularity)[0] : BOOKS.find((b) => b.category === c)!
                setSelected(first.id)
              }}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all',
                active ? 'border-[var(--lp-gold)] bg-[var(--lp-gold)] text-[#1a1408]' : 'border-[var(--lp-line2)] text-[var(--lp-mint)] hover:border-[var(--lp-sage)]',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {c === 'all' ? t('Destacados') : t(c)}
            </button>
          )
        })}
      </div>

      <div
        ref={stageRef}
        className="lp-ring-stage relative mx-auto mt-6 h-[380px] max-w-7xl sm:h-[460px]"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      >
        <div ref={ringRef} className="lp-ring" style={{ '--cw': `${cw}px` } as CSSProperties}>
          {items.map((b, i) => (
            <div key={b.id} className="lp-ring-item" style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)` }}>
              <button type="button" onClick={() => pick(i)} aria-pressed={b.id === selected} aria-label={b.title} draggable={false}>
                <BookCover book={b} />
              </button>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--lp-bg)] to-transparent" />
      </div>

      <div key={book.id} className="mx-auto mt-4 max-w-4xl animate-rise">
        <div className="lp-spot grid gap-6 p-5 sm:grid-cols-[150px_1fr] sm:p-7">
          <div className="mx-auto w-32 overflow-hidden rounded-lg shadow-2xl sm:w-full">
            <BookCover book={book} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--lp-gold)] uppercase">
              {t(book.category)} · {formatYear(book.year)}
            </p>
            <h3 className="lp-serif mt-2 text-2xl leading-tight font-bold sm:text-3xl">{book.title}</h3>
            <p className="mt-1 text-[var(--lp-muted)]">{book.author}</p>
            <p className="mt-4 line-clamp-3 leading-relaxed text-[var(--lp-mint)]/85">{book.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
              <Pill>{t('{n} capítulos', { n: book.chapters.length })}</Pill>
              <Pill>{t('{n} palabras', { n: book.words.toLocaleString(locale()) })}</Pill>
              {book.hasAudio && (
                <Pill gold>
                  <Headphones className="size-3.5" aria-hidden /> {t('Audiolibro')}
                </Pill>
              )}
              {PRACTICE_SETS.some((s) => s.bookId === book.id) && <Pill>{t('Con prácticas')}</Pill>}
            </div>
            <Link to="/register" className="group mt-6 inline-flex items-center gap-1.5 font-semibold text-[var(--lp-gold)]">
              {t('Leer ahora')} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pill({ children, gold }: { children: ReactNode; gold?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1', gold ? 'border-[var(--lp-gold)]/50 text-[var(--lp-gold)]' : 'border-[var(--lp-line2)] text-[var(--lp-mint)]')}>
      {children}
    </span>
  )
}

/* ----------------------------------------------------------- reader demo */

const WORDS = OPENING.split(' ')
const READER_THEMES = {
  papel: { bg: '#f6f1e6', fg: '#2b2a26', hi: '#f1d9a8', label: 'Papel' },
  sepia: { bg: '#e9d9b9', fg: '#3b2f1e', hi: '#d9b26e', label: 'Sepia' },
  noche: { bg: '#141b18', fg: '#dfe8e3', hi: '#285b4a', label: 'Noche' },
} as const

function ReaderDemo({ reduced }: { reduced: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [idx, setIdx] = useState(-1)
  const [speed, setSpeed] = useState(1)
  const [size, setSize] = useState(19)
  const [theme, setTheme] = useState<keyof typeof READER_THEMES>('papel')
  const autoplayed = useRef(false)

  // Starts reading by itself the first time it scrolls into view, and pauses when it leaves.
  const [ref] = useInView<HTMLDivElement>(0.4, (inView) => {
    if (inView && !autoplayed.current && !reduced) {
      autoplayed.current = true
      setPlaying(true)
    }
    if (!inView) setPlaying(false)
  })

  useEffect(() => {
    if (!playing) return
    if (idx >= WORDS.length - 1) {
      const id = setTimeout(() => {
        setPlaying(false)
        setIdx(-1)
      }, 1200)
      return () => clearTimeout(id)
    }
    const prev = WORDS[idx] ?? ''
    const pause = /[.;]$/.test(prev) ? 2.6 : /,$/.test(prev) ? 1.7 : 1
    const id = setTimeout(() => setIdx((i) => i + 1), ((60000 / 190) * pause) / speed)
    return () => clearTimeout(id)
  }, [playing, idx, speed])

  const total = WORDS.length / (190 / 60)
  const elapsed = Math.max(0, idx + 1) / (190 / 60)
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const th = READER_THEMES[theme]

  return (
    <section id="lector" className="scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>{t('El lector')}</Eyebrow>
          <h2 className="lp-reveal lp-serif mt-5 text-[34px] leading-[1.08] font-bold tracking-tight sm:text-5xl">
            {t('Lee y escucha')} <span className="lp-shine italic">{t('al mismo tiempo.')}</span>
          </h2>
          <p className="lp-reveal mt-5 text-lg text-[var(--lp-muted)]">
            {t('El texto se ilumina palabra por palabra mientras avanza la narración. Ajusta el tamaño de letra, cambia el tema y retoma justo donde quedaste.')}
          </p>
          <ul className="mt-8 space-y-3">
            {[t('Lectura en voz alta y audiolibros reales'), t('Marcadores, búsqueda y progreso guardado'), t('Descarga en PDF para imprimir o estudiar')].map((x, i) => (
              <li key={x} className="lp-reveal flex items-center gap-3 text-[var(--lp-mint)]" style={{ '--d': `${i * 90}ms` } as CSSProperties}>
                <span className="grid size-7 place-items-center rounded-full bg-[var(--lp-forest)] text-[var(--lp-mint)]">
                  <Check className="size-4" aria-hidden />
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div ref={ref} className="lp-reveal relative" style={{ '--d': '120ms' } as CSSProperties}>
          <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(40,91,74,0.45),transparent)]" aria-hidden />
          <div className="overflow-hidden rounded-[28px] border border-[var(--lp-line2)] bg-[var(--lp-card)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--lp-line)] px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-8 shrink-0 overflow-hidden rounded">
                  <BookCover book={QUIJOTE} showText={false} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{QUIJOTE.title}</p>
                  <p className="truncate text-xs text-[var(--lp-muted)]">{t('Capítulo primero')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setSize((s) => Math.max(15, s - 2))} className="grid size-9 place-items-center rounded-full text-sm text-[var(--lp-muted)] hover:bg-white/5" aria-label={t('Reducir tamaño de letra')}>
                  A-
                </button>
                <button type="button" onClick={() => setSize((s) => Math.min(25, s + 2))} className="grid size-9 place-items-center rounded-full text-base font-semibold text-[var(--lp-muted)] hover:bg-white/5" aria-label={t('Aumentar tamaño de letra')}>
                  A+
                </button>
              </div>
            </div>

            <div className="relative h-[300px] overflow-hidden px-6 py-7 transition-colors duration-500 sm:h-[320px] sm:px-9" style={{ background: th.bg, color: th.fg }}>
              <p className="lp-serif text-justify transition-[font-size] duration-300" style={{ fontSize: size, lineHeight: 1.7 }}>
                {WORDS.map((w, i) => (
                  <span key={i}>
                    <span
                      className="rounded-[4px] transition-all duration-200"
                      style={{
                        opacity: idx < 0 || i <= idx ? 1 : 0.38,
                        background: i === idx ? th.hi : 'transparent',
                        boxShadow: i === idx ? `0 0 0 3px ${th.hi}` : 'none',
                        color: i === idx && theme === 'noche' ? '#fff' : undefined,
                      }}
                    >
                      {w}
                    </span>{' '}
                  </span>
                ))}
              </p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(transparent, ${th.bg})` }} />
            </div>

            <div className="border-t border-[var(--lp-line)] px-5 py-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--lp-mint)] text-[#10201a] transition-transform active:scale-95"
                  aria-label={playing ? t('Pausar') : t('Reproducir')}
                >
                  {playing ? <Pause className="size-5" fill="currentColor" aria-hidden /> : <Play className="ml-0.5 size-5" fill="currentColor" aria-hidden />}
                </button>
                <div className="lp-eq flex h-9 flex-1 items-end gap-[3px]" style={{ '--play': playing ? 'running' : 'paused' } as CSSProperties} aria-hidden>
                  {Array.from({ length: 44 }, (_, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-full transition-colors"
                      style={{
                        height: `${30 + ((i * 53) % 70)}%`,
                        '--d': `${-((i * 0.137) % 1.1)}s`,
                        background: (i + 1) / 44 <= (idx + 1) / WORDS.length ? 'var(--lp-gold)' : 'rgba(220,235,228,0.2)',
                      } as CSSProperties}
                    />
                  ))}
                </div>
                <span className="w-20 text-right text-xs text-[var(--lp-muted)] tabular-nums">
                  {mmss(elapsed)} / {mmss(total)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1.5" role="group" aria-label={t('Tema de lectura')}>
                  {(Object.keys(READER_THEMES) as (keyof typeof READER_THEMES)[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setTheme(k)}
                      aria-pressed={theme === k}
                      className={cn('flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors', theme === k ? 'border-[var(--lp-gold)] text-[var(--lp-gold)]' : 'border-[var(--lp-line2)] text-[var(--lp-muted)] hover:text-[var(--lp-mint)]')}
                    >
                      <span className="size-3 rounded-full border border-black/20" style={{ background: READER_THEMES[k].bg }} />
                      {t(READER_THEMES[k].label)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1" role="group" aria-label={t('Velocidad')}>
                  {[0.75, 1, 1.5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSpeed(v)}
                      aria-pressed={speed === v}
                      className={cn('h-8 rounded-full px-2.5 text-xs font-semibold tabular-nums transition-colors', speed === v ? 'bg-white/10 text-[var(--lp-mint)]' : 'text-[var(--lp-muted)] hover:text-[var(--lp-mint)]')}
                    >
                      {v.toLocaleString(locale())}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- confetti */

type Burst = (x: number, y: number) => void

function useConfetti(reduced: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const parts = useRef<{ x: number; y: number; vx: number; vy: number; r: number; vr: number; c: string; w: number; h: number; life: number }[]>([])
  const raf = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const burst: Burst = (x, y) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || reduced) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const colors = ['#d9a35b', '#dcebe4', '#7fa996', '#f4e2c6', '#4f806d', '#ffffff']
    for (let i = 0; i < 140; i++) {
      const a = Math.random() * Math.PI * 2
      const v = 4 + Math.random() * 10
      parts.current.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length], w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, life: 1 })
    }
    cancelAnimationFrame(raf.current)
    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      parts.current = parts.current.filter((p) => p.life > 0 && p.y < window.innerHeight + 20)
      for (const p of parts.current) {
        p.vy += 0.32
        p.vx *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        p.life -= 0.007
        ctx.save()
        ctx.globalAlpha = Math.min(1, p.life * 2)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.r)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)))
        ctx.restore()
      }
      if (parts.current.length) raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }

  const canvas = <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[70] size-full" aria-hidden />
  return { burst, canvas }
}

/* ------------------------------------------------------------- quiz demo */

function QuizDemo({ burst }: { burst: Burst }) {
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [shake, setShake] = useState(false)
  const finished = step >= QUIZ.length
  const item = QUIZ[Math.min(step, QUIZ.length - 1)]

  const answer = (i: number, e: ReactMouseEvent) => {
    if (choice !== null) return
    setChoice(i)
    if (i === item.q.answer) {
      setScore((s) => s + 1)
      burst(e.clientX, e.clientY)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }
  const next = () => {
    setChoice(null)
    setStep((s) => s + 1)
  }
  const restart = () => {
    setStep(0)
    setScore(0)
    setChoice(null)
  }

  return (
    <section id="practica" className="scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="order-2 lg:order-1">
          <div className={cn('lp-reveal lp-spot p-6 sm:p-8', shake && 'lp-shake')}>
            {finished ? (
              <div className="py-6 text-center">
                <ScoreRing value={score} total={QUIZ.length} />
                <h3 className="lp-serif mt-6 text-3xl font-bold">{score === QUIZ.length ? t('¡Perfecto!') : score >= QUIZ.length / 2 ? t('¡Muy bien!') : t('¡Buen comienzo!')}</h3>
                <p className="mx-auto mt-3 max-w-sm text-[var(--lp-muted)]">
                  {t('Te esperan {n} preguntas más, con explicación en cada respuesta.', { n: (STATS.questions - QUIZ.length).toLocaleString(locale()) })}
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--lp-mint)] px-6 font-semibold text-[#10201a]">
                    {t('Seguir practicando')} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <button type="button" onClick={restart} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--lp-line2)] px-6 font-semibold text-[var(--lp-mint)] hover:bg-white/5">
                    <RotateCcw className="size-4" aria-hidden /> {t('Otra vez')}
                  </button>
                </div>
              </div>
            ) : (
              <div key={step} className="animate-rise">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-9 shrink-0 overflow-hidden rounded">
                      <BookCover book={item.book} showText={false} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.book.title}</p>
                      <p className="text-xs text-[var(--lp-gold)]">{t(item.book.category)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5" aria-label={t('Pregunta {n} de {total}', { n: step + 1, total: QUIZ.length })}>
                    {QUIZ.map((_, i) => (
                      <span key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i < step ? 'w-4 bg-[var(--lp-sage)]' : i === step ? 'w-8 bg-[var(--lp-gold)]' : 'w-4 bg-white/15')} />
                    ))}
                  </div>
                </div>
                <p className="lp-serif mt-6 text-xl leading-snug font-bold sm:text-2xl">{item.q.prompt}</p>
                <div className="mt-6 grid gap-2.5">
                  {item.q.options.map((o, i) => {
                    const isAnswer = i === item.q.answer
                    const state = choice === null ? 'idle' : isAnswer ? 'right' : i === choice ? 'wrong' : 'dim'
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => answer(i, e)}
                        disabled={choice !== null}
                        className={cn(
                          'group flex min-h-13 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300',
                          state === 'idle' && 'border-[var(--lp-line2)] hover:-translate-y-0.5 hover:border-[var(--lp-sage)] hover:bg-white/[0.03]',
                          state === 'right' && 'border-[#7cc0a0] bg-[#7cc0a0]/15',
                          state === 'wrong' && 'border-[#de9292] bg-[#de9292]/12',
                          state === 'dim' && 'border-[var(--lp-line)] opacity-45',
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold transition-colors',
                            state === 'right' ? 'bg-[#7cc0a0] text-[#0c1210]' : state === 'wrong' ? 'bg-[#de9292] text-[#0c1210]' : 'bg-white/[0.06] text-[var(--lp-mint)] group-hover:bg-[var(--lp-forest)]',
                          )}
                        >
                          {state === 'right' ? <Check className="size-4" aria-hidden /> : state === 'wrong' ? <X className="size-4" aria-hidden /> : 'ABCD'[i]}
                        </span>
                        <span className="text-[15px]">{o}</span>
                      </button>
                    )
                  })}
                </div>
                {choice !== null && (
                  <div className="mt-5 animate-rise rounded-2xl border border-[var(--lp-line)] bg-white/[0.03] p-4">
                    <p className={cn('text-sm font-semibold', choice === item.q.answer ? 'text-[#7cc0a0]' : 'text-[#de9292]')}>
                      {choice === item.q.answer ? t('¡Correcto!') : t('No exactamente')}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--lp-mint)]/80">{item.q.explanation}</p>
                    <button type="button" onClick={next} className="group mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--lp-mint)] px-5 text-sm font-semibold text-[#10201a]">
                      {step === QUIZ.length - 1 ? t('Ver resultado') : t('Siguiente pregunta')}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <Eyebrow>{t('Prácticas')}</Eyebrow>
          <h2 className="lp-reveal lp-serif mt-5 text-[34px] leading-[1.08] font-bold tracking-tight sm:text-5xl">
            {t('No basta con leer.')} <span className="lp-shine italic">{t('Hay que pensarlo.')}</span>
          </h2>
          <p className="lp-reveal mt-5 text-lg text-[var(--lp-muted)]">
            {t('Cada capítulo trae preguntas escritas para su materia, con la explicación de cada respuesta. Pruébalo aquí mismo: son preguntas reales de la app.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {Object.values(KIND_LABEL).map((k, i) => (
              <span key={k} className="lp-reveal rounded-full border border-[var(--lp-line2)] px-3.5 py-1.5 text-sm text-[var(--lp-mint)]" style={{ '--d': `${i * 70}ms` } as CSSProperties}>
                {t(k)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ScoreRing({ value, total }: { value: number; total: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value / total))
    return () => cancelAnimationFrame(id)
  }, [value, total])
  return (
    <div className="relative mx-auto size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(220,235,228,0.1)" strokeWidth="10" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--lp-gold)" strokeWidth="10" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - shown * 100} className="transition-[stroke-dashoffset] duration-[1400ms] ease-out" />
      </svg>
      <p className="lp-serif absolute inset-0 grid place-items-center text-4xl font-bold">
        {value}/{total}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------- features */

function Features() {
  const [dark, setDark] = useState(true)
  const [en, setEn] = useState(false)
  return (
    <section id="funciones" className="scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <SectionTitle
        eyebrow={t('Todo incluido')}
        title={
          <>
            {t('Pensada para estudiantes.')} <span className="lp-shine italic">{t('Lista para el aula.')}</span>
          </>
        }
      />
      <div className="lp-spots mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-6" onPointerMove={spotlight}>
        {/* Audio */}
        <article className="lp-reveal lp-spot flex flex-col justify-between gap-8 p-7 md:col-span-4">
          <div className="lp-eq flex h-28 items-end gap-1.5" aria-hidden>
            {Array.from({ length: 36 }, (_, i) => (
              <span key={i} className="flex-1 rounded-full bg-gradient-to-t from-[var(--lp-forest)] to-[var(--lp-gold)]" style={{ height: `${25 + ((i * 41) % 75)}%`, '--d': `${-((i * 0.173) % 1.1)}s` } as CSSProperties} />
            ))}
          </div>
          <FeatureText icon={<Headphones className="size-5" />} title={t('{n} horas de audiolibros', { n: Math.round(STATS.audioHours) })} text={t('Grabaciones reales de LibriVox, sincronizadas con el texto. Sigue escuchando mientras navegas por la app.')} />
        </article>

        {/* Offline */}
        <article className="lp-reveal lp-spot flex flex-col justify-between gap-8 p-7 md:col-span-2" style={{ '--d': '80ms' } as CSSProperties}>
          <div className="grid h-28 place-items-center" aria-hidden>
            <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(220,235,228,0.1)" strokeWidth="6" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--lp-gold)" strokeWidth="6" strokeLinecap="round" pathLength={100} strokeDasharray="100" className="lp-ring-progress" />
              <path d="M38 51 l8 8 l16 -17" fill="none" stroke="var(--lp-mint)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="lp-check origin-center rotate-90" />
            </svg>
          </div>
          <FeatureText icon={<Download className="size-5" />} title={t('Funciona sin conexión')} text={t('Descarga tus libros y sigue leyendo en el bus, en el campo o donde no haya señal.')} />
        </article>

        {/* Whiteboard: Euclid, Book I, Proposition 1 */}
        <article className="lp-reveal lp-spot flex flex-col justify-between gap-8 p-7 md:col-span-2" style={{ '--d': '160ms' } as CSSProperties}>
          <div className="grid h-36 place-items-center" aria-hidden>
            <svg viewBox="0 0 160 120" className="h-full">
              <circle cx="60" cy="70" r="40" fill="none" stroke="var(--lp-sage)" strokeWidth="1.5" pathLength={1} className="lp-draw" style={{ '--len': 1 } as CSSProperties} />
              <circle cx="100" cy="70" r="40" fill="none" stroke="var(--lp-sage)" strokeWidth="1.5" pathLength={1} className="lp-draw" style={{ '--len': 1, '--d': '0.5s' } as CSSProperties} />
              <path d="M60 70 L100 70 L80 35.36 Z" fill="none" stroke="var(--lp-gold)" strokeWidth="2.5" strokeLinejoin="round" pathLength={1} className="lp-draw" style={{ '--len': 1, '--d': '1.2s' } as CSSProperties} />
              {[
                [60, 70, 'A'],
                [100, 70, 'B'],
                [80, 35.36, 'C'],
              ].map(([x, y, l], i) => (
                <g key={l} className="lp-pop" style={{ '--d': `${1.4 + i * 0.15}s`, transformOrigin: `${x}px ${y}px` } as CSSProperties}>
                  <circle cx={x} cy={y} r="3" fill="var(--lp-mint)" />
                  <text x={Number(x) + (l === 'A' ? -12 : l === 'B' ? 6 : -4)} y={Number(y) + (l === 'C' ? -7 : 14)} fill="var(--lp-mint)" fontSize="11" fontFamily="Noto Serif, serif">
                    {l}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <FeatureText icon={<FileText className="size-5" />} title={t('Pizarra para pensar')} text={t('Dibuja, construye y explica. Como Euclides en su Proposición I: un triángulo equilátero con dos círculos.')} />
        </article>

        {/* Classroom */}
        <article className="lp-reveal lp-spot flex flex-col justify-between gap-8 p-7 md:col-span-2" style={{ '--d': '240ms' } as CSSProperties}>
          <div className="space-y-3 pt-2" aria-hidden>
            {[
              ['VR', 'Valentina R.', 0.92],
              ['MP', 'Matías P.', 0.68],
              ['JS', 'Josefa S.', 0.81],
              ['BC', 'Benjamín C.', 0.45],
            ].map(([ini, name, v], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--lp-forest)] text-[10px] font-bold">{ini}</span>
                <span className="w-24 truncate text-xs text-[var(--lp-mint)]/80">{name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="lp-bar block h-full rounded-full bg-[var(--lp-sage)]" style={{ '--to': v, '--d': `${i * 0.15}s` } as CSSProperties} />
                </span>
              </div>
            ))}
          </div>
          <FeatureText icon={<Users className="size-5" />} title={t('Aula para profesores')} text={t('Crea cursos con un código, asigna lecturas y revisa las entregas de cada estudiante.')} />
        </article>

        {/* Theme + language */}
        <article className="lp-reveal lp-spot flex flex-col justify-between gap-8 p-7 md:col-span-2" style={{ '--d': '320ms' } as CSSProperties}>
          <div className="flex h-28 items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className={cn('relative h-24 w-20 overflow-hidden rounded-xl border p-2.5 text-left transition-colors duration-500', dark ? 'border-white/10 bg-[#18201d]' : 'border-black/10 bg-[#f6f8f6]')}
              aria-label={t('Cambiar tema')}
            >
              <span className={cn('block h-1.5 w-8 rounded-full transition-colors duration-500', dark ? 'bg-[#dcebe4]' : 'bg-[#285b4a]')} />
              {[1, 0.8, 0.9, 0.6].map((w, i) => (
                <span key={i} className={cn('mt-1.5 block h-1 rounded-full transition-colors duration-500', dark ? 'bg-white/25' : 'bg-black/15')} style={{ width: `${w * 100}%` }} />
              ))}
              <span className="absolute right-2 bottom-2">{dark ? <Moon className="size-4 text-[#dcebe4]" aria-hidden /> : <Sun className="size-4 text-[#c18a45]" aria-hidden />}</span>
            </button>
            <button type="button" onClick={() => setEn((v) => !v)} className="grid h-24 w-28 place-items-center rounded-xl border border-[var(--lp-line2)] text-center" aria-label={t('Cambiar idioma')}>
              <span key={String(en)} className="lp-serif animate-rise text-lg leading-tight whitespace-pre-line">
                {en ? 'Hello,\nreader' : 'Hola,\nlector'}
                <span className="mt-1 block text-[10px] font-bold tracking-widest text-[var(--lp-gold)]">{en ? 'EN' : 'ES'}</span>
              </span>
            </button>
          </div>
          <FeatureText icon={<Sparkles className="size-5" />} title={t('A tu manera')} text={t('Modo claro, oscuro o automático. En español o en inglés. Toca las tarjetas de arriba.')} />
        </article>
      </div>
    </section>
  )
}

function FeatureText({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div>
      <span className="grid size-10 place-items-center rounded-xl bg-[var(--lp-forest)]/60 text-[var(--lp-mint)]" aria-hidden>
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--lp-muted)]">{text}</p>
    </div>
  )
}

/* ------------------------------------------------------------ cta + nav */

function FinalCta() {
  const covers = useMemo(() => [...BOOKS].sort((a, b) => b.popularity - a.popularity).slice(0, 14), [])
  return (
    <section className="relative isolate overflow-hidden px-4 py-28 sm:px-6 sm:py-40">
      <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(closest-side,#000,transparent)]" aria-hidden>
        <div className="lp-marquee flex w-max gap-5 pt-6" style={{ '--dur': '80s' } as CSSProperties}>
          {[...covers, ...covers].map((b, i) => (
            <div key={i} className="w-36 shrink-0 -rotate-6 overflow-hidden rounded-md">
              <BookCover book={b} />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(closest-side,rgba(12,18,16,0.6),var(--lp-bg))]" aria-hidden />
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="lp-reveal lp-serif text-5xl leading-[1.02] font-bold tracking-tight sm:text-7xl">
          {t('Abre un libro.')}
          <br />
          <span className="lp-shine italic">{t('Abre el mundo.')}</span>
        </h2>
        <p className="lp-reveal mx-auto mt-6 max-w-lg text-lg text-[var(--lp-muted)]" style={{ '--d': '100ms' } as CSSProperties}>
          {t('Crea tu cuenta en segundos y empieza a leer hoy. Sin tarjeta, sin anuncios.')}
        </p>
        <div className="lp-reveal mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ '--d': '200ms' } as CSSProperties}>
          <Magnetic to="/register" className="group h-16 items-center gap-2 rounded-full bg-[var(--lp-gold)] px-10 text-lg font-semibold text-[#1a1408] shadow-[0_0_0_8px_rgba(217,163,91,0.12),0_25px_60px_-10px_rgba(217,163,91,0.5)]">
            {t('Crear mi cuenta gratis')}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Magnetic>
          <Link to="/login" className="inline-flex h-16 items-center px-6 font-semibold text-[var(--lp-mint)] hover:underline">
            {t('Ya tengo cuenta')}
          </Link>
        </div>
      </div>
    </section>
  )
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-300', scrolled ? 'border-b border-[var(--lp-line)] bg-[var(--lp-bg)]/75 backdrop-blur-xl' : 'border-b border-transparent')}>
      <div ref={barRef} className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left scale-x-0 bg-gradient-to-r from-[var(--lp-sage)] to-[var(--lp-gold)]" aria-hidden />
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-18 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--lp-forest)]">
            <BookOpen className="size-5 text-[var(--lp-mint)]" strokeWidth={1.8} aria-hidden />
          </span>
          <span className="hidden sm:inline">Biblioteca Educativa</span>
        </a>
        <div className="hidden items-center gap-1 text-sm text-[var(--lp-muted)] md:flex">
          {[
            ['#biblioteca', t('Colección')],
            ['#lector', t('Lector')],
            ['#practica', t('Prácticas')],
            ['#funciones', t('Funciones')],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-3.5 py-2 transition-colors hover:bg-white/5 hover:text-[var(--lp-mint)]">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--lp-mint)] hover:bg-white/5">
            {t('Iniciar sesión')}
          </Link>
          <Link to="/register" className="rounded-full bg-[var(--lp-mint)] px-4 py-2 text-sm font-semibold text-[#10201a] transition-transform hover:scale-[1.03]">
            {t('Empezar')}
          </Link>
        </div>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--lp-line)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[var(--lp-muted)] sm:flex-row">
        <p className="flex items-center gap-2">
          <BookOpen className="size-4 text-[var(--lp-sage)]" aria-hidden /> Biblioteca Educativa · {new Date().getFullYear()}
        </p>
        <p>{t('Obras de dominio público vía Project Gutenberg, Wikisource y LibriVox.')}</p>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ page */

export default function Landing() {
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const { burst, canvas } = useConfetti(reduced)

  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('.lp-reveal')
    if (!els) return
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'smooth'
    return () => {
      html.style.scrollBehavior = prev
    }
  }, [])

  return (
    <div ref={rootRef} id="top" className="lp min-h-dvh font-sans">
      <div className="lp-grain" aria-hidden />
      {canvas}
      <Nav />
      <main>
        <Hero reduced={reduced} />
        <Stats />
        <AuthorMarquee />
        <CoverRing reduced={reduced} />
        <ReaderDemo reduced={reduced} />
        <QuizDemo burst={burst} />
        <Features />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
