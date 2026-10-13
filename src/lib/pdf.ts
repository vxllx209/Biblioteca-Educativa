import type { PDFFont, PDFPage } from 'pdf-lib'
import type { Book, BookContent } from '../types'

/**
 * Builds a real, printable PDF of a book in the browser (pdf-lib, loaded on demand).
 * Copies for every plan except Anual carry a watermark on each page with the reader's account.
 */
export interface PdfOptions {
  /** Draw the watermark (every plan except Anual). */
  watermark: boolean
  /** Shown in the watermark footer, e.g. the reader's email. */
  owner: string
  onProgress?: (pct: number) => void
  signal?: AbortSignal
}

// A5, like a paperback: comfortable to read on a phone or to print two per sheet.
const PAGE = { width: 419.53, height: 595.28 }
const MARGIN = { top: 56, bottom: 60, side: 48 }
const BODY = { size: 10.5, leading: 15.5, gap: 6 }
const INK = { text: [0.13, 0.16, 0.15], muted: [0.42, 0.46, 0.44], accent: [0.16, 0.36, 0.29] } as const

/** Characters the embedded font lacks, replaced by readable equivalents. */
const FALLBACKS: Record<string, string> = { '√': 'raíz ', '→': '»', '≈': '~', '≠': '/=', '☞': '»' }
const fallback = (s: string) => s.replace(/[√→≈≠☞]/g, (c) => FALLBACKS[c])

const fontUrl = (name: string) => `${import.meta.env.BASE_URL}fonts/${name}`

async function fetchBytes(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('No se pudo preparar el PDF. Revisa tu conexión.')
  return new Uint8Array(await res.arrayBuffer())
}

/**
 * Text width from cached per-character advances. Measuring whole strings with the font engine
 * runs a full glyph layout each time, which takes minutes on a book the size of Don Quijote.
 */
const advances = new WeakMap<PDFFont, Map<string, number>>()
function measure(font: PDFFont, text: string, size: number) {
  let cache = advances.get(font)
  if (!cache) advances.set(font, (cache = new Map()))
  let w = 0
  for (const ch of text) {
    let a = cache.get(ch)
    if (a === undefined) cache.set(ch, (a = font.widthOfTextAtSize(ch, 1000) / 1000))
    w += a
  }
  return w * size
}

/** Splits text into lines that fit `width`. */
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = []
  const space = measure(font, ' ', size)
  for (const raw of text.split('\n')) {
    let line = ''
    let lineWidth = 0
    for (let word of raw.split(/\s+/).filter(Boolean)) {
      let w = measure(font, word, size)
      // A single word wider than the line (long URLs, numbers) is hard-broken.
      while (w > width && word.length > 1) {
        if (line) lines.push(line)
        let cut = word.length - 1
        while (cut > 1 && measure(font, word.slice(0, cut), size) > width) cut--
        lines.push(word.slice(0, cut))
        word = word.slice(cut)
        w = measure(font, word, size)
        line = ''
        lineWidth = 0
      }
      if (!line) {
        line = word
        lineWidth = w
      } else if (lineWidth + space + w <= width) {
        line += ` ${word}`
        lineWidth += space + w
      } else {
        lines.push(line)
        line = word
        lineWidth = w
      }
    }
    lines.push(line)
  }
  return lines
}

const tick = () => new Promise((r) => setTimeout(r, 0))

