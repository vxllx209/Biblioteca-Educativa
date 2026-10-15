import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import { getBook } from '../data/books'
import { cn } from '../lib/format'
import { BookCover } from './BookCover'
import { locale, t } from '../i18n'

/**
 * A hardcover book you can leaf through. Each paper leaf is a chain of hinged strips, so it bends
 * while it turns; every leaf is a damped spring with momentum, driven by drag, click or keyboard.
 * Physics runs imperatively (refs + requestAnimationFrame) so React never re-renders per frame.
 */

const STRIPS = 10 // hinged strips per paper leaf
const GAP = 1.6 // px between stacked leaves on the z axis

const QUIJOTE = getBook('don-quijote')!

// Opening of chapter one (public domain).
const CHAPTER_ONE =
  'En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda. El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellorí de lo más fino. Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera. Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza. Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben; aunque, por conjeturas verosímiles, se deja entender que se llamaba Quejana. Pero esto importa poco a nuestro cuento; basta que en la narración dél no se salga un punto de la verdad. Es, pues, de saber que este sobredicho hidalgo, los ratos que estaba ocioso, que eran los más del año, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda. Y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer, y así, llevó a su casa todos cuantos pudo haber dellos; y de todos, ningunos le parecían tan bien como los que compuso el famoso Feliciano de Silva, porque la claridad de su prosa y aquellas entricadas razones suyas le parecían de perlas, y más cuando llegaba a leer aquellos requiebros y cartas de desafíos, donde en muchas partes hallaba escrito: La razón de la sinrazón que a mi razón se hace, de tal manera mi razón enflaquece, que con razón me quejo de la vuestra fermosura. Y también cuando leía: los altos cielos que de vuestra divinidad divinamente con las estrellas os fortifican, y os hacen merecedora del merecimiento que merece la vuestra grandeza. Con estas razones perdía el pobre caballero el juicio, y desvelábase por entenderlas y desentrañarles el sentido, que no se lo sacara ni las entendiera el mesmo Aristóteles, si resucitara para sólo ello.'

/** Splits the text into pages of roughly `sizes[i]` characters, always at a word boundary. */
function paginate(text: string, sizes: number[]) {
  const words = text.split(' ')
  return sizes.map((size) => {
    let page = ''
    while (words.length && page.length + words[0].length < size) page += (page ? ' ' : '') + words.shift()
    return page
  })
}

const [P1, P2, P3, P4, P5] = paginate(CHAPTER_ONE, [330, 560, 560, 560, 560])

/* --------------------------------------------------------------- pages */

type Side = 'right' | 'left'

function Paper({ side, folio, children, className }: { side: Side; folio?: number; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('pb-paper lp-serif', side === 'right' ? 'is-right' : 'is-left', className)}>
      {children}
      {folio !== undefined && <span className="pb-folio">{folio}</span>}
    </div>
  )
}

function TextPage({ side, folio, text, chapter }: { side: Side; folio: number; text: string; chapter?: boolean }) {
  return (
    <Paper side={side} folio={folio}>
      <div className="pb-text">
        {chapter && (
          <header className="pb-chapter">
            <span>{t('Capítulo primero')}</span>
            <em>{t('Que trata de la condición y ejercicio del famoso hidalgo')}</em>
            <i aria-hidden>❦</i>
          </header>
        )}
        <p className={cn(chapter && 'pb-dropcap')}>{text}</p>
      </div>
    </Paper>
  )
}

function TitlePage() {
  return (
    <Paper side="right">
      <div className="pb-title">
        <span className="pb-title-author">Miguel de Cervantes</span>
        <span className="pb-rule" />
        <span className="pb-title-main">El ingenioso hidalgo don Quijote de la Mancha</span>
        <i aria-hidden>❦</i>
        <span className="pb-title-imprint">Biblioteca Educativa · {QUIJOTE.year}</span>
      </div>
    </Paper>
  )
}

function HalfTitle() {
  return (
    <Paper side="left">
      <div className="pb-title">
        <span className="pb-title-author">{t('Primera parte')}</span>
        <span className="pb-rule" />
        <span className="pb-epigraph">{t('«La razón de la sinrazón que a mi razón se hace…»')}</span>
      </div>
    </Paper>
  )
}

