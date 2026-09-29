import { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn, normalize } from '../../lib/format'
import type { ChapterContent } from '../../types'

export interface Typography {
  fontSize: number
  lineHeight: number
  font: 'sans' | 'serif'
}

export interface PageMetrics {
  pages: number
  /** Page on which each block starts. */
  blockPages: number[]
}

interface Props {
  chapter: ChapterContent
  page: number | 'last'
  width: number
  height: number
  gap: number
  type: Typography
  highlight?: string
  activeBlock?: number
  onMeasure?: (m: PageMetrics) => void
}

/** Highlights case/accent-insensitive matches of `term` in `text`. */
export function highlightText(text: string, term: string | undefined): ReactNode {
  if (!term) return text
  const hay = normalize(text)
  const needle = normalize(term)
  if (!needle) return text
  const parts: ReactNode[] = []
  let from = 0
  let idx = hay.indexOf(needle)
  while (idx !== -1) {
    parts.push(text.slice(from, idx))
    parts.push(
      <mark key={idx} className="rounded bg-soft px-0.5 text-inherit ring-1 ring-line-active">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    )
    from = idx + needle.length
    idx = hay.indexOf(needle, from)
  }
  parts.push(text.slice(from))
  return parts
}

/**
 * Lays a chapter out in CSS columns: each column is exactly one page, and the visible page is
 * chosen with a horizontal translation. Pagination therefore follows the real font, size and screen.
 */
export const PageView = memo(function PageView({ chapter, page, width, height, gap, type, highlight, activeBlock, onMeasure }: Props) {
  const inner = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState(1)
  const onMeasureRef = useRef(onMeasure)
  useLayoutEffect(() => {
    onMeasureRef.current = onMeasure
  })

  useLayoutEffect(() => {
    const el = inner.current
    if (!el || width <= 0 || height <= 0) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const step = width + gap
      const count = Math.max(1, Math.round((el.scrollWidth + gap) / step))
      const origin = el.getBoundingClientRect().left
      const blockPages = Array.from(el.querySelectorAll<HTMLElement>('[data-b]'), (n) =>
        Math.min(count - 1, Math.max(0, Math.floor((n.getBoundingClientRect().left - origin + 4) / step))),
      )
      setPages(count)
      onMeasureRef.current?.({ pages: count, blockPages })
    }
    measure()
    document.fonts?.ready.then(measure)
    return () => {
      cancelled = true
    }
  }, [chapter, width, height, gap, type.fontSize, type.lineHeight, type.font])

  const current = page === 'last' ? pages - 1 : Math.min(page, pages - 1)
  const [label, ...rest] = chapter.title.split(/\.\s+/)
  const heading = rest.length && /^(cap[ií]tulo|tratado|libro|[IVXLC]+)\b/i.test(label) ? rest.join('. ') : ''

  return (
    <div className="overflow-hidden" style={{ width, height }}>
      <div
        ref={inner}
        className={cn('reader-text text-text', type.font === 'serif' && 'reader-font-serif', width < 440 && 'reader-ragged')}
        lang="es"
        style={{
          width,
          height,
          columnWidth: width,
          columnGap: gap,
          columnFill: 'auto',
          fontSize: type.fontSize,
          lineHeight: type.lineHeight,
          transform: `translateX(${-current * (width + gap)}px)`,
        }}
      >
        <header className="mb-[1.6em] pt-[0.4em] text-left" style={{ breakInside: 'avoid', lineHeight: 1.3 }}>
          {chapter.part && <p className="mb-2 font-sans text-[0.7em] font-semibold tracking-[0.14em] text-secondary uppercase">{chapter.part}</p>}
          {heading && <p className="font-sans text-[0.72em] font-semibold tracking-[0.12em] text-muted uppercase">{label}</p>}
          <h2 className="mt-1 text-[1.45em] font-bold text-text">{heading || chapter.title}</h2>
          {chapter.subtitle && <p className="mt-2 text-[0.85em] text-muted italic">{chapter.subtitle}</p>}
          <span className="mt-4 block h-0.5 w-10 rounded-full bg-line-active" aria-hidden />
        </header>
        {chapter.blocks.map(([kind, text], i) => {
          const active = activeBlock === i
          const body = highlightText(text, highlight)
          const cls = cn(active && 'rounded-md bg-soft/70 ring-4 ring-soft/70')
          if (kind === 'h')
            return (
              <h3 key={i} data-b={i} className={cn('rb-h mt-[1.2em] mb-[0.5em] font-sans text-[0.9em] font-semibold text-text', cls)}>
                {body}
              </h3>
            )
          if (kind === 'v')
            return (
              <p key={i} data-b={i} className={cn('rb-v my-[0.8em] pl-[1.2em] italic', cls)} style={{ textIndent: 0 }}>
                {body}
              </p>
            )
          return (
            <p key={i} data-b={i} className={cn('mb-[0.35em]', cls)}>
              {body}
            </p>
          )
        })}
      </div>
    </div>
  )
})
