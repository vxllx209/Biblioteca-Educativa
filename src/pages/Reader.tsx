import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Crown,
  Headphones,
  List,
  Lock,
  Moon,
  MoreVertical,
  PartyPopper,
  PenLine,
  RotateCcw,
  Search,
  Sun,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Switch } from '../components/Form'
import { Modal } from '../components/Modal'
import { highlightText, PageView, type PageMetrics, type Typography } from '../components/reader/PageView'
import { FONT_MAX, FONT_MIN, ReaderControls } from '../components/ReaderControls'
import { ErrorState } from '../components/States'
import { useAudio } from '../context/AudioContext'
import { useLibrary } from '../context/LibraryContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../context/ToastContext'
import { chapterOffsets, getBook, PREVIEW_CHAPTERS } from '../data/books'
import { KIND_LABEL, setsForChapter } from '../data/practice'
import { useBookContent } from '../hooks/useBookContent'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { cn, normalize } from '../lib/format'
import type { Book, BookContent } from '../types'

const LINE_HEIGHTS = [
  { value: 1.7, label: 'Compacto' },
  { value: 1.8, label: 'Normal' },
  { value: 1.9, label: 'Amplio' },
]
const GAP = 64
const CHARS_PER_MINUTE = 1100

type Pos = { chapter: number; page: number }
type Pending = { kind: 'fraction'; value: number } | { kind: 'block'; index: number } | { kind: 'last' }
type Flip = { id: number; dir: 'next' | 'prev'; from: Pos; to: { chapter: number; page: number | 'last' } }
type Panel = 'toc' | 'bookmarks' | 'search' | 'settings'

/** Remount per book so the saved position is restored. */
export default function ReaderPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const book = getBook(id)
  const cap = params.get('cap')
  if (!book)
    return (
      <div className="grid min-h-dvh place-items-center bg-bg p-6">
        <ErrorState
          title="No encontramos este libro"
          description="El libro no existe o ya no está disponible."
          action={
            <Link to="/explore" className="btn-primary">
              Volver a Explorar
            </Link>
          }
        />
      </div>
    )
  const startChapter = cap !== null && !Number.isNaN(Number(cap)) ? Number(cap) : undefined
  return <Reader key={`${book.id}:${cap ?? ''}`} book={book} startChapter={startChapter} />
}

function pickSpanishVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? []
  const es = voices.filter((v) => v.lang.toLowerCase().startsWith('es'))
  return (
    es.find((v) => /natural|online/i.test(v.name)) ??
    es.find((v) => /google/i.test(v.name)) ??
    es.find((v) => /es-(es|mx|us|419)/i.test(v.lang)) ??
    es[0]
  )
}

