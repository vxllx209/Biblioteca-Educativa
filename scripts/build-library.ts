/**
 * Builds the real reading material used by the app.
 *
 *   bun scripts/build-library.ts
 *
 * - Downloads public-domain texts (Project Gutenberg / Wikisource), strips the
 *   boilerplate and splits them into chapters  → public/books/<id>.json
 * - Reads LibriVox track lists from archive.org  → src/data/library.generated.ts
 *
 * Downloads are cached in scripts/.cache so re-running is fast and offline-friendly.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseHTML } from 'linkedom'
import { SOURCES, type Source } from './sources'

const ROOT = join(import.meta.dir, '..')
const CACHE = join(import.meta.dir, '.cache')
const OUT_BOOKS = join(ROOT, 'public', 'books')
const OUT_META = join(ROOT, 'src', 'data', 'library.generated.ts')
mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT_BOOKS, { recursive: true })

type Block = ['p' | 'h' | 'v', string]
interface Chapter {
  title: string
  subtitle?: string
  part?: string
  blocks: Block[]
}

const MAX_CHAPTER_CHARS = 36_000

const DEFAULT_DROP =
  /^(índice|indice|índice general|tabla de materias|contents|nota del transcriptor|notas del transcriptor|nota de transcripción|erratas|fe de erratas|colofón|obras del mismo autor|obras de|nota$)/i

async function cached(name: string, url: string): Promise<string> {
  const file = join(CACHE, name)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(url, { headers: { 'User-Agent': 'BibliotecaEducativa/1.0 (educational build script)' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const text = await res.text()
  writeFileSync(file, text)
  return text
}

const clean = (s: string) =>
  s
    .replace(/\r/g, '')
    .replace(/#([^#\n]{1,160})#/g, '$1') // Gutenberg bold markers
    .replace(/(^|[\s(«“])_([^_\n]{1,160})_(?=[\s.,;:!?)»”]|$)/gm, '$1$2') // Gutenberg italics markers
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .filter((l) => l && !/^(End of (the )?Project Gutenberg|Página:.*\.(pdf|djvu)\/\d+)/i.test(l))
    .join('\n')
    // Old typographic drop caps: "PUnto" → "Punto"
    .replace(/^([A-ZÁÉÍÓÚÑ])([A-ZÁÉÍÓÚÑ])(?=[a-záéíóúñ])/, (_m, a: string, b: string) => a + b.toLowerCase())

/** Text of an element, keeping <br> and block children as line breaks. */
function textOf(el: Element, verse = false): string {
  let out = ''
  const walk = (node: Node) => {
    if (node.nodeType === 3) out += verse ? (node as Text).data : (node as Text).data.replace(/\n/g, ' ')
    else if (node.nodeType === 1) {
      const e = node as Element
      const tag = e.tagName.toLowerCase()
      if (tag === 'br') return void (out += '\n')
      const block = tag === 'div' || tag === 'p' || /\b(i\d+|line|verse)\b/.test(e.getAttribute('class') ?? '')
      if (block && out && !out.endsWith('\n')) out += '\n'
      e.childNodes.forEach(walk)
      if (block) out += '\n'
    }
  }
  el.childNodes.forEach(walk)
  return clean(out)
}

