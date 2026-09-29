import { ArrowLeft, Bookmark, BookOpen, Crown, Headphones, List, Lock, Moon, MoreVertical, Search, Sun } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { FONT_MAX, FONT_MIN, ReaderControls } from '../components/ReaderControls'
import { ErrorState } from '../components/States'
import { useAudio } from '../context/AudioContext'
import { useLibrary } from '../context/LibraryContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../context/ToastContext'
import { getBook } from '../data/books'
import { cn, normalize } from '../lib/format'
import { paginate, percentFor } from '../lib/reader'

const LINE_HEIGHTS = [1.7, 1.8, 1.9]

/** Highlights case/accent-insensitive matches of `term` in `text`. */
function highlight(text: string, term: string): ReactNode {
  if (!term) return text
  const hay = normalize(text)
  const needle = normalize(term)
  const parts: ReactNode[] = []
  let from = 0
  let idx = hay.indexOf(needle)
  while (idx !== -1) {
    parts.push(text.slice(from, idx))
    parts.push(
      <mark key={idx} className="rounded bg-soft px-0.5 text-accent">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    )
    from = idx + needle.length
    idx = hay.indexOf(needle, from)
  }
  parts.push(text.slice(from))
  return parts
}

/** Remount per book so the initial page is restored from saved progress. */
export default function ReaderPage() {
  const { id } = useParams()
  return <Reader key={id} id={id} />
}

