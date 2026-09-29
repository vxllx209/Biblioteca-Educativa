import type { Book, BookContent } from '../types'

/**
 * Book texts live in /books/<id>.json. "Downloading" a book stores that file in Cache Storage,
 * so it can be read without a connection (the service worker also serves it from there).
 */
export const BOOKS_CACHE = 'be-books-v1'
const memory = new Map<string, Promise<BookContent>>()

export const bookUrl = (id: string) => `${import.meta.env.BASE_URL}books/${id}.json`

const hasCacheApi = () => typeof caches !== 'undefined'

async function fromCache(id: string): Promise<Response | undefined> {
  if (!hasCacheApi()) return undefined
  try {
    const cache = await caches.open(BOOKS_CACHE)
    return await cache.match(bookUrl(id))
  } catch {
    return undefined
  }
}

/** Loads a book's full text: memory → offline copy → network. */
export function loadBookContent(id: string): Promise<BookContent> {
  const existing = memory.get(id)
  if (existing) return existing
  const promise = (async () => {
    const res = (await fromCache(id)) ?? (await fetch(bookUrl(id)))
    if (!res.ok) throw new Error(`No se pudo cargar el libro (${res.status})`)
    return (await res.json()) as BookContent
  })()
  memory.set(id, promise)
  promise.catch(() => memory.delete(id))
  return promise
}

export async function isBookCached(id: string) {
  return !!(await fromCache(id))
}

/** Downloads the book text with real progress and stores it for offline use. Returns the stored size in bytes. */
export async function downloadBook(book: Book, onProgress: (pct: number) => void, signal?: AbortSignal) {
  if (!hasCacheApi()) throw new Error('Tu navegador no permite guardar libros sin conexión.')
  const res = await fetch(bookUrl(book.id), { cache: 'no-store', signal })
  if (!res.ok || !res.body) throw new Error('No se pudo descargar el libro. Revisa tu conexión.')
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    onProgress(Math.min(99, (received / book.bytes) * 100))
  }
  const blob = new Blob(chunks as BlobPart[], { type: 'application/json' })
  const cache = await caches.open(BOOKS_CACHE)
  await cache.put(bookUrl(book.id), new Response(blob, { headers: { 'Content-Type': 'application/json' } }))
  onProgress(100)
  return blob.size
}

export async function removeBookDownload(id: string) {
  if (!hasCacheApi()) return
  const cache = await caches.open(BOOKS_CACHE)
  await cache.delete(bookUrl(id))
}
