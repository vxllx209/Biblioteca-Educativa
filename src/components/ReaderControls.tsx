import { AArrowDown, AArrowUp, Bookmark, ChevronLeft, ChevronRight, Search, Settings2, Type, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../lib/format'

interface Props {
  /** Whole-book progress 0..100 */
  percent: number
  pageLabel: string
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  /** Jump to a whole-book position 0..1 */
  onScrub: (fraction: number) => void
  scrubLabel: (fraction: number) => string
  bookmarked: boolean
  onBookmark: () => void
  fontSize: number
  onFontSize: (size: number) => void
  onSettings: () => void
  onSearch: () => void
  speaking: boolean
  onSpeak: () => void
}

export const FONT_MIN = 15
export const FONT_MAX = 26

function Tool({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'grid size-11 place-items-center rounded-xl transition-colors duration-200',
        active ? 'bg-soft text-accent' : 'text-muted hover:bg-bg2 hover:text-text',
      )}
    >
      {children}
    </button>
  )
}

export function ReaderControls(p: Props) {
  const [fontOpen, setFontOpen] = useState(false)
  const [scrub, setScrub] = useState<number | null>(null)
  const value = scrub ?? p.percent * 10

  // Commit slider moves shortly after the user stops dragging.
  useEffect(() => {
    if (scrub === null) return
    const t = setTimeout(() => p.onScrub(scrub / 1000), 180)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrub])
  useEffect(() => {
    setScrub(null)
  }, [p.percent])

  return (
    <div className="border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:bg-bg/95">
      <div className="relative mx-auto max-w-[800px] px-3 pt-2 pb-1.5 sm:px-6">
        {fontOpen && (
          <div className="absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 animate-rise items-center gap-2 rounded-[14px] border border-line bg-surface p-2 shadow-pop">
            <button
              onClick={() => p.onFontSize(Math.max(FONT_MIN, p.fontSize - 1))}
              disabled={p.fontSize <= FONT_MIN}
              className="grid size-11 place-items-center rounded-xl text-text hover:bg-bg2 disabled:opacity-40"
              aria-label="Reducir tamaño de letra"
            >
              <AArrowDown className="size-5" />
            </button>
            <span className="w-14 text-center text-sm font-semibold text-text tabular-nums" aria-live="polite">
              {p.fontSize}px
            </span>
            <button
              onClick={() => p.onFontSize(Math.min(FONT_MAX, p.fontSize + 1))}
              disabled={p.fontSize >= FONT_MAX}
              className="grid size-11 place-items-center rounded-xl text-text hover:bg-bg2 disabled:opacity-40"
              aria-label="Aumentar tamaño de letra"
            >
              <AArrowUp className="size-5" />
            </button>
          </div>
        )}

        <div className="relative flex items-center gap-3">
          {scrub !== null && (
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 max-w-[80%] -translate-x-1/2 truncate rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white shadow-pop">
              {p.scrubLabel(scrub / 1000)}
            </span>
          )}
          <label htmlFor="reader-progress" className="sr-only">
            Posición en el libro
          </label>
          <input
            id="reader-progress"
            type="range"
            min={0}
            max={1000}
            value={value}
            onChange={(e) => setScrub(Number(e.target.value))}
            className="range flex-1"
            style={{ ['--fill' as string]: `${value / 10}%` }}
            aria-valuetext={`${Math.round(value / 10)}% del libro`}
          />
          <span className="w-12 text-right text-xs font-semibold text-accent tabular-nums">{Math.round(p.percent)}%</span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <button onClick={p.onPrev} disabled={!p.canPrev} className="btn-ghost min-h-11 px-2.5 disabled:opacity-40 sm:px-3" aria-label="Página anterior">
            <ChevronLeft className="size-5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Tool label={p.bookmarked ? 'Quitar marcador' : 'Agregar marcador'} onClick={p.onBookmark} active={p.bookmarked}>
              <Bookmark className={cn('size-5', p.bookmarked && 'fill-current')} />
            </Tool>
            <Tool label="Tamaño de letra" onClick={() => setFontOpen((o) => !o)} active={fontOpen}>
              <Type className="size-5" />
            </Tool>
            <Tool label="Buscar en el libro" onClick={p.onSearch}>
              <Search className="size-5" />
            </Tool>
            <Tool label={p.speaking ? 'Detener lectura en voz alta' : 'Leer en voz alta'} onClick={p.onSpeak} active={p.speaking}>
              {p.speaking ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </Tool>
            <Tool label="Configuración de lectura" onClick={p.onSettings}>
              <Settings2 className="size-5" />
            </Tool>
          </div>
          <button onClick={p.onNext} disabled={!p.canNext} className="btn-ghost min-h-11 px-2.5 text-accent disabled:opacity-40 sm:px-3" aria-label="Página siguiente">
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-5" />
          </button>
        </div>
        <p className="-mt-1 pb-1 text-center text-[11px] text-muted tabular-nums" aria-live="polite">
          {p.pageLabel}
        </p>
      </div>
    </div>
  )
}