function ClosingPage() {
  return (
    <Paper side="right" folio={7}>
      <div className="pb-title">
        <i aria-hidden>❦</i>
        <span className="pb-title-main">{t('La historia continúa')}</span>
        <span className="pb-rule" />
        <span className="pb-title-imprint">
          {t('{n} páginas más te esperan en la biblioteca', { n: QUIJOTE.pages.toLocaleString(locale()) })}
        </span>
      </div>
    </Paper>
  )
}

function CoverFront() {
  return (
    <div className="pb-cover-front">
      <BookCover book={QUIJOTE} className="!aspect-auto h-full" />
      <span className="pb-hinge" aria-hidden />
      <span className="pb-gloss" aria-hidden />
    </div>
  )
}

function Endpaper() {
  return (
    <div className="pb-endpaper">
      <div className="pb-exlibris lp-serif">
        <span>Ex libris</span>
        <strong>Biblioteca Educativa</strong>
      </div>
    </div>
  )
}

interface LeafSpec {
  front: ReactNode
  back: ReactNode
  cover?: boolean
}

const LEAVES: LeafSpec[] = [
  { front: <CoverFront />, back: <Endpaper />, cover: true },
  { front: <TitlePage />, back: <HalfTitle /> },
  { front: <TextPage side="right" folio={1} text={P1} chapter />, back: <TextPage side="left" folio={2} text={P2} /> },
  { front: <TextPage side="right" folio={3} text={P3} />, back: <TextPage side="left" folio={4} text={P4} /> },
  { front: <TextPage side="right" folio={5} text={P5} />, back: <TextPage side="left" folio={6} text={t('…y así, del poco dormir y del mucho leer, se le secó el celebro, de manera que vino a perder el juicio.')} /> },
]
const L = LEAVES.length
const leafZ = (i: number) => (L - i) * GAP + 1

/* ------------------------------------------------------------- strips */

interface LeafDom {
  root: HTMLDivElement | null
  strips: HTMLDivElement[]
  shades: HTMLDivElement[][] // [front, back] per strip
}

/** Nested chain of strips: strip k hangs from the right edge of strip k-1 and shows its slice of each face. */
interface Registry {
  strip: (k: number, el: HTMLDivElement | null) => void
  shade: (k: number, face: 0 | 1, el: HTMLDivElement | null) => void
}

/** Positions the full page so strip k shows its slice. Sized from the page width, not the face, so faces can overlap. */
const slice = (k: number, n: number): CSSProperties =>
  n === 1 ? { width: '100%', left: 0 } : { width: 'var(--bw)', left: `calc(var(--bw) * ${-k / n})` }

function Strips({ k, n, spec, reg }: { k: number; n: number; spec: LeafSpec; reg: Registry }) {
  return (
    <div className="pb-strip" style={k === 0 ? { width: `${100 / n}%` } : undefined} ref={(el) => reg.strip(k, el)}>
      <div className={cn('pb-face', k < n - 1 && 'is-seamed')}>
        <div className="pb-content" style={slice(k, n)}>
          {spec.front}
        </div>
        <div className="pb-shade" ref={(el) => reg.shade(k, 0, el)} />
      </div>
      <div className={cn('pb-face is-back', k > 0 && 'is-seamed')}>
        <div className="pb-content" style={slice(n - 1 - k, n)}>
          {spec.back}
        </div>
        <div className="pb-shade" ref={(el) => reg.shade(k, 1, el)} />
      </div>
      {k < n - 1 && <Strips k={k + 1} n={n} spec={spec} reg={reg} />}
    </div>
  )
}

/* ------------------------------------------------------------ physics */