function sentences(text: string) {
  const parts = text.replace(/\s+/g, ' ').match(/[^.!?…;:]+[.!?…;:»”"')]*\s*/g) ?? [text]
  const out: string[] = []
  for (const s of parts) {
    const last = out[out.length - 1]
    if (last && last.length + s.length < 220) out[out.length - 1] = last + s
    else out.push(s)
  }
  return out.filter((s) => s.trim())
}

function Reader({ book, startChapter }: { book: Book; startChapter?: number }) {
  const navigate = useNavigate()
  const toast = useToast()
  const audio = useAudio()
  const { prefs, setPref, isDark } = usePreferences()
  const { progress, saveProgress, addBookmark, removeBookmark, canAccess, practice } = useLibrary()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { data, error, loading, retry } = useBookContent(book.id)

  const chapterCount = book.chapters.length
  const locked = !canAccess(book)
  const maxChapter = locked ? Math.min(PREVIEW_CHAPTERS, chapterCount) - 1 : chapterCount - 1
  const { offsets, total } = useMemo(() => chapterOffsets(book), [book])
  const saved = progress[book.id]
  const bookmarks = saved?.bookmarks ?? []

  const initialChapter = Math.max(0, Math.min(startChapter ?? saved?.chapter ?? 0, maxChapter))
  const [pos, setPos] = useState<Pos>(() => ({ chapter: initialChapter, page: 0 }))
  const [pending, setPending] = useState<Pending | null>(() => ({
    kind: 'fraction',
    value: saved && saved.chapter === initialChapter ? saved.position : 0,
  }))
  const [metrics, setMetrics] = useState<(PageMetrics & { chapter: number; key: string }) | null>(null)
  const [flip, setFlip] = useState<Flip | null>(null)
  const [overlay, setOverlay] = useState<'locked' | 'finished' | 'practice' | null>(null)
  /** Chapters whose end-of-chapter practice invitation the reader already skipped. */
  const [skippedPractice, setSkippedPractice] = useState<Set<number>>(() => new Set())
  const [panel, setPanel] = useState<Panel | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlight, setHighlight] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [activeBlock, setActiveBlock] = useState<number | undefined>()
  const [speakNext, setSpeakNext] = useState<number | null>(null)

  // ——— Viewport → page size
  const stageRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => setBox({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [data])
  const compact = box.w < 640
  const padX = compact ? 22 : 56
  const padY = box.h < 560 ? 18 : 36
  const W = Math.max(200, Math.floor(Math.min(box.w - padX * 2, 660)))
  const H = Math.max(200, Math.floor(box.h - padY * 2))
  const pageW = W + padX * 2
  const type = useMemo<Typography>(
    () => ({ fontSize: prefs.readerFontSize, lineHeight: prefs.readerLineHeight, font: prefs.readerFont ?? 'serif' }),
    [prefs.readerFontSize, prefs.readerLineHeight, prefs.readerFont],
  )
  const layoutKey = `${W}x${H}:${type.fontSize}:${type.lineHeight}:${type.font}`
  const dark = prefs.readerDark ?? isDark
  const animate = prefs.readerAnimations !== false && !reduceMotion

  const chapter = data?.chapters[pos.chapter]
  const measured = metrics && metrics.chapter === pos.chapter && metrics.key === layoutKey ? metrics : null
  const pages = measured && !pending ? measured.pages : null

  // Keep the reading position when the layout changes (font size, rotation, window size).
  const lastLayout = useRef(layoutKey)
  useLayoutEffect(() => {
    if (lastLayout.current === layoutKey) return
    const prev = lastLayout.current
    lastLayout.current = layoutKey
    if (metrics && metrics.key === prev && metrics.chapter === pos.chapter && !pending)
      setPending({ kind: 'fraction', value: pos.page / metrics.pages })
  }, [layoutKey, metrics, pos, pending])

  // Resolve a pending position once the chapter has been measured.
  useLayoutEffect(() => {
    if (!pending || !measured) return
    const last = measured.pages - 1
    const page =
      pending.kind === 'last'
        ? last
        : pending.kind === 'block'
          ? (measured.blockPages[pending.index] ?? 0)
          : Math.min(last, Math.floor(pending.value * measured.pages + 1e-6))
    setPos((p) => ({ ...p, page }))
    setPending(null)
  }, [pending, measured])

  const onMeasure = useCallback(
    (m: PageMetrics) => setMetrics({ ...m, chapter: pos.chapter, key: layoutKey }),
    [pos.chapter, layoutKey],
  )

  // ——— Progress
  const percent = useMemo(() => {
    if (overlay === 'finished') return 100
    if (!pages || !total) return saved?.percent ?? 0
    const within = ((pos.page + 1) / pages) * book.chapters[pos.chapter].chars
    return Math.min(100, Math.round(((offsets[pos.chapter] + within) / total) * 1000) / 10)
  }, [pages, pos, book, offsets, total, overlay, saved?.percent])

  useEffect(() => {
    if (!pages || overlay) return
    saveProgress({ bookId: book.id, chapter: pos.chapter, position: pos.page / pages, percent })
  }, [pages, pos, percent, overlay, book.id, saveProgress])

  // ——— Navigation
  const startTurn = useCallback(
    (dir: 'next' | 'prev', from: Pos, to: Flip['to']) => {
      if (to.page === 'last') {
        setPos({ chapter: to.chapter, page: 0 })
        setPending({ kind: 'last' })
      } else setPos({ chapter: to.chapter, page: to.page })
      if (animate) setFlip({ id: Date.now() + Math.random(), dir, from, to })
    },
    [animate],
  )

  const next = useCallback(() => {
    if (overlay || !pages) return
    if (pos.page < pages - 1) return startTurn('next', pos, { chapter: pos.chapter, page: pos.page + 1 })
    // End of a chapter with a guided practice not done yet: invite to practise before moving on.
    if (!skippedPractice.has(pos.chapter) && setsForChapter(book.id, pos.chapter).some((s) => !practice[s.id]))
      return setOverlay('practice')
    if (pos.chapter < maxChapter) return startTurn('next', pos, { chapter: pos.chapter + 1, page: 0 })
    if (pos.chapter < chapterCount - 1) return setOverlay('locked')
    saveProgress({ bookId: book.id, chapter: pos.chapter, position: pos.page / pages, percent: 100 })
    setOverlay('finished')
  }, [overlay, pages, pos, maxChapter, chapterCount, startTurn, saveProgress, book.id, skippedPractice, practice])

  const prev = useCallback(() => {
    if (overlay) return setOverlay(null)
    if (!pages) return
    if (pos.page > 0) return startTurn('prev', pos, { chapter: pos.chapter, page: pos.page - 1 })
    if (pos.chapter > 0) startTurn('prev', pos, { chapter: pos.chapter - 1, page: 'last' })
  }, [overlay, pages, pos, startTurn])

  const jumpTo = useCallback(
    (chapterIndex: number, target: Pending) => {
      if (chapterIndex > maxChapter) {
        setPanel(null)
        return setOverlay('locked')
      }
      setFlip(null)
      setOverlay(null)
      setPos({ chapter: chapterIndex, page: 0 })
      setPending(target)
      setPanel(null)
    },
    [maxChapter],
  )

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setActiveBlock(undefined)
    setSpeakNext(null)
  }, [])

  const scrubTo = useCallback(
    (fraction: number) => {
      const at = fraction * total
      let c = 0
      while (c < chapterCount - 1 && offsets[c + 1] <= at) c++
      const within = Math.min(0.999, Math.max(0, (at - offsets[c]) / Math.max(1, book.chapters[c].chars)))
      stopSpeaking()
      if (c > maxChapter) jumpTo(maxChapter, { kind: 'last' })
      else jumpTo(c, { kind: 'fraction', value: within })
    },
    [total, chapterCount, offsets, book.chapters, maxChapter, jumpTo, stopSpeaking],
  )
  const scrubLabel = useCallback(
    (fraction: number) => {
      const at = fraction * total
      let c = 0
      while (c < chapterCount - 1 && offsets[c + 1] <= at) c++
      return `${Math.round(fraction * 100)}% · ${book.chapters[c].title}${c > maxChapter ? ' (Premium)' : ''}`
    },
    [total, chapterCount, offsets, book.chapters, maxChapter],
  )

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (panel || menuOpen || target.closest('input, textarea, select, [role="dialog"]')) return
      if (e.key === ' ' && target.closest('button, a')) return
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        next()
      }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, panel, menuOpen])

  // Touch swipe + tap zones
  const touch = useRef<{ x: number; y: number; t: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() })
  const onTouchEnd = (e: TouchEvent) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.changedTouches[0].clientX - t.x
    const dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault()
      if (dx < 0) next()
      else prev()
    }
  }
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.getSelection()?.toString()) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    if (x < 0.28) prev()
    else if (x > 0.72) next()
  }

  // Close options menu on outside click
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  // ——— Bookmarks
  const firstBlockOnPage = useCallback(() => {
    if (!measured) return 0
    let idx = 0
    measured.blockPages.forEach((p, i) => {
      if (p <= pos.page) idx = i
    })
    return idx
  }, [measured, pos.page])

  const bookmarkIndex = pages
    ? bookmarks.findIndex((b) => b.chapter === pos.chapter && Math.min(pages - 1, Math.floor(b.position * pages + 1e-6)) === pos.page)
    : -1
  const toggleBookmark = () => {
    if (!pages || !chapter) return
    if (bookmarkIndex >= 0) {
      removeBookmark(book.id, bookmarkIndex)
      return toast('Marcador eliminado', 'info')
    }
    const text = chapter.blocks[firstBlockOnPage()]?.[1] ?? chapter.title
    addBookmark(book.id, { chapter: pos.chapter, position: pos.page / pages, excerpt: text.slice(0, 110) })
    toast('Página marcada')
  }

  // ——— Read aloud (Web Speech API), turning pages as it goes
  const live = useRef({ pos, measured, data, maxChapter, animate })
  useEffect(() => {
    live.current = { pos, measured, data, maxChapter, animate }
  })
  const speechToken = useRef(0)

  const speakChapter = useCallback(
    (chapterIndex: number, fromBlock: number) => {
      const synth = window.speechSynthesis
      const content = live.current.data?.chapters[chapterIndex]
      if (!synth || !content) return
      synth.cancel()
      const token = ++speechToken.current
      const voice = pickSpanishVoice()
      const queue: { text: string; block: number }[] = []
      if (fromBlock === 0) queue.push({ text: `${content.title}. ${content.subtitle ?? ''}`, block: -1 })
      content.blocks.slice(fromBlock).forEach(([, text], i) => sentences(text).forEach((s) => queue.push({ text: s, block: fromBlock + i })))
      queue.forEach((item, i) => {
        const u = new SpeechSynthesisUtterance(item.text)
        u.lang = voice?.lang ?? 'es-ES'
        if (voice) u.voice = voice
        u.rate = prefs.audioRate
        u.volume = prefs.audioVolume
        u.onstart = () => {
          if (token !== speechToken.current || item.block < 0) return
          setActiveBlock(item.block)
          const { pos: p, measured: m } = live.current
          const target = m?.blockPages[item.block]
          if (m && p.chapter === chapterIndex && target !== undefined && target > p.page) {
            setPos({ chapter: chapterIndex, page: target })
            if (live.current.animate) setFlip({ id: Date.now(), dir: 'next', from: p, to: { chapter: chapterIndex, page: target } })
          }
        }
        if (i === queue.length - 1)
          u.onend = () => {
            if (token !== speechToken.current) return
            if (chapterIndex < live.current.maxChapter) {
              setActiveBlock(undefined)
              setPos({ chapter: chapterIndex + 1, page: 0 })
              setPending(null)
              setSpeakNext(chapterIndex + 1)
            } else {
              setSpeaking(false)
              setActiveBlock(undefined)
            }
          }
        synth.speak(u)
      })
    },
    [prefs.audioRate, prefs.audioVolume],
  )

  // Continue reading aloud once the next chapter is laid out.
  useEffect(() => {
    if (speaking && speakNext !== null && measured && measured.chapter === speakNext) {
      setSpeakNext(null)
      speakChapter(speakNext, 0)
    }
  }, [speaking, speakNext, measured, speakChapter])

  useEffect(() => () => void window.speechSynthesis?.cancel(), [])

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) return toast('Tu navegador no admite la lectura en voz alta.', 'error')
    if (speaking) return stopSpeaking()
    audio.pause()
    setSpeaking(true)
    speakChapter(pos.chapter, firstBlockOnPage())
  }

  // ——— Search
  const results = useMemo(() => {
    const term = normalize(searchTerm.trim())
    if (!data || term.length < 3) return []
    const out: { chapter: number; block: number; snippet: string }[] = []
    data.chapters.forEach((c, ci) =>
      c.blocks.forEach(([, text], bi) => {
        if (out.length >= 150) return
        const idx = normalize(text).indexOf(term)
        if (idx === -1) return
        const start = Math.max(0, idx - 50)
        out.push({ chapter: ci, block: bi, snippet: (start ? '…' : '') + text.slice(start, idx + term.length + 80).replace(/\n/g, ' ') + '…' })
      }),
    )
    return out
  }, [searchTerm, data])

  const chapterTitle = chapter?.title ?? book.chapters[pos.chapter]?.title ?? ''
  const minutesLeft = pages && chapter ? Math.max(1, Math.round(((1 - (pos.page + 1) / pages) * book.chapters[pos.chapter].chars) / CHARS_PER_MINUTE)) : null
  const pageLabel = pages
    ? `Cap. ${pos.chapter + 1} de ${chapterCount} · Pág. ${pos.page + 1} de ${pages}${minutesLeft && pos.page < pages - 1 ? ` · ${minutesLeft} min restantes` : ''}`
    : 'Preparando páginas…'

  const menuItems = [
    { label: 'Índice', icon: List, onClick: () => setPanel('toc') },
    { label: 'Marcadores', icon: Bookmark, onClick: () => setPanel('bookmarks') },
    { label: 'Buscar en el libro', icon: Search, onClick: () => setPanel('search') },
    ...(book.hasAudio
      ? [
          {
            label: 'Escuchar audiolibro',
            icon: Headphones,
            onClick: () => {
              stopSpeaking()
              audio.load(book.id, { autoplay: true })
              navigate(`/audio/${book.id}`)
            },
          },
        ]
      : []),
    { label: dark ? 'Modo claro' : 'Modo oscuro', icon: dark ? Sun : Moon, onClick: () => setPref('readerDark', !dark) },
    { label: 'Detalles del libro', icon: BookOpen, onClick: () => navigate(`/book/${book.id}`) },
  ]

  const pageBg = 'bg-surface dark:bg-bg'
  const renderPage = (spec: { chapter: number; page: number | 'last' }, measure?: boolean) => {
    const c = data?.chapters[spec.chapter]
    if (!c || !box.w) return null
    return (
      <div className="absolute" style={{ left: padX, top: padY }}>
        <PageView
          chapter={c}
          page={spec.page}
          width={W}
          height={H}
          gap={GAP}
          type={type}
          highlight={highlight}
          activeBlock={spec.chapter === pos.chapter ? activeBlock : undefined}
          onMeasure={measure ? onMeasure : undefined}
        />
      </div>
    )
  }

  return (
    <div className={cn(dark ? 'dark' : 'light', 'flex h-dvh flex-col overflow-hidden text-text transition-colors duration-200', pageBg)}>
      {/* Header */}
      <header className="relative z-20 border-b border-line bg-surface/95 backdrop-blur dark:bg-bg/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-2 sm:px-4">
          <button onClick={() => navigate(-1)} className="grid size-11 place-items-center rounded-xl text-text hover:bg-bg2" aria-label="Volver">
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-[15px] font-semibold text-text">{book.title}</h1>
            <p className="truncate text-xs text-muted">{chapterTitle}</p>
          </div>
          <Link
            to={`/practice/${book.id}?cap=${pos.chapter}`}
            className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-accent hover:bg-bg2"
            aria-label="Practicar este capítulo"
            title="Practicar este capítulo"
          >
            <PenLine className="size-5" aria-hidden />
            <span className="hidden sm:inline">Practicar</span>
          </Link>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="grid size-11 place-items-center rounded-xl text-text hover:bg-bg2"
              aria-label="Opciones de lectura"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical className="size-5" />
            </button>
            {menuOpen && (
              <ul role="menu" className="absolute top-12 right-0 z-30 w-60 animate-rise overflow-hidden rounded-[14px] border border-line bg-surface py-1.5 shadow-pop">
                {menuItems.map(({ label, icon: Icon, onClick }) => (
                  <li key={label} role="none">
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        onClick()
                      }}
                      className="flex h-11 w-full items-center gap-3 px-4 text-left text-sm text-text hover:bg-bg2"
                    >
                      <Icon className="size-[18px] text-muted" aria-hidden />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* Page area */}
      <main className="relative min-h-0 flex-1" aria-label="Contenido del libro">
        {loading && (
          <div className="mx-auto max-w-[660px] space-y-4 px-6 py-12" aria-busy="true" aria-label="Cargando libro">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-8 w-2/3" />
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="skeleton h-4" style={{ width: `${88 - ((i * 13) % 30)}%` }} />
            ))}
          </div>
        )}
        {error && (
          <div className="grid h-full place-items-center p-6">
            <ErrorState
              title="No pudimos abrir el libro"
              description={`${error} Si no tienes conexión, descarga el libro la próxima vez para leerlo sin internet.`}
              action={
                <button className="btn-primary" onClick={retry}>
                  <RotateCcw className="size-4" aria-hidden /> Reintentar
                </button>
              }
            />
          </div>
        )}
        {data && (
          <div ref={stageRef} className="absolute inset-0 flex justify-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div
              className="page-stage relative h-full select-text md:border-x md:border-line"
              style={{ width: pageW }}
              onClick={onStageClick}
            >
              {/* Current page (also used for measuring) */}
              <div className={cn('absolute inset-0', pageBg, pending && 'opacity-0')}>
                {renderPage({ chapter: pos.chapter, page: pending?.kind === 'last' ? 'last' : pos.page }, true)}
              </div>
              {/* Shadow cast by a page turning over this one */}
              {flip?.dir === 'next' && <div key={`cast-${flip.id}`} className="page-cast turn-next absolute inset-0" />}
              {/* Turning back: keep the page we're leaving underneath until the leaf lands */}
              {flip?.dir === 'prev' && (
                <div className={cn('absolute inset-0', pageBg)}>
                  {renderPage(flip.from)}
                  <div key={`cast-${flip.id}`} className="page-cast turn-prev absolute inset-0" />
                </div>
              )}
              {flip && (
                <div
                  key={flip.id}
                  className={cn('page-leaf absolute inset-0 z-10', flip.dir === 'next' ? 'turn-next' : 'turn-prev')}
                  onAnimationEnd={(e) => e.target === e.currentTarget && setFlip(null)}
                  aria-hidden
                >
                  <div className={cn('page-face', pageBg)}>
                    {renderPage(flip.dir === 'next' ? flip.from : flip.to)}
                    <div className="leaf-shade absolute inset-0" />
                  </div>
                  <div className="page-face page-face-back bg-bg2" />
                </div>
              )}

              {overlay && (
                <div className={cn('absolute inset-0 z-20 grid animate-fade-in place-items-center p-8 text-center', pageBg)}>
                  {overlay === 'practice' ? (
                    <div className="flex w-full max-w-md flex-col items-center">
                      <span className="grid size-16 place-items-center rounded-full bg-soft text-accent">
                        <PenLine className="size-7" aria-hidden />
                      </span>
                      <h2 className="mt-5 text-xl font-semibold text-text">Terminaste «{chapterTitle}»</h2>
                      <p className="mt-2 text-[15px] text-muted">Antes de seguir, pon en práctica lo que acabas de leer.</p>
                      <ul className="mt-5 w-full space-y-2 text-left">
                        {setsForChapter(book.id, pos.chapter).map((s) => (
                          <li key={s.id}>
                            <Link to={`/practice/${book.id}/${s.id}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-active">
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium text-text">{s.title}</span>
                                <span className="block text-xs text-muted">
                                  {KIND_LABEL[s.kind]} · {s.questions.length} preguntas{practice[s.id] ? ` · ${Math.round(practice[s.id].best * 100)}%` : ''}
                                </span>
                              </span>
                              <span className="text-sm font-semibold text-accent">Practicar</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          setSkippedPractice((prev) => new Set(prev).add(pos.chapter))
                          setOverlay(null)
                          if (pos.chapter < maxChapter) startTurn('next', pos, { chapter: pos.chapter + 1, page: 0 })
                          else setOverlay(pos.chapter < chapterCount - 1 ? 'locked' : 'finished')
                        }}
                        className="btn-ghost mt-4"
                      >
                        Seguir leyendo
                      </button>
                    </div>
                  ) : overlay === 'locked' ? (
                    <div className="flex max-w-sm flex-col items-center">
                      <span className="grid size-16 place-items-center rounded-full bg-soft text-accent">
                        <Lock className="size-7" aria-hidden />
                      </span>
                      <h2 className="mt-5 text-xl font-semibold text-text">Terminaste la vista previa</h2>
                      <p className="mt-2 text-[15px] text-muted">
                        «{book.title}» es un libro Premium. Mejora tu plan para seguir leyendo sin límites.
                      </p>
                      <Link to="/premium" className="btn-primary mt-6">
                        <Crown className="size-5" aria-hidden /> Ver planes
                      </Link>
                      <button onClick={() => setOverlay(null)} className="btn-ghost mt-2">
                        Volver a la página anterior
                      </button>
                    </div>
                  ) : (
                    <div className="flex max-w-sm flex-col items-center">
                      <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
                        <PartyPopper className="size-7" aria-hidden />
                      </span>
                      <h2 className="mt-5 text-xl font-semibold text-text">¡Terminaste el libro!</h2>
                      <p className="mt-2 text-[15px] text-muted">
                        Leíste «{book.title}» de {book.author}. Tu progreso quedó guardado.
                      </p>
                      <Link to="/explore" className="btn-primary mt-6">
                        Descubrir más libros
                      </Link>
                      <button onClick={() => setOverlay(null)} className="btn-ghost mt-2">
                        Volver a la última página
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ReaderControls
        percent={percent}
        pageLabel={overlay === 'finished' ? 'Libro terminado' : pageLabel}
        onPrev={prev}
        onNext={next}
        canPrev={!!overlay || (!!pages && (pos.page > 0 || pos.chapter > 0))}
        canNext={!!pages && !overlay}
        onScrub={scrubTo}
        scrubLabel={scrubLabel}
        bookmarked={bookmarkIndex >= 0}
        onBookmark={toggleBookmark}
        fontSize={prefs.readerFontSize}
        onFontSize={(s) => setPref('readerFontSize', s)}
        onSettings={() => setPanel('settings')}
        onSearch={() => setPanel('search')}
        speaking={speaking}
        onSpeak={toggleSpeak}
      />

      <ReaderPanels
        book={book}
        data={data}
        panel={panel}
        setPanel={setPanel}
        currentChapter={pos.chapter}
        maxChapter={maxChapter}
        bookmarks={bookmarks}
        onJump={(c, target) => {
          stopSpeaking()
          jumpTo(c, target)
        }}
        onRemoveBookmark={(i) => removeBookmark(book.id, i)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        results={results}
        onResult={(r) => {
          setHighlight(searchTerm.trim())
          stopSpeaking()
          jumpTo(r.chapter, { kind: 'block', index: r.block })
        }}
        highlight={highlight}
        clearHighlight={() => setHighlight('')}
        dark={dark}
      />
    </div>
  )
}

function ReaderPanels(p: {
  book: Book
  data?: BookContent
  panel: Panel | null
  setPanel: (p: Panel | null) => void
  currentChapter: number
  maxChapter: number
  bookmarks: { chapter: number; position: number; excerpt: string }[]
  onJump: (chapter: number, target: Pending) => void
  onRemoveBookmark: (index: number) => void
  searchTerm: string
  setSearchTerm: (s: string) => void
  results: { chapter: number; block: number; snippet: string }[]
  onResult: (r: { chapter: number; block: number }) => void
  highlight: string
  clearHighlight: () => void
  dark: boolean
}) {
  const { prefs, setPref } = usePreferences()
  const close = () => p.setPanel(null)
  const chapters = p.book.chapters
  const option = (active: boolean) =>
    cn(
      'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors',
      active ? 'border-primary bg-softer text-accent dark:border-secondary' : 'border-line text-muted hover:border-line-active',
    )

  return (
    <>
      <Modal open={p.panel === 'toc'} onClose={close} title="Índice" description={`${chapters.length} secciones`} size="lg">
        <ol className="space-y-2">
          {chapters.map((c, ci) => (
            <li key={ci}>
              {c.part && (ci === 0 || chapters[ci - 1].part !== c.part) && (
                <p className="mt-4 mb-2 px-1 text-xs font-semibold tracking-wide text-secondary uppercase">{c.part}</p>
              )}
              <button
                onClick={() => p.onJump(ci, { kind: 'fraction', value: 0 })}
                className={cn(
                  'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left text-sm transition-colors',
                  p.currentChapter === ci ? 'border-line-active bg-softer text-accent' : 'border-line text-text hover:border-line-active',
                )}
                aria-current={p.currentChapter === ci ? 'true' : undefined}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.title}</span>
                  {c.subtitle && <span className="block truncate text-xs text-muted">{c.subtitle}</span>}
                </span>
                {ci > p.maxChapter ? <Lock className="size-4 shrink-0 text-muted" aria-label="Premium" /> : null}
              </button>
            </li>
          ))}
        </ol>
      </Modal>

      <Modal open={p.panel === 'bookmarks'} onClose={close} title="Marcadores">
        {p.bookmarks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aún no tienes marcadores. Toca el ícono de marcador para guardar la página actual.</p>
        ) : (
          <ul className="space-y-2">
            {p.bookmarks.map((b, i) => (
              <li key={i} className="flex items-stretch gap-2">
                <button
                  onClick={() => p.onJump(b.chapter, { kind: 'fraction', value: b.position })}
                  className="flex min-h-12 flex-1 items-start gap-3 rounded-xl border border-line px-4 py-3 text-left text-sm hover:border-line-active"
                >
                  <Bookmark className="mt-0.5 size-4 shrink-0 fill-current text-accent" aria-hidden />
                  <span className="min-w-0">
                    <span className="block font-medium text-text">{chapters[b.chapter]?.title}</span>
                    <span className="line-clamp-2 text-xs text-muted">«{b.excerpt}…»</span>
                  </span>
                </button>
                <button onClick={() => p.onRemoveBookmark(i)} className="icon-btn h-auto rounded-xl" aria-label="Eliminar marcador">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={p.panel === 'search'}
        onClose={close}
        title="Buscar en el libro"
        size="lg"
        footer={
          p.highlight ? (
            <button className="btn-secondary" onClick={p.clearHighlight}>
              Quitar resaltado
            </button>
          ) : undefined
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={p.searchTerm}
            onChange={(e) => p.setSearchTerm(e.target.value)}
            placeholder="Escribe una palabra o frase"
            className="field pl-11"
            aria-label="Buscar texto"
          />
        </div>
        <p className="mt-3 text-xs text-muted" aria-live="polite">
          {!p.data
            ? 'Cargando el texto…'
            : p.searchTerm.trim().length < 3
              ? 'Escribe al menos 3 caracteres.'
              : `${p.results.length}${p.results.length >= 150 ? '+' : ''} coincidencias`}
        </p>
        <ul className="mt-3 space-y-2">
          {p.results.map((r, i) => (
            <li key={i}>
              <button onClick={() => p.onResult(r)} className="w-full rounded-xl border border-line p-3 text-left text-sm transition-colors hover:border-line-active">
                <span className="flex items-center gap-2 text-xs font-medium text-secondary">
                  {chapters[r.chapter]?.title}
                  {r.chapter > p.maxChapter && <Lock className="size-3" aria-label="Premium" />}
                </span>
                <span className="mt-1 block text-muted">{highlightText(r.snippet, p.searchTerm.trim())}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={p.panel === 'settings'} onClose={close} title="Configuración de lectura" size="sm">
        <div className="space-y-6">
          <div>
            <p className="label">Tema</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPref('readerDark', false)} aria-pressed={!p.dark} className={option(!p.dark)}>
                <Sun className="size-4" aria-hidden /> Claro
              </button>
              <button onClick={() => setPref('readerDark', true)} aria-pressed={p.dark} className={option(p.dark)}>
                <Moon className="size-4" aria-hidden /> Oscuro
              </button>
            </div>
          </div>
          <div>
            <p className="label">Tipografía</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPref('readerFont', 'serif')} aria-pressed={prefs.readerFont === 'serif'} className={cn(option(prefs.readerFont === 'serif'), 'reader-font-serif text-[15px]')}>
                Serif
              </button>
              <button onClick={() => setPref('readerFont', 'sans')} aria-pressed={prefs.readerFont === 'sans'} className={option(prefs.readerFont === 'sans')}>
                Sans (Inter)
              </button>
            </div>
          </div>
          <div>
            <p className="label">Tamaño de letra · {prefs.readerFontSize}px</p>
            <input
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              value={prefs.readerFontSize}
              onChange={(e) => setPref('readerFontSize', Number(e.target.value))}
              className="range"
              style={{ ['--fill' as string]: `${((prefs.readerFontSize - FONT_MIN) / (FONT_MAX - FONT_MIN)) * 100}%` }}
              aria-label="Tamaño de letra"
            />
          </div>
          <div>
            <p className="label">Interlineado</p>
            <div className="grid grid-cols-3 gap-3">
              {LINE_HEIGHTS.map((lh) => (
                <button key={lh.value} onClick={() => setPref('readerLineHeight', lh.value)} aria-pressed={prefs.readerLineHeight === lh.value} className={option(prefs.readerLineHeight === lh.value)}>
                  {lh.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-line pt-2">
            <Switch
              label="Animación al pasar página"
              description="Efecto de hoja que se da vuelta"
              checked={prefs.readerAnimations !== false}
              onChange={(v) => setPref('readerAnimations', v)}
            />
          </div>
          <p className="rounded-xl bg-softer p-3 text-xs text-muted">
            Tu posición se guarda automáticamente. Pasa de página con las flechas del teclado, deslizando el dedo o tocando los bordes de la página.
          </p>
        </div>
      </Modal>
    </>
  )
}