function extract(html: string, src: Source, sourceTag?: string): Chapter[] {
  const { document } = parseHTML(html)
  document
    .querySelectorAll(
      '#pg-header, #pg-footer, .pg-boilerplate, section.pg-boilerplate, table, img, .pagenum, .pageno, .page-num, .mw-editsection, sup.reference, .reference, .ws-noexport, #headertemplate, .encabezado, .ws-header, .noprint, style, script, link, a[title^="Página:"]',
    )
    .forEach((n) => n.remove())

  const chapterTag = sourceTag ?? src.chapter.tag
  const chapterRe = src.chapter.regex ? new RegExp(src.chapter.regex) : null
  const drop = src.dropSections ? new RegExp(src.dropSections, 'i') : DEFAULT_DROP
  const level = (tag: string) => Number(tag.slice(1))

  const chapters: Chapter[] = []
  let current: Chapter | null = null
  let dropping = false
  let pendingPart: string | undefined
  let pendingNumber = ''

  const nodes = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, pre, div.stanza, div.poem, blockquote.poem, div.ws-div')
  for (const el of nodes) {
    // Skip elements nested in a verse container we already take as a whole.
    if (el.parentElement?.closest('div.stanza, div.poem, blockquote.poem, pre')) continue
    const tag = el.tagName.toLowerCase()
    // List items: keep content lists; skip tables of contents and paragraphs nested in items.
    if (tag === 'li' && (el.querySelector('a[href^="#"], p') || el.parentElement?.closest('li'))) continue
    if (tag === 'p' && el.parentElement?.closest('li')) continue
    if (tag === 'div' || tag === 'blockquote') {
      if (el.querySelector('div.stanza')) continue // take the stanzas individually
    }
    const wsDiv = tag === 'div' && el.classList.contains('ws-div')
    if (wsDiv && el.querySelector('p, div.ws-div')) continue
    let text = textOf(el, src.verse)
    if (!text) continue
    // Wikisource prints definition/proposition numbers ("VII.") in their own block.
    if (wsDiv && /^[IVXLC]+\.$/.test(text)) {
      pendingNumber = `${text} `
      continue
    }
    if (pendingNumber && !/^h\d$/.test(tag)) {
      text = pendingNumber + text
      pendingNumber = ''
    }
    if (wsDiv) {
      if (!current) continue
      const big = /font-size/.test(el.getAttribute('style') ?? '')
      current.blocks.push([big ? 'h' : 'p', text.replace(/\n+/g, ' ')])
      continue
    }

    const isHeading = /^h\d$/.test(tag)
    const startsChapter =
      (chapterTag && tag === chapterTag) || (!!chapterRe && tag === 'p' && text.length < 90 && chapterRe.test(text))

    if (startsChapter) {
      const title = text.replace(/\n+/g, ' · ')
      dropping = drop.test(title)
      if (dropping) continue
      current = { title, part: pendingPart, blocks: [] }
      pendingPart = undefined
      chapters.push(current)
      continue
    }
    if (isHeading && chapterTag && level(tag) < level(chapterTag)) {
      // A higher-level heading (e.g. "Primera parte") labels the following chapters.
      dropping = drop.test(text)
      if (!dropping) pendingPart = text.replace(/\n+/g, ' · ')
      continue
    }
    if (dropping || !current) continue
    if (isHeading) current.blocks.push(['h', text.replace(/\n+/g, ' · ')])
    else if (tag === 'pre' || tag === 'div' || tag === 'blockquote' || text.includes('\n')) {
      // Drop stanza numbers printed on their own line (e.g. Martín Fierro).
      const verse = text
        .split('\n')
        .filter((l) => !/^\d{1,4}$/.test(l))
        .join('\n')
      if (verse) current.blocks.push([verse.includes('\n') ? 'v' : 'p', verse])
    } else if (tag === 'li' && el.parentElement?.tagName === 'OL') {
      const list = el.parentElement
      const n = [...list.children].indexOf(el) + Number(list.getAttribute('start') ?? 1)
      current.blocks.push(['p', `${n}. ${text}`])
    } else current.blocks.push(['p', text])
  }
  // Drop chapters without real content.
  return chapters.filter((c) => c.blocks.reduce((n, [, x]) => n + x.length, 0) > 120)
}

async function wikisource(page: string): Promise<string> {
  const url = `https://es.wikisource.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&page=${encodeURIComponent(page)}`
  const json = JSON.parse(await cached(`ws-${page.replace(/[^\w]+/g, '_')}.json`, url))
  return `<html><body>${json.parse.text}</body></html>`
}

interface Track {
  title: string
  file: string
  seconds: number
}

const decode = (s: string) =>
  parseHTML(`<p>${s.replace(/\\$/, '')}</p>`).document.querySelector('p')!.textContent!.trim()

const toSeconds = (v: string | number | undefined) => {
  const s = String(v ?? '0')
  if (!s.includes(':')) return Math.round(Number(s) || 0)
  return s.split(':').reduce((acc, x) => acc * 60 + Number(x), 0)
}

async function librivox(id: string): Promise<{ archiveId: string; mirrors: string[]; tracks: Track[] }> {
  const meta = JSON.parse(await cached(`ia-${id}.json`, `https://archive.org/metadata/${id}`))
  const tracks: Track[] = (meta.files as { name: string; title?: string; length?: string }[])
    .filter((f) => f.name.endsWith('_64kb.mp3'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }))
    .map((f) => ({
      title: decode(f.title ?? f.name).replace(/^\d+\s*-\s*/, ''),
      file: f.name,
      seconds: toSeconds(f.length),
    }))
  // Direct storage locations, used as fallbacks when archive.org's redirector picks a failing mirror.
  const mirrors = [meta.d1, meta.d2].filter(Boolean).map((host: string) => `https://${host}${meta.dir}`)
  return { archiveId: id, mirrors, tracks }
}

const isAllCaps = (s: string) => /[A-ZÁÉÍÓÚÑ]{3}/.test(s) && s === s.toUpperCase()
const ROMAN = /^(?=[IVXLCDM]+$)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/

