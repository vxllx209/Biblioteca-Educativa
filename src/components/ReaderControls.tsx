import { AArrowDown, AArrowUp, Bookmark, ChevronLeft, ChevronRight, Search, Settings2, Type, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/format'

interface Props {
  page: number
  total: number
  percent: number
  onPrev: () => void
  onNext: () => void
  onSeek: (page: number) => void
  bookmarked: boolean
  onBookmark: () => void
  fontSize: number
  onFontSize: (size: number) => void
  onSettings: () => void
  onSearch: () => void
  speaking: boolean
  onSpeak: () => void
  canNext: boolean
}

export const FONT_MIN = 15
export const FONT_MAX = 24

function Tool({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
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
  const fill = p.total > 1 ? (p.page / (p.total - 1)) * 100 : 100
  return (
    <div className="border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:bg-bg/95">
      <div className="relative mx-auto max-w-[800px] px-4 pt-2 pb-2 sm:px-6">
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

        <div className="flex items-center gap-3">
          <label htmlFor="reader-progress" className="sr-only">
            Ir a la página
          </label>
          <input
            id="reader-progress"
            type="range"
            min={0}
            max={Math.max(0, p.total - 1)}
            value={p.page}
            onChange={(e) => p.onSeek(Number(e.target.value))}
            className="range flex-1"
            style={{ ['--fill' as string]: `${fill}%` }}
            aria-valuetext={`Página ${p.page + 1} de ${p.total}`}
          />
          <span className="w-24 text-right text-xs font-medium text-muted tabular-nums">
            {p.page + 1} / {p.total} · {p.percent}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <button onClick={p.onPrev} disabled={p.page === 0} className="btn-ghost min-h-11 px-3 disabled:opacity-40" aria-label="Página anterior">
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
          <button
            onClick={p.onNext}
            disabled={!p.canNext}
            className="btn-ghost min-h-11 px-3 text-accent disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
