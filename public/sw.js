/* Biblioteca Educativa — offline support.
 * - App shell (HTML, JS, CSS, fonts, icons): cached as it is used, so the app opens without a connection.
 * - Book texts (/books/*.json): served from the "be-books-v1" cache that the Downloads feature fills.
 * Audio is streamed from archive.org and is not cached.
 */
const SHELL = 'be-shell-v1'
const BOOKS = 'be-books-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(['./', './index.html', './favicon.svg']))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, BOOKS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Single-page app navigation: network first, cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html')),
    )
    return
  }

  // Downloaded books: offline copy first.
  if (url.pathname.includes('/books/') && url.pathname.endsWith('.json')) {
    event.respondWith(caches.open(BOOKS).then((c) => c.match(req).then((hit) => hit || fetch(req))))
    return
  }

  // Hashed build assets and static files: cache first, then network (and remember it).
  if (url.pathname.includes('/assets/') || /\.(svg|png|woff2?|css|js)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(SHELL).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
