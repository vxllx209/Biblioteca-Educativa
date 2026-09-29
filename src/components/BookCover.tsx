import type { Book } from '../types'
import { cn } from '../lib/format'
import { CATEGORY_ICONS } from './icons'

function Pattern({ type, color }: { type: Book['cover']['pattern']; color: string }) {
  const common = { stroke: color, fill: 'none', strokeWidth: 1.2, opacity: 0.35 }
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {type === 'lines' &&
        Array.from({ length: 14 }, (_, i) => <line key={i} x1={-60 + i * 22} y1={0} x2={40 + i * 22} y2={140} {...common} />)}
      {type === 'dots' &&
        Array.from({ length: 48 }, (_, i) => (
          <circle key={i} cx={20 + (i % 8) * 23} cy={16 + Math.floor(i / 8) * 22} r={1.8} fill={color} opacity={0.4} />
        ))}
      {type === 'arcs' &&
        Array.from({ length: 7 }, (_, i) => <circle key={i} cx={200} cy={0} r={30 + i * 22} {...common} />)}
      {type === 'grid' && (
        <>
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 25} y1={0} x2={i * 25} y2={150} {...common} />)}
          {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 25} x2={200} y2={i * 25} {...common} />)}
        </>
      )}
      {type === 'waves' &&
        Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M0 ${30 + i * 16} q25 -14 50 0 t50 0 t50 0 t50 0`} {...common} />
        ))}
    </svg>
  )
}

/** Generated placeholder cover: no external images, consistent with the palette. */
export function BookCover({ book, className, showText = true }: { book: Book; className?: string; showText?: boolean }) {
  const { bg, fg, accent, pattern } = book.cover
  const Icon = CATEGORY_ICONS[book.category]
  return (
    <div
      className={cn('@container relative aspect-[2/3] w-full overflow-hidden select-none', className)}
      style={{ backgroundColor: bg, color: fg }}
      role="img"
      aria-label={`Portada de ${book.title}`}
    >
      <Pattern type={pattern} color={accent} />
      <div className="absolute inset-y-0 left-0 w-[4%] bg-black/10" aria-hidden />
      {showText && (
        <div className="absolute inset-0 flex flex-col justify-between p-[9cqw] pl-[12cqw]">
          <span
            className="grid size-[18cqw] place-items-center rounded-[4cqw]"
            style={{ backgroundColor: accent, color: bg }}
            aria-hidden
          >
            <Icon className="size-[10cqw]" strokeWidth={2} />
          </span>
          <div>
            <p className="mb-[3cqw] h-[1.5cqw] w-[18cqw] rounded-full" style={{ backgroundColor: accent }} aria-hidden />
            <p className="text-[10.5cqw] leading-[1.12] font-bold tracking-tight [overflow-wrap:anywhere]">{book.title}</p>
            <p className="mt-[3cqw] text-[6.2cqw] leading-tight font-medium opacity-80">{book.author}</p>
          </div>
        </div>
      )}
    </div>
  )
}
