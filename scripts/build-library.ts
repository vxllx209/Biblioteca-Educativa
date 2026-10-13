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
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
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

async function cached(name: string, url: string, delayMs = 0): Promise<string> {
  const file = join(CACHE, name)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  // Wikimedia rate-limits bursts of API calls.
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
  let res = await fetch(url, { headers: { 'User-Agent': 'BibliotecaEducativa/1.0 (educational build script)' } })
  for (let wait = 10_000; res.status === 429 && wait <= 80_000; wait *= 2) {
    console.log(`  (límite de peticiones, reintento en ${wait / 1000} s)`)
    await new Promise((r) => setTimeout(r, wait))
    res = await fetch(url, { headers: { 'User-Agent': 'BibliotecaEducativa/1.0 (educational build script)' } })
  }
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
  const headingRe = src.chapter.heading ? new RegExp(src.chapter.heading, 'i') : null
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
      (chapterTag && tag === chapterTag) ||
      (!!chapterRe && tag === 'p' && text.length < 90 && chapterRe.test(text)) ||
      (!!headingRe && isHeading && headingRe.test(text))

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
      if (src.introChapters) current = null
      continue
    }
    // Text between a part heading and its first chapter (an introduction) becomes its own chapter.
    if (src.introChapters && !current && pendingPart && !dropping) {
      current = { title: pendingPart, blocks: [] }
      chapters.push(current)
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
  const url = `https://es.wikisource.org/w/api.php?action=parse&format=json&formatversion=2&prop=text&redirects=1&page=${encodeURIComponent(page)}`
  const json = JSON.parse(await cached(`ws-${page.replace(/[^\w]+/g, '_')}.json`, url, 1500))
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

async function librivox(id: string, only?: string): Promise<{ archiveId: string; mirrors: string[]; tracks: Track[] }> {
  const meta = JSON.parse(await cached(`ia-${id}.json`, `https://archive.org/metadata/${id}`))
  const tracks: Track[] = (meta.files as { name: string; title?: string; length?: string }[])
    .filter((f) => f.name.endsWith('_64kb.mp3') && (!only || new RegExp(only, 'i').test(f.title ?? f.name)))
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

/**
 * Original study material written for the app (content/<id>.md):
 *   "# Title" starts a chapter, "> text" right after it is its subtitle,
 *   "## Heading" is a section heading, blank lines separate paragraphs.
 */
function local(file: string): Chapter[] {
  const chapters: Chapter[] = []
  let current: Chapter | null = null
  // A folder is read as one text: its .md files in name order (long works are written in parts).
  const path = join(ROOT, file)
  const text = statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .map((f) => readFileSync(join(path, f), 'utf8'))
        .join('\n\n')
    : readFileSync(path, 'utf8')
  for (const raw of text.replace(/\r/g, '').split(/\n{2,}/)) {
    const para = raw.trim()
    if (!para || para.startsWith('<!--')) continue
    const lines = raw.replace(/^\n+|\s+$/g, '').split('\n')
    // Indented lines (slogans, inscriptions, verse) keep their line breaks.
    if (current && lines.every((l) => /^ {2,}\S/.test(l))) {
      current.blocks.push(['v', lines.map((l) => l.trim()).join('\n')])
      continue
    }
    if (para.startsWith('# ')) {
      current = { title: lines[0].slice(2).trim(), blocks: [] }
      const sub = lines.slice(1).join(' ').trim()
      if (sub.startsWith('> ')) current.subtitle = sub.slice(2).trim()
      chapters.push(current)
    } else if (!current) continue
    else if (para.startsWith('> ') && !current.blocks.length && !current.subtitle) current.subtitle = para.slice(2).trim()
    else if (para.startsWith('## ')) current.blocks.push(['h', para.slice(3).trim()])
    // Lists and worked steps keep their line breaks.
    else if (lines.length > 1 && lines.every((l) => /^\s*([-•]|\d+[.)]|→)\s/.test(l)))
      current.blocks.push(['v', lines.map((l) => l.trim().replace(/^[-•]\s/, '• ')).join('\n')])
    else current.blocks.push(['p', para.replace(/\s*\n\s*/g, ' ')])
  }
  return chapters
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
  } else if (src.local) {
    chapters = local(src.local)
    sourceUrl = ''
  } else if (src.wikisource) {
    for (const [i, page] of src.wikisource.pages.entries()) {
      const html = await wikisource(page)
      const blocks = extract(`<html><body><h1>x</h1>${html}</body></html>`, src, 'h1')[0]?.blocks ?? []
      // Drop the repeated title lines of the printed page ("Elementos", "De Euclides", "Libro primero").
      while (blocks.length && /^(elementos|de euclides|libro \p{L}+|pr[oó]logo[\p{L} ]*)\.?$/iu.test(blocks[0][1])) blocks.shift()
      chapters.push({ title: src.wikisource.titles?.[i] ?? page.split('/').pop()!, blocks })
    }
    sourceUrl = `https://es.wikisource.org/wiki/${encodeURIComponent(src.wikisource.index ?? src.wikisource.pages[0].split('/')[0])}`
  }
  if (src.slice) chapters = chapters.slice(...src.slice)
  if (src.stopAtPart) {
    const stop = chapters.findIndex((c, i) => i > 0 && c.part && new RegExp(src.stopAtPart!, 'i').test(c.part))
    if (stop > 0) chapters = chapters.slice(0, stop)
  }
  if (src.only) chapters = chapters.filter((c) => new RegExp(src.only!, 'i').test(c.title))
  if (src.startAt && chapters[0]) {
    // Skip the publisher's front matter printed before the text begins.
    const start = chapters[0].blocks.findIndex(([, x]) => new RegExp(src.startAt!, 'i').test(x))
    if (start > 0) chapters[0].blocks = chapters[0].blocks.slice(start)
  }
  if (src.endAt) {
    // Everything from this paragraph on belongs to the edition, not the work (e.g. a table of contents).
    const re = new RegExp(src.endAt, 'i')
    const at = chapters.findIndex((c) => c.blocks.some(([, x]) => re.test(x)))
    if (at >= 0) {
      chapters[at].blocks = chapters[at].blocks.slice(0, chapters[at].blocks.findIndex(([, x]) => re.test(x)))
      chapters = chapters.slice(0, at + 1)
    }
  }
  if (src.subtitleAfter) {
    // A printed heading inside the page: drop it and keep the line after it as the chapter's subtitle.
    const re = new RegExp(src.subtitleAfter)
    for (const c of chapters) {
      const at = c.blocks.findIndex(([, x]) => re.test(x))
      if (at < 0) continue
      const next = c.blocks[at + 1]
      if (next && next[1].length <= 160) c.subtitle = next[1].replace(/^cap[ií]tulo\s+[ivxlc]+\.\s*/i, '').replace(/\.$/, '')
      c.blocks.splice(at, next && next[1].length <= 160 ? 2 : 1)
    }
  }
  if (src.dropBlocks) {
    const re = new RegExp(src.dropBlocks)
    chapters.forEach((c) => (c.blocks = c.blocks.filter(([, x]) => !re.test(x))))
  }
  if (src.minChars) chapters = chapters.filter((c) => c.blocks.reduce((n, [, x]) => n + x.length, 0) >= src.minChars!)
  chapters = src.local ? chapters : polish(chapters)
  // A subtitle that only repeats the title (Wikisource page headers) adds nothing.
  const bare = (t: string) => strip(t).toLowerCase().replace(/\W+/g, '')
  chapters.forEach((c) => c.subtitle && bare(c.subtitle) === bare(c.title) && delete c.subtitle)

  const json = JSON.stringify({ id: src.id, chapters })
  writeFileSync(join(OUT_BOOKS, `${src.id}.json`), json)
  const chars = chapters.map((c) => c.blocks.reduce((n, [, x]) => n + x.length, 0))
  const words = chapters.reduce((n, c) => n + c.blocks.reduce((m, [, x]) => m + x.split(/\s+/).length, 0), 0)
  meta[src.id] = {
    words,
    bytes: Buffer.byteLength(json),
    ...(sourceUrl ? { sourceUrl } : {}),
    chapters: chapters.map((c, i) => ({
      title: c.title,
      ...(c.subtitle ? { subtitle: c.subtitle } : {}),
      ...(c.part ? { part: c.part } : {}),
      chars: chars[i],
    })),
    ...(src.librivox ? { audio: await librivox(src.librivox, src.librivoxTracks) } : {}),
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