interface Body {
  a: number // angle in degrees: 0 = resting on the right, 180 = resting on the left
  v: number // angular velocity, deg/s
  side: 0 | 180 // where it wants to rest
  peek: boolean
  curl: number // total bend in degrees, distributed along the strips
  held: boolean
  stiffness: number
  rigid: boolean
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const rad = (d: number) => (d * Math.PI) / 180

/** Stacked paper edges drawn under a page block; `lean` skews them toward the fore-edge (+1 right, -1 left). */
function edgeShadow(count: number, lean: 1 | -1) {
  const layers = Array.from({ length: count }, (_, i) => `${lean * (i + 1) * 0.35}px ${i + 1}px 0 ${i % 2 ? '#d6cbb1' : '#ece4d0'}`)
  return [...layers, `${lean * count * 0.35}px ${count + 2}px 4px rgba(0,0,0,0.35)`].join(',')
}

interface Props {
  tiltRef?: RefObject<HTMLDivElement | null>
  reduced?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PhysicsBook({ tiltRef, reduced = false, onOpenChange }: Props) {
  const doms = useRef<LeafDom[]>(LEAVES.map(() => ({ root: null, strips: [], shades: [] })))
  const bodies = useRef<Body[]>(
    LEAVES.map((l) => ({ a: 0, v: 0, side: 0, peek: false, curl: 0, held: false, stiffness: l.cover ? 70 : 120, rigid: !!l.cover })),
  )
  // Stable callbacks that record each leaf's DOM nodes for the animation loop.
  const [registry] = useState(() =>
    LEAVES.map((_, i) => ({
      root: (el: HTMLDivElement | null) => void (doms.current[i].root = el),
      strip: (k: number, el: HTMLDivElement | null) => void (el && (doms.current[i].strips[k] = el)),
      shade: (k: number, face: 0 | 1, el: HTMLDivElement | null) => void (el && ((doms.current[i].shades[k] ??= [])[face] = el)),
    })),
  )
  const shiftRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const leftEdgeRef = useRef<HTMLDivElement>(null)
  const foreRef = useRef<HTMLDivElement>(null)
  const castR = useRef<HTMLDivElement>(null)
  const castL = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const kick = useRef<() => void>(() => undefined)
  const openCb = useRef(onOpenChange)
  useEffect(() => {
    openCb.current = onOpenChange
  })

  useEffect(() => {
    let last = performance.now()
    let wasOpen: boolean | null = null

    const render = () => {
      const bs = bodies.current
      const W = baseRef.current?.offsetWidth ?? 0

      bs.forEach((b, i) => {
        const dom = doms.current[i]
        if (!dom.root) return
        // Lift first, then rotate about the spine: a turned leaf mirrors its depth, so the stack order flips with it.
        dom.root.style.transform = `rotateY(${-b.a}deg) translateZ(${leafZ(i)}px)`
        const n = dom.strips.length
        // Bend grows toward the free edge, like paper held at the spine.
        let phi = b.a
        for (let k = 0; k < n; k++) {
          const d = n === 1 ? 0 : (b.curl * 2 * (k + 1)) / (n * (n + 1))
          phi += d
          dom.strips[k].style.transform = `rotateY(${-d}deg)`
          const s = Math.sin(rad(clamp(phi, 0, 180)))
          const shade = 0.42 * s * s + (phi > 90 ? 0.04 : 0)
          const [front, back] = dom.shades[k] ?? []
          if (front) front.style.opacity = String(shade)
          if (back) back.style.opacity = String(shade * 0.85)
        }
      })

      // Center the closed book; slide to the spread as the cover opens.
      const cover = bs[0].a
      if (shiftRef.current) shiftRef.current.style.transform = `translateX(${(-W / 2) * (1 - cover / 180)}px)`

      // Page block thickness on each side.
      const right = bs.filter((b, i) => i > 0 && b.a < 90).length + 1
      const left = bs.filter((b, i) => i > 0 && b.a >= 90).length
      if (baseRef.current) baseRef.current.style.boxShadow = edgeShadow(right * 2, 1)
      if (leftEdgeRef.current) {
        leftEdgeRef.current.style.boxShadow = left ? edgeShadow(left * 2, -1) : 'none'
        leftEdgeRef.current.style.opacity = cover > 150 ? '1' : '0'
      }
      if (foreRef.current) {
        const top = bs.findIndex((b) => b.a < 90)
        const depth = top < 0 ? 1 : leafZ(top)
        foreRef.current.style.width = `${depth}px`
        foreRef.current.style.transform = `translateZ(${depth}px) rotateY(90deg)`
      }

      // Shadow the turning leaf casts on the page beneath it.
      const moving = bs.findIndex((b) => b.a > 0.5 && b.a < 179.5)
      if (castR.current && castL.current) {
        if (moving < 0) {
          castR.current.style.opacity = '0'
          castL.current.style.opacity = '0'
        } else {
          const a = bs[moving].a
          const c = Math.cos(rad(a))
          const under = moving + 1 < L ? leafZ(moving + 1) + GAP / 2 : 0.5
          castR.current.style.transform = `translateZ(${under}px)`
          castR.current.style.opacity = a < 90 ? String(Math.sin(rad(a)) * 0.9) : '0'
          castR.current.style.background = `linear-gradient(to right, rgba(20,14,6,0.45), rgba(20,14,6,0.12) ${Math.max(4, c * 70)}%, transparent ${Math.max(8, c * 100)}%)`
          const below = moving > 0 ? -leafZ(moving - 1) + GAP / 2 : -L * GAP
          castL.current.style.transform = `translateZ(${below}px)`
          castL.current.style.opacity = a >= 90 ? String(Math.sin(rad(a)) * 0.9) : '0'
          castL.current.style.background = `linear-gradient(to left, rgba(20,14,6,0.45), rgba(20,14,6,0.12) ${Math.max(4, -c * 70)}%, transparent ${Math.max(8, -c * 100)}%)`
        }
      }

      const open = bs[0].side === 180
      if (open !== wasOpen) {
        wasOpen = open
        openCb.current?.(open)
      }
    }

    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      let busy = false
      for (const b of bodies.current) {
        if (b.held) {
          busy = true
          continue
        }
        const peekAngle = b.rigid ? 9 : 16
        const target = b.side === 0 ? (b.peek ? peekAngle : 0) : b.peek ? 180 - peekAngle : 180
        if (reduced) {
          b.a = target
          b.v = 0
          b.curl = 0
          continue
        }
        const k = b.stiffness
        const c = 2 * Math.sqrt(k) * 0.72 // a little under critical damping: lands with a soft settle
        b.v += (k * (target - b.a) - c * b.v) * dt
        b.a += b.v * dt
        // Pages can't pass through the stack: bounce off it, losing most of the energy.
        if (b.a < 0) {
          b.a = 0
          b.v = -b.v * 0.22
        } else if (b.a > 180) {
          b.a = 180
          b.v = -b.v * 0.22
        }
        // Air drag makes the free edge trail behind; peeking lifts the corner ahead of the spine.
        const curlTarget = b.rigid ? 0 : b.peek ? (b.side === 0 ? 20 : -20) : clamp(-b.v * 0.055, -38, 38)
        b.curl += (curlTarget - b.curl) * Math.min(1, dt * 14)
        if (Math.abs(target - b.a) > 0.02 || Math.abs(b.v) > 0.05 || Math.abs(b.curl - curlTarget) > 0.05) busy = true
        else {
          b.a = target
          b.v = 0
        }
      }
      render()
      frame.current = busy ? requestAnimationFrame(step) : 0
    }

    kick.current = () => {
      if (frame.current) return
      last = performance.now()
      frame.current = requestAnimationFrame(step)
    }

    render()
    // Open the cover, then turn to the first chapter, like someone handing you the book.
    const timers = [
      setTimeout(() => {
        bodies.current[0].side = 180
        kick.current()
      }, reduced ? 0 : 1500),
      setTimeout(() => {
        bodies.current[1].side = 180
        kick.current()
      }, reduced ? 0 : 2500),
    ]
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(frame.current)
      frame.current = 0
    }
  }, [reduced])