function Reader({ id }: { id: string | undefined }) {
  const book = getBook(id)
  const navigate = useNavigate()
  const toast = useToast()
  const audio = useAudio()
  const { prefs, setPref, isDark } = usePreferences()
  const { progress, saveProgress, toggleBookmark, canAccess } = useLibrary()

  const pages = useMemo(() => (book ? paginate(book) : []), [book])
  const saved = book ? progress[book.id] : undefined
  const [page, setPage] = useState(() => Math.min(saved?.page ?? 0, Math.max(0, pages.length - 1)))
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<'toc' | 'bookmarks' | 'search' | 'settings' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightTerm, setHighlightTerm] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)

  const locked = book ? !canAccess(book) : false
  const maxPage = locked ? pages.filter((p) => p.chapter === 0).length - 1 : pages.length - 1
  const current = pages[page]
  const isLockedPage = page > maxPage
  const dark = prefs.readerDark ?? isDark
  const percent = percentFor(page, pages.length)
  const bookmarks = saved?.bookmarks ?? []

  // Persist position whenever the page changes (never for locked preview pages).
  useEffect(() => {
    if (!book || !current || isLockedPage) return
    saveProgress({ bookId: book.id, page, totalPages: pages.length, chapter: current.chapter, percent })
  }, [book, page, pages.length, current, percent, isLockedPage, saveProgress])

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, next))
      setPage((p) => {
        if (p !== clamped) contentRef.current?.scrollTo({ top: 0 })
        return clamped
      })
    },
    [pages.length],
  )

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (panel || (e.target as HTMLElement).closest('input, textarea, select')) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(page + 1)
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, page, panel])

  // Close options menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  // Text-to-speech: read the current page and keep going page by page.
  const speakingRef = useRef(false)
  useEffect(() => {
    speakingRef.current = speaking
    if (!speaking || !current || isLockedPage) {
      if (!speaking) window.speechSynthesis?.cancel()
      if (speaking && isLockedPage) setSpeaking(false)
      return
    }
    const synth = window.speechSynthesis
    synth.cancel()
    const text = [current.isChapterStart ? current.chapterTitle : '', ...current.paragraphs].filter(Boolean).join('. ')
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'
    u.rate = prefs.audioRate
    u.volume = prefs.audioVolume
    u.onend = () => {
      if (!speakingRef.current) return
      if (page < pages.length - 1) go(page + 1)
      else setSpeaking(false)
    }
    synth.speak(u)
  }, [speaking, page, current, isLockedPage, pages.length, go, prefs.audioRate, prefs.audioVolume])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) return toast('Tu navegador no admite lectura en voz alta.', 'error')
    if (!speaking) audio.pause()
    setSpeaking((s) => !s)
  }

  const searchResults = useMemo(() => {
    const term = normalize(searchTerm.trim())
    if (term.length < 2) return []
    const out: { page: number; chapter: string; snippet: string }[] = []
    pages.forEach((p, i) => {
      p.paragraphs.forEach((para) => {
        const idx = normalize(para).indexOf(term)
        if (idx !== -1) {
          const start = Math.max(0, idx - 50)
          out.push({ page: i, chapter: p.chapterTitle, snippet: (start ? '…' : '') + para.slice(start, idx + term.length + 70) + '…' })
        }
      })
    })
    return out
  }, [searchTerm, pages])

  if (!book || !current)
    return (
      <div className="grid min-h-dvh place-items-center bg-bg p-6">
        <ErrorState
          title="No pudimos abrir este libro"
          description="El libro no existe o su contenido no está disponible."
          action={
            <Link to="/explore" className="btn-primary">
              Volver a Explorar
            </Link>
          }
        />
      </div>
    )

  const jump = (p: number) => {
    go(p)
    setPanel(null)
  }

  const menuItems = [
    { label: 'Índice', icon: List, onClick: () => setPanel('toc') },
    { label: 'Marcadores', icon: Bookmark, onClick: () => setPanel('bookmarks') },
    { label: 'Buscar en el libro', icon: Search, onClick: () => setPanel('search') },
    ...(book.hasAudio
      ? [{ label: 'Escuchar audiolibro', icon: Headphones, onClick: () => { audio.load(book.id, { autoplay: true }); navigate(`/audio/${book.id}`) } }]
      : []),
    { label: dark ? 'Modo claro' : 'Modo oscuro', icon: dark ? Sun : Moon, onClick: () => setPref('readerDark', !dark) },
    { label: 'Detalles del libro', icon: BookOpen, onClick: () => navigate(`/book/${book.id}`) },
  ]

  return (
    <div className={cn(dark ? 'dark' : 'light', 'flex h-dvh flex-col bg-surface text-text transition-colors duration-200 dark:bg-bg')}>
      {/* Header */}
      <header className="border-b border-line bg-surface/95 backdrop-blur dark:bg-bg/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-2 sm:px-4">
          <button onClick={() => navigate(-1)} className="grid size-11 place-items-center rounded-xl text-text hover:bg-bg2" aria-label="Volver">
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-[15px] font-semibold text-text">{book.title}</h1>
            <p className="truncate text-xs text-muted">{current.chapterTitle}</p>
          </div>
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
              <ul role="menu" className="absolute top-12 right-0 z-20 w-60 animate-rise overflow-hidden rounded-[14px] border border-line bg-surface py-1.5 shadow-pop">
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

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) > 60) go(page + (dx < 0 ? 1 : -1))
        }}
      >
        <article key={page} className="mx-auto max-w-[760px] animate-fade-in px-6 py-10 sm:px-10 sm:py-14" aria-live="polite">
          {isLockedPage ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-soft text-accent">
                <Lock className="size-7" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-text">Terminaste la vista previa</h2>
              <p className="mt-2 max-w-sm text-[15px] text-muted">
                “{book.title}” es un libro Premium. Mejora tu plan para seguir leyendo sin límites.
              </p>
              <Link to="/premium" className="btn-primary mt-6">
                <Crown className="size-5" aria-hidden /> Ver planes
              </Link>
            </div>
          ) : (
            <>
              {current.isChapterStart && (
                <header className="mb-8">
                  <p className="text-xs font-semibold tracking-[0.12em] text-secondary uppercase">
                    {current.chapterTitle.split('·')[0]}
                  </p>
                  <h2 className="mt-2 text-2xl leading-tight font-bold text-text sm:text-[28px]">
                    {current.chapterTitle.split('·')[1]?.trim() ?? current.chapterTitle}
                  </h2>
                </header>
              )}
              <div style={{ fontSize: prefs.readerFontSize, lineHeight: prefs.readerLineHeight }} className="space-y-[1.1em] text-text">
                {current.paragraphs.map((para, i) => (
                  <p key={i} className={cn(i === 0 && current.isChapterStart && 'first-letter:float-left first-letter:mr-2 first-letter:text-[3.2em] first-letter:leading-[0.9] first-letter:font-bold first-letter:text-accent')}>
                    {highlight(para, highlightTerm)}
                  </p>
                ))}
              </div>
              {bookmarks.includes(page) && (
                <p className="mt-10 flex items-center justify-center gap-2 text-xs font-medium text-secondary">
                  <Bookmark className="size-3.5 fill-current" aria-hidden /> Página marcada
                </p>
              )}
            </>
          )}
        </article>
      </div>

      <ReaderControls
        page={page}
        total={pages.length}
        percent={percent}
        onPrev={() => go(page - 1)}
        onNext={() => go(page + 1)}
        onSeek={go}
        canNext={page < pages.length - 1 && !isLockedPage}
        bookmarked={bookmarks.includes(page)}
        onBookmark={() => {
          if (isLockedPage) return
          toggleBookmark(book.id, page)
          toast(bookmarks.includes(page) ? 'Marcador eliminado' : 'Página marcada', bookmarks.includes(page) ? 'info' : 'success')
        }}
        fontSize={prefs.readerFontSize}
        onFontSize={(s) => setPref('readerFontSize', s)}
        onSettings={() => setPanel('settings')}
        onSearch={() => setPanel('search')}
        speaking={speaking}
        onSpeak={toggleSpeak}
      />

      {/* Panels */}
      <Modal open={panel === 'toc'} onClose={() => setPanel(null)} title="Índice" description={`${book.chapters.length} capítulos`}>
        <ol className="space-y-2">
          {book.chapters.map((c, ci) => {
            const first = pages.findIndex((p) => p.chapter === ci)
            const chapterLocked = first > maxPage
            return (
              <li key={c.title}>
                <button
                  onClick={() => jump(first)}
                  className={cn(
                    'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left text-sm transition-colors',
                    current.chapter === ci ? 'border-line-active bg-softer text-accent' : 'border-line text-text hover:border-line-active',
                  )}
                >
                  <span className="flex-1 font-medium">{c.title}</span>
                  {chapterLocked ? <Lock className="size-4 text-muted" aria-label="Premium" /> : <span className="text-xs text-muted">Pág. {first + 1}</span>}
                </button>
              </li>
            )
          })}
        </ol>
      </Modal>

      <Modal open={panel === 'bookmarks'} onClose={() => setPanel(null)} title="Marcadores">
        {bookmarks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aún no tienes marcadores. Usa el ícono de marcador para guardar una página.</p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li key={b}>
                <button onClick={() => jump(b)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-line px-4 py-2 text-left text-sm hover:border-line-active">
                  <Bookmark className="size-4 fill-current text-accent" aria-hidden />
                  <span className="flex-1">
                    <span className="block font-medium text-text">Página {b + 1}</span>
                    <span className="block text-xs text-muted">{pages[b]?.chapterTitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={panel === 'search'}
        onClose={() => setPanel(null)}
        title="Buscar en el libro"
        size="lg"
        footer={
          highlightTerm ? (
            <button className="btn-secondary" onClick={() => setHighlightTerm('')}>
              Quitar resaltado
            </button>
          ) : undefined
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Escribe una palabra o frase"
            className="field pl-11"
            aria-label="Buscar texto"
          />
        </div>
        <p className="mt-3 text-xs text-muted" aria-live="polite">
          {searchTerm.trim().length < 2 ? 'Escribe al menos 2 caracteres.' : `${searchResults.length} coincidencias`}
        </p>
        <ul className="mt-3 space-y-2">
          {searchResults.map((r, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  setHighlightTerm(searchTerm.trim())
                  jump(r.page)
                }}
                className="w-full rounded-xl border border-line p-3 text-left text-sm transition-colors hover:border-line-active"
              >
                <span className="text-xs font-medium text-secondary">
                  Página {r.page + 1} · {r.chapter}
                </span>
                <span className="mt-1 block text-muted">{highlight(r.snippet, searchTerm.trim())}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={panel === 'settings'} onClose={() => setPanel(null)} title="Configuración de lectura" size="sm">
        <div className="space-y-6">
          <div>
            <p className="label">Tema</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: false, label: 'Claro', icon: Sun },
                { v: true, label: 'Oscuro', icon: Moon },
              ].map(({ v, label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setPref('readerDark', v)}
                  aria-pressed={dark === v}
                  className={cn(
                    'flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors',
                    dark === v ? 'border-primary bg-softer text-accent dark:border-secondary' : 'border-line text-muted hover:border-line-active',
                  )}
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </button>
              ))}
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
                <button
                  key={lh}
                  onClick={() => setPref('readerLineHeight', lh)}
                  aria-pressed={prefs.readerLineHeight === lh}
                  className={cn(
                    'h-11 rounded-xl border text-sm font-medium transition-colors',
                    prefs.readerLineHeight === lh ? 'border-primary bg-softer text-accent dark:border-secondary' : 'border-line text-muted hover:border-line-active',
                  )}
                >
                  {lh === 1.7 ? 'Compacto' : lh === 1.8 ? 'Normal' : 'Amplio'}
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-xl bg-softer p-3 text-xs text-muted">
            Tu posición se guarda automáticamente. Usa las flechas del teclado o desliza para cambiar de página.
          </p>
        </div>
      </Modal>
    </div>
  )
}
