import { Circle, Eraser, Minus, Pencil, RotateCcw, Trash2, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { cn } from '../../lib/format'

type Tool = 'pen' | 'line' | 'circle' | 'eraser'
type Point = [number, number]
interface Stroke {
  tool: Tool
  color: string
  points: Point[]
}

/** Board height as a fraction of its width, so drawings keep their shape on any screen. */
const RATIO = 0.62
const COLORS = ['#202925', '#285B4A', '#C18A45', '#B85C5C']
const TOOLS: { id: Tool; label: string; icon: LucideIcon }[] = [
  { id: 'pen', label: 'Lápiz', icon: Pencil },
  { id: 'line', label: 'Recta', icon: Minus },
  { id: 'circle', label: 'Compás (círculo)', icon: Circle },
  { id: 'eraser', label: 'Borrador', icon: Eraser },
]

const parse = (value?: string): Stroke[] => {
  try {
    return value ? (JSON.parse(value) as Stroke[]) : []
  } catch {
    return []
  }
}

/**
 * Drawing board for constructions and diagrams. Strokes are stored as vectors with coordinates
 * relative to the board width, so the drawing is resolution-independent and small to save.
 */
export function Whiteboard({ value, onChange, label }: { value?: string; onChange: (value: string) => void; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>(() => parse(value))
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState(COLORS[1])
  const [width, setWidth] = useState(0)
  const drawing = useRef<Stroke | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const paint = useCallback(
    (extra?: Stroke | null) => {
      const canvas = canvasRef.current
      if (!canvas || !width) return
      const dpr = window.devicePixelRatio || 1
      const h = width * RATIO
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(h * dpr)
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, h)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const s of extra ? [...strokes, extra] : strokes) {
        const pts = s.points.map(([x, y]) => [x * width, y * width] as Point)
        if (!pts.length) continue
        ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over'
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.tool === 'eraser' ? 18 : 2.5
        ctx.beginPath()
        if (s.tool === 'circle' && pts.length > 1) {
          const [c, e] = [pts[0], pts[pts.length - 1]]
          ctx.arc(c[0], c[1], Math.hypot(e[0] - c[0], e[1] - c[1]), 0, Math.PI * 2)
          ctx.stroke()
          ctx.beginPath()
          ctx.fillStyle = s.color
          ctx.arc(c[0], c[1], 2.5, 0, Math.PI * 2)
          ctx.fill()
          continue
        }
        if (s.tool === 'line' && pts.length > 1) {
          ctx.moveTo(pts[0][0], pts[0][1])
          ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
        } else {
          ctx.moveTo(pts[0][0], pts[0][1])
          pts.forEach(([x, y]) => ctx.lineTo(x, y))
          if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.1, pts[0][1])
        }
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
    },
    [strokes, width],
  )

  useEffect(() => {
    paint()
  }, [paint])

  const commit = (next: Stroke[]) => {
    setStrokes(next)
    onChange(JSON.stringify(next))
  }

  const toPoint = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.width]
  }

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = { tool, color, points: [toPoint(e)] }
    paint(drawing.current)
  }
  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    const s = drawing.current
    if (!s) return
    const p = toPoint(e)
    if (s.tool === 'pen' || s.tool === 'eraser') s.points.push(p)
    else s.points = [s.points[0], p]
    paint(s)
  }
  const up = () => {
    const s = drawing.current
    drawing.current = null
    if (s) commit([...strokes, s])
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-bg2/60 p-1.5" role="toolbar" aria-label="Herramientas de la pizarra">
        {TOOLS.map(({ id, label: l, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTool(id)}
            aria-pressed={tool === id}
            title={l}
            aria-label={l}
            className={cn('grid size-10 place-items-center rounded-lg transition-colors', tool === id ? 'bg-soft text-accent' : 'text-muted hover:bg-surface hover:text-text')}
          >
            <Icon className="size-[18px]" />
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-line" aria-hidden />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
            aria-pressed={color === c}
            className="grid size-10 place-items-center rounded-lg"
          >
            <span className={cn('size-5 rounded-full ring-offset-2 ring-offset-surface', color === c && 'ring-2 ring-line-active')} style={{ backgroundColor: c }} />
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" onClick={() => commit(strokes.slice(0, -1))} disabled={!strokes.length} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface hover:text-text disabled:opacity-40" aria-label="Deshacer" title="Deshacer">
          <RotateCcw className="size-[18px]" />
        </button>
        <button type="button" onClick={() => commit([])} disabled={!strokes.length} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface hover:text-error disabled:opacity-40" aria-label="Borrar pizarra" title="Borrar todo">
          <Trash2 className="size-[18px]" />
        </button>
      </div>
      <div
        ref={wrapRef}
        className="relative w-full bg-white [background-image:linear-gradient(#DDE4E0_1px,transparent_1px),linear-gradient(90deg,#DDE4E0_1px,transparent_1px)] [background-size:24px_24px]"
        style={{ height: width * RATIO || 240 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          role="img"
          aria-label={`${label}. ${strokes.length ? `${strokes.length} trazos dibujados` : 'Pizarra vacía'}`}
        />
      </div>
      <p className="px-3 py-2 text-xs text-muted">
        {tool === 'circle' ? 'Compás: pulsa en el centro y arrastra hasta el radio.' : tool === 'line' ? 'Recta: arrastra de un punto a otro.' : 'Dibuja con el dedo, el lápiz o el ratón.'}
      </p>
    </div>
  )
}