  /* ------------------------------------------------------- interaction */

  const grab = useRef<{ i: number; id: number; r: number; x0: number; y0: number; t0: number; last: number; lastT: number; moved: boolean; dir: 1 | -1 } | null>(null)

  const geometry = () => {
    const rect = baseRef.current?.getBoundingClientRect()
    return rect ? { spine: rect.left, w: rect.width } : null
  }

  /** Top leaf on the right (next to turn) or on the left (last turned). */
  const topLeaf = (side: Side) => {
    const bs = bodies.current
    if (side === 'right') return bs.findIndex((b) => b.side === 0)
    for (let i = L - 1; i >= 0; i--) if (bs[i].side === 180) return i
    return -1
  }

  const turn = (dir: 1 | -1) => {
    const i = topLeaf(dir === 1 ? 'right' : 'left')
    if (i < 0) return
    const b = bodies.current[i]
    b.side = dir === 1 ? 180 : 0
    b.peek = false
    b.v += dir * 120 // a flick to get it going
    kick.current()
  }

  const clearPeek = () => {
    if (!bodies.current.some((b) => b.peek)) return
    bodies.current.forEach((b) => (b.peek = false))
    kick.current()
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = geometry()
    if (!g || e.button > 0) return
    const dx = e.clientX - g.spine
    const closed = bodies.current[0].side === 0
    const i = closed ? 0 : topLeaf(dx >= 0 ? 'right' : 'left')
    if (i < 0) return
    clearPeek()
    const b = bodies.current[i]
    e.currentTarget.setPointerCapture(e.pointerId)
    grab.current = {
      i,
      id: e.pointerId,
      r: Math.max(0.3, Math.abs(dx) / g.w), // where along the page it was grabbed
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      last: b.a,
      lastT: performance.now(),
      moved: false,
      dir: b.side === 0 ? 1 : -1,
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = geometry()
    if (!g) return
    const h = grab.current
    if (!h) {
      // Hovering near an outer edge lifts that corner a little.
      if (e.pointerType !== 'mouse' || reduced) return
      const dx = e.clientX - g.spine
      const nearRight = dx > g.w * 0.72
      const nearLeft = dx < -g.w * 0.72 && bodies.current[0].side === 180
      const want = nearRight ? topLeaf('right') : nearLeft ? topLeaf('left') : -1
      bodies.current.forEach((b, i) => {
        const p = i === want
        if (b.peek !== p) {
          b.peek = p
          kick.current()
        }
      })
      return
    }
    if (h.id !== e.pointerId) return
    if (!h.moved && Math.hypot(e.clientX - h.x0, e.clientY - h.y0) < 6) return
    h.moved = true
    const b = bodies.current[h.i]
    b.held = true
    // The grabbed point sits at r·W from the spine; its screen x is r·W·cos(angle).
    const a = (Math.acos(clamp((e.clientX - g.spine) / (h.r * g.w), -1, 1)) * 180) / Math.PI
    const now = performance.now()
    const dt = Math.max(0.008, (now - h.lastT) / 1000)
    b.v = b.v * 0.6 + ((a - h.last) / dt) * 0.4
    h.last = a
    h.lastT = now
    b.a = a
    // Holding the edge makes the root lag behind the hand: the page bulges.
    b.curl = b.rigid ? 0 : h.dir * 34 * Math.sin(rad(a)) * (1 - h.r * 0.4)
    kick.current()
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const h = grab.current
    if (!h || h.id !== e.pointerId) return
    grab.current = null
    const b = bodies.current[h.i]
    b.held = false
    if (!h.moved) {
      turn(h.dir)
      return
    }
    // Fling with momentum, or fall to whichever side it's closer to.
    b.side = b.v > 220 ? 180 : b.v < -220 ? 0 : b.a > 90 ? 180 : 0
    kick.current()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      turn(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      turn(-1)
    }
  }

  return (
    <div className="pb-scene">
      <div ref={tiltRef} className="pb-tilt">
        <div ref={shiftRef} className="pb-shift">
          <div
            className="pb-book"
            role="group"
            tabIndex={0}
            aria-roledescription={t('libro')}
            aria-label={t('Don Quijote de la Mancha. Arrastra las páginas o usa las flechas del teclado para hojearlo.')}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={(e) => !grab.current && e.pointerType === 'mouse' && clearPeek()}
            onKeyDown={onKeyDown}
          >
            <div className="pb-board" />
            <div ref={baseRef} className="pb-base">
              <ClosingPage />
            </div>
            <div ref={leftEdgeRef} className="pb-left-edge" />
            <div ref={castR} className="pb-cast" />
            <div ref={castL} className="pb-cast is-left" />
            {LEAVES.map((spec, i) => (
              <div
                key={i}
                ref={(el) => registry[i].root(el)}
                className={cn('pb-leaf', spec.cover && 'is-cover')}
              >
                <Strips k={0} n={spec.cover ? 1 : STRIPS} spec={spec} reg={registry[i]} />
              </div>
            ))}
            <div className="pb-spine" style={{ '--t': `${leafZ(0) + 3}px` } as CSSProperties} />
            <div ref={foreRef} className="pb-fore" />
          </div>
        </div>
      </div>
      <div className="pb-floor" aria-hidden />
    </div>
  )
}