const strip = (w: string) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
let ACCENTS = new Map<string, string>()

/** Sentence-case an ALL-CAPS heading, restoring proper nouns the book body writes capitalised. */
function caseTitle(s: string, proper: Set<string>) {
  if (!isAllCaps(s)) return s
  let first = true
  return s.replace(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/g, (w: string, at: number) => {
    const initial = w.length === 1 && s[at + 1] === '.'
    const lower = ACCENTS.get(w.toLowerCase()) ?? w.toLowerCase()
    let out = lower
    if (ROMAN.test(w) && (w.length > 1 || /(cap[ií]tulo|libro|tratado|parte)\s+$/i.test(s.slice(0, at)))) out = w
    else if (first || proper.has(lower) || initial) out = lower.charAt(0).toUpperCase() + lower.slice(1)
    first = false
    return out
  })
}

/** Words the body text mostly writes capitalised mid-sentence (names, places). */
function properNouns(chapters: Chapter[]) {
  // Also learn accented spellings, since ALL-CAPS headings in old editions often drop accents.
  const forms = new Map<string, Map<string, number>>()
  for (const c of chapters)
    for (const [, x] of c.blocks)
      for (const [w] of x.toLowerCase().matchAll(/[a-záéíóúñü]{3,}/g)) {
        const f = forms.get(strip(w)) ?? new Map<string, number>()
        f.set(w, (f.get(w) ?? 0) + 1)
        forms.set(strip(w), f)
      }
  ACCENTS = new Map(
    [...forms]
      .map(([bare, f]) => [bare, [...f].sort((a, b) => b[1] - a[1])[0]] as const)
      .filter(([bare, [best, n]]) => best !== bare && n >= 2)
      .map(([bare, [best]]) => [bare, best]),
  )
  const counts = new Map<string, { up: number; low: number }>()
  for (const c of chapters)
    for (const [, x] of c.blocks)
      for (const m of x.matchAll(/(?<=[a-záéíóúñ,;] )([A-Za-zÁÉÍÓÚÑáéíóúñü]{3,})/g)) {
        const w = m[1]
        const key = w.toLowerCase()
        const e = counts.get(key) ?? { up: 0, low: 0 }
        if (w[0] === w[0].toUpperCase()) e.up++
        else e.low++
        counts.set(key, e)
      }
  return new Set([...counts].filter(([, e]) => e.up >= 2 && e.up > e.low * 2).map(([k]) => ACCENTS.get(k) ?? k))
}