export async function buildBookPdf(book: Book, content: BookContent, opts: PdfOptions): Promise<Uint8Array> {
  const [{ PDFDocument, rgb, degrees }, { default: fontkit }] = await Promise.all([
    import('pdf-lib'),
    import('@pdf-lib/fontkit'),
  ])
  const [regularBytes, boldBytes] = await Promise.all([
    fetchBytes(fontUrl('NotoSerif-Regular.ttf'), opts.signal),
    fetchBytes(fontUrl('NotoSerif-Bold.ttf'), opts.signal),
  ])

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const regular = await doc.embedFont(regularBytes, { subset: true })
  const bold = await doc.embedFont(boldBytes, { subset: true })
  const color = (c: readonly number[]) => rgb(c[0], c[1], c[2])

  doc.setTitle(book.title)
  doc.setAuthor(book.author)
  doc.setSubject(`${book.category} · ${book.subject}`)
  doc.setCreator('Biblioteca Educativa')
  doc.setProducer('Biblioteca Educativa')
  doc.setLanguage('es')

  const width = PAGE.width - MARGIN.side * 2
  let page: PDFPage = doc.addPage([PAGE.width, PAGE.height])
  let y = 0

  // ——— Title page
  const center = (text: string, font: PDFFont, size: number, at: number, c: readonly number[] = INK.text) => {
    for (const [i, line] of wrap(fallback(text), font, size, width).entries()) {
      const w = measure(font, line, size)
      page.drawText(line, { x: (PAGE.width - w) / 2, y: at - i * size * 1.3, size, font, color: color(c) })
    }
    return wrap(fallback(text), font, size, width).length * size * 1.3
  }
  y = PAGE.height * 0.68
  y -= center(book.title, bold, 22, y) + 12
  y -= center(book.author, regular, 13, y, INK.muted) + 28
  y -= center(book.edition, regular, 10, y, INK.muted) + 4
  center(`${book.category} · ${book.subject}`, regular, 10, y, INK.muted)
  const origin = book.original
    ? 'Material de estudio original de Biblioteca Educativa.'
    : `Texto de dominio público${book.sourceUrl ? ` · ${book.sourceUrl.includes('wikisource') ? 'Wikisource' : 'Project Gutenberg'}` : ''}.`
  center(origin, regular, 8.5, MARGIN.bottom + 30, INK.muted)
  center(`Descargado el ${new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`, regular, 8.5, MARGIN.bottom + 16, INK.muted)

  // ——— Body
  const newPage = () => {
    page = doc.addPage([PAGE.width, PAGE.height])
    y = PAGE.height - MARGIN.top
  }
  const ensure = (h: number) => y - h < MARGIN.bottom && newPage()
  const drawLines = (lines: string[], font: PDFFont, size: number, leading: number, c: readonly number[], indent = 0) => {
    for (const line of lines) {
      ensure(leading)
      y -= leading
      page.drawText(line, { x: MARGIN.side + indent, y, size, font, color: color(c) })
    }
  }

  const starts: number[] = []
  for (const [i, ch] of content.chapters.entries()) {
    if (opts.signal?.aborted) throw new DOMException('Cancelado', 'AbortError')
    newPage()
    starts.push(doc.getPageCount() - 1)
    y -= 24
    if (ch.part) drawLines(wrap(fallback(ch.part).toUpperCase(), regular, 8.5, width), regular, 8.5, 13, INK.accent)
    drawLines(wrap(fallback(ch.title), bold, 16, width), bold, 16, 21, INK.text)
    if (ch.subtitle) {
      y -= 2
      drawLines(wrap(fallback(ch.subtitle), regular, 10.5, width), regular, 10.5, 15, INK.muted)
    }
    y -= 18
    for (const [kind, raw] of ch.blocks) {
      const text = fallback(raw)
      if (kind === 'h') {
        y -= 8
        ensure(BODY.leading * 3) // keep a heading with the lines that follow it
        drawLines(wrap(text, bold, 11.5, width), bold, 11.5, 16, INK.text)
      } else if (kind === 'v') {
        drawLines(wrap(text, regular, BODY.size, width - 16), regular, BODY.size, BODY.leading, INK.text, 16)
      } else {
        drawLines(wrap(text, regular, BODY.size, width), regular, BODY.size, BODY.leading, INK.text)
      }
      y -= BODY.gap
    }
    opts.onProgress?.(((i + 1) / content.chapters.length) * 90)
    if (i % 4 === 3) await tick() // let the progress bar repaint on long books
  }

  // ——— Table of contents, inserted after the title page once the page numbers are known
  const tocLine = 15
  const perPage = Math.floor((PAGE.height - MARGIN.top - MARGIN.bottom - 40) / tocLine)
  const tocPages = Math.ceil(content.chapters.length / perPage)
  for (let p = 0; p < tocPages; p++) {
    page = doc.insertPage(1 + p, [PAGE.width, PAGE.height])
    y = PAGE.height - MARGIN.top
    if (p === 0) {
      y -= 18
      page.drawText('Índice', { x: MARGIN.side, y, size: 16, font: bold, color: color(INK.text) })
      y -= 16
    }
    for (const [j, ch] of content.chapters.slice(p * perPage, (p + 1) * perPage).entries()) {
      const n = String(starts[p * perPage + j] + tocPages + 1)
      const nWidth = measure(regular, n, 9.5)
      let title = fallback(ch.title)
      while (title.length > 4 && measure(regular, title, 9.5) > width - nWidth - 16) title = `${title.slice(0, -2)}…`
      y -= tocLine
      page.drawText(title, { x: MARGIN.side, y, size: 9.5, font: regular, color: color(INK.text) })
      page.drawText(n, { x: PAGE.width - MARGIN.side - nWidth, y, size: 9.5, font: regular, color: color(INK.muted) })
    }
  }

  // ——— Footers and watermark on every page
  const pages = doc.getPages()
  const mark = 'BIBLIOTECA EDUCATIVA'
  const markSize = 30
  const markWidth = measure(bold, mark, markSize)
  const angle = Math.atan2(PAGE.height, PAGE.width)
  for (const [i, pg] of pages.entries()) {
    if (i > 0) {
      const n = String(i + 1)
      pg.drawText(n, { x: PAGE.width - MARGIN.side - measure(regular, n, 8.5), y: 30, size: 8.5, font: regular, color: color(INK.muted) })
      let running = fallback(book.title)
      while (running.length > 4 && measure(regular, running, 8.5) > width * 0.6) running = `${running.slice(0, -2)}…`
      pg.drawText(running, { x: MARGIN.side, y: 30, size: 8.5, font: regular, color: color(INK.muted) })
    }
    if (opts.watermark) {
      // Diagonal mark centred on the page: the text rotates around its origin, so offset it by half its size.
      const [hw, hh] = [markWidth / 2, markSize / 3]
      const cx = PAGE.width / 2 - (Math.cos(angle) * hw - Math.sin(angle) * hh)
      const cy = PAGE.height / 2 - (Math.sin(angle) * hw + Math.cos(angle) * hh)
      pg.drawText(mark, { x: cx, y: cy, size: markSize, font: bold, color: color(INK.accent), opacity: 0.09, rotate: degrees((angle * 180) / Math.PI) })
      const note = `Copia personal de ${opts.owner} · Sin marca de agua con el plan Anual`
      const noteSize = 6.5
      pg.drawText(note, { x: (PAGE.width - measure(regular, note, noteSize)) / 2, y: 16, size: noteSize, font: regular, color: color(INK.accent), opacity: 0.8 })
    }
  }
  opts.onProgress?.(97)
  const bytes = await doc.save()
  opts.onProgress?.(100)
  return bytes
}

/** Hands the file to the browser as a real download. */
export function saveFile(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export const pdfFileName = (book: Book) =>
  `${book.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()}.pdf`