function polish(chapters: Chapter[]): Chapter[] {
  const proper = properNouns(chapters)
  const tidy = (t: string) =>
    caseTitle(
      t
        .replace(/^-([IVXLC]+)-\s*(·\s*)?/, '$1. ') // "-I- · Perdido" → "I. Perdido"
        .replace(/^([IVXL]+) - /, '$1. ') // "I - Cantor y Gaucho" → "I. Cantor y Gaucho"
        .replace(/\[\d+\]/g, '') // footnote markers
        .replace(/[.:,]+$/, '')
        .trim(),
      proper,
    )
  // Footnote markers are noise when the notes themselves are not part of the book.
  if (!chapters.some((c) => /^notas?\b/i.test(c.title)))
    chapters.forEach((c) => (c.blocks = c.blocks.map(([t, x]) => [t, x.replace(/\[\d+\]/g, '')] as Block)))
  // "= [Resumen]" style markers are section headings.
  chapters.forEach(
    (c) => (c.blocks = c.blocks.map(([t, x]) => (/^= \[(.+)\]$/.test(x) ? ['h', x.replace(/^= \[(.+)\]$/, '$1')] : [t, x]) as Block)),
  )
  // Some files repeat the next chapter's title as the last line of the previous one.
  const same = (a: string, b: string) => strip(a).toLowerCase().replace(/\W+/g, '') === strip(b).toLowerCase().replace(/\W+/g, '')
  chapters.forEach((c, i) => {
    const last = c.blocks[c.blocks.length - 1]
    const nextTitle = chapters[i + 1]?.title
    if (last && nextTitle && same(last[1], nextTitle)) c.blocks.pop()
  })
  // A part label that only decorates the first chapter is just the book's title page.
  const labelled = chapters.filter((c) => c.part)
  if (labelled.length === 1 && labelled[0] === chapters[0]) delete chapters[0].part

  const out: Chapter[] = []
  for (const c of chapters) {
    const ch: Chapter = { ...c, title: tidy(c.title) }
    if (c.part) ch.part = tidy(c.part)
    else delete ch.part
    // A short first line right after a short title is the chapter's summary line.
    const [first] = ch.blocks
    const isSummary =
      !!first &&
      ch.blocks.length > 1 &&
      first[1].length <= 220 &&
      ((first[0] === 'h' && !/^resumen$/i.test(first[1])) ||
        (first[0] === 'p' && /^(cap[ií]tulo|tratado)\b/i.test(ch.title) && !/^[—«“"¡¿-]/.test(first[1])))
    if (isSummary) {
      ch.subtitle = tidy(first[1])
      ch.blocks = ch.blocks.slice(1)
    }
    // Very long chapters are split so each page layout stays light.
    const total = ch.blocks.reduce((n, [, x]) => n + x.length, 0)
    const pieces = Math.ceil(total / MAX_CHAPTER_CHARS)
    if (pieces <= 1) {
      out.push(ch)
      continue
    }
    const target = total / pieces
    let acc = 0
    let n = 1
    let bucket: Block[] = []
    const flush = () => {
      const piece: Chapter = { title: `${ch.title} (${n}/${pieces})`, blocks: bucket }
      if (n === 1 && ch.part) piece.part = ch.part
      if (n === 1 && ch.subtitle) piece.subtitle = ch.subtitle
      out.push(piece)
      bucket = []
      acc = 0
      n++
    }
    for (const b of ch.blocks) {
      bucket.push(b)
      acc += b[1].length
      if (acc >= target && n < pieces) flush()
    }
    if (bucket.length) flush()
  }
  return out
}

const meta: Record<string, unknown> = {}
for (const src of SOURCES) {
  let chapters: Chapter[] = []
  let sourceUrl = ''
  if (src.gutenberg) {
    for (const g of src.gutenberg) {
      const html = await cached(`pg-${g}.html`, `https://www.gutenberg.org/cache/epub/${g}/pg${g}-images.html`)
      chapters.push(...extract(html, src))
    }
    sourceUrl = `https://www.gutenberg.org/ebooks/${src.gutenberg[0]}`
  } else if (src.wikisource) {
    for (const page of src.wikisource.pages) {
      const html = await wikisource(page)
      const blocks = extract(`<html><body><h1>x</h1>${html}</body></html>`, src, 'h1')[0]?.blocks ?? []
      // Drop the repeated title lines of the printed page ("Elementos", "De Euclides", "Libro primero").
      while (blocks.length && /^(elementos|de euclides|libro \p{L}+|pr[oó]logo[\p{L} ]*)\.?$/iu.test(blocks[0][1])) blocks.shift()
      chapters.push({ title: page.split('/').pop()!, blocks })
    }
    sourceUrl = `https://es.wikisource.org/wiki/${encodeURIComponent(src.wikisource.pages[0].split('/')[0])}`
  }
  if (src.slice) chapters = chapters.slice(...src.slice)
  if (src.stopAtPart) {
    const stop = chapters.findIndex((c, i) => i > 0 && c.part && new RegExp(src.stopAtPart!, 'i').test(c.part))
    if (stop > 0) chapters = chapters.slice(0, stop)
  }
  if (src.only) chapters = chapters.filter((c) => new RegExp(src.only!, 'i').test(c.title))
  chapters = polish(chapters)

  const json = JSON.stringify({ id: src.id, chapters })
  writeFileSync(join(OUT_BOOKS, `${src.id}.json`), json)
  const chars = chapters.map((c) => c.blocks.reduce((n, [, x]) => n + x.length, 0))
  const words = chapters.reduce((n, c) => n + c.blocks.reduce((m, [, x]) => m + x.split(/\s+/).length, 0), 0)
  meta[src.id] = {
    words,
    bytes: Buffer.byteLength(json),
    sourceUrl,
    chapters: chapters.map((c, i) => ({
      title: c.title,
      ...(c.subtitle ? { subtitle: c.subtitle } : {}),
      ...(c.part ? { part: c.part } : {}),
      chars: chars[i],
    })),
    ...(src.librivox ? { audio: await librivox(src.librivox) } : {}),
  }
  console.log(
    `${src.id.padEnd(34)} ${String(chapters.length).padStart(4)} caps ${String(words).padStart(7)} palabras ${(Buffer.byteLength(json) / 1024).toFixed(0).padStart(5)} KB`,
  )
}

writeFileSync(
  OUT_META,
  `// Generated by scripts/build-library.ts — do not edit by hand.\n` +
    `import type { LibraryMeta } from '../types'\n\n` +
    `export const LIBRARY: Record<string, LibraryMeta> = ${JSON.stringify(meta, null, 1)}\n`,
)
console.log(`\n→ ${OUT_META}`)
