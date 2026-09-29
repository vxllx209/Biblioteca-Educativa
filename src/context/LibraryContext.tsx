import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEMO_USER, FAVORITES, FREE_DOWNLOAD_LIMIT, NOTIFICATIONS, READING_PROGRESS, TASKS } from '../data/mock'
import { usePersistentState } from '../hooks/usePersistentState'
import { downloadBook, isBookCached, removeBookDownload } from '../lib/offline'
import { userKey } from '../lib/storage'
import type { AppNotification, Book, Bookmark, Download, PracticeResult, PracticeSet, ReadingProgress, Task } from '../types'
import { useAuth } from './AuthContext'
import { usePreferences } from './PreferencesContext'
import { useToast } from './ToastContext'

interface LibraryValue {
  favorites: string[]
  isFavorite: (bookId: string) => boolean
  toggleFavorite: (bookId: string) => void

  downloads: Download[]
  downloading: Record<string, number>
  isDownloaded: (bookId: string) => boolean
  startDownload: (book: Book) => void
  cancelDownload: (bookId: string) => void
  removeDownload: (bookId: string) => Promise<void>

  progress: Record<string, ReadingProgress>
  saveProgress: (p: Omit<ReadingProgress, 'updatedAt' | 'bookmarks'>) => void
  addBookmark: (bookId: string, bookmark: Omit<Bookmark, 'createdAt'>) => void
  removeBookmark: (bookId: string, index: number) => void

  tasks: Task[]
  updateTask: (id: string, patch: Partial<Task>) => void

  practice: Record<string, PracticeResult>
  savePracticeResult: (set: PracticeSet, score: number, max: number) => void

  notifications: AppNotification[]
  unreadCount: number
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void

  canAccess: (book: Book) => boolean
}

const LibraryContext = createContext<LibraryValue | null>(null)

const byBook = (list: ReadingProgress[]) => Object.fromEntries(list.map((p) => [p.bookId, p]))

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user, isPremium } = useAuth()
  const { prefs } = usePreferences()
  const toast = useToast()
  const uid = user?.id ?? null
  const isDemo = uid === DEMO_USER.id
  const k = (key: string) => (uid ? userKey(uid, key) : null)

  const [favorites, setFavorites] = usePersistentState<string[]>(k('favorites.v2'), () => (isDemo ? FAVORITES : []))
  const [downloads, setDownloads] = usePersistentState<Download[]>(k('downloads.v2'), () => [])
  const [progress, setProgress] = usePersistentState<Record<string, ReadingProgress>>(k('progress.v2'), () =>
    isDemo ? byBook(READING_PROGRESS) : {},
  )
  const [tasks, setTasks] = usePersistentState<Task[]>(k('tasks.v2'), () => TASKS)
  const [notifications, setNotifications] = usePersistentState<AppNotification[]>(k('notifications.v2'), () => NOTIFICATIONS)
  const [practice, setPractice] = usePersistentState<Record<string, PracticeResult>>(k('practice.v1'), () => ({}))
  const [downloading, setDownloading] = useState<Record<string, number>>({})
  const controllers = useRef<Record<string, AbortController>>({})

  useEffect(() => {
    const active = controllers.current
    return () => Object.values(active).forEach((c) => c.abort())
  }, [])

  // Keep the list honest: forget downloads whose offline copy the browser has cleared.
  const downloadsRef = useRef(downloads)
  useEffect(() => {
    downloadsRef.current = downloads
  }, [downloads])
  useEffect(() => {
    const list = downloadsRef.current
    if (!list.length || typeof caches === 'undefined') return
    let cancelled = false
    Promise.all(list.map((d) => isBookCached(d.bookId))).then((present) => {
      if (cancelled || present.every(Boolean)) return
      const missing = new Set(list.filter((_, i) => !present[i]).map((d) => d.bookId))
      setDownloads((current) => current.filter((d) => !missing.has(d.bookId)))
    })
    return () => {
      cancelled = true
    }
  }, [uid, setDownloads])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])
  const toggleFavorite = useCallback(
    (id: string) => {
      const adding = !favorites.includes(id)
      setFavorites((list) => (adding ? [id, ...list] : list.filter((x) => x !== id)))
      toast(adding ? 'Agregado a favoritos' : 'Eliminado de favoritos', adding ? 'success' : 'info')
    },
    [favorites, setFavorites, toast],
  )

  const addNotification = useCallback<LibraryValue['addNotification']>(
    (n) =>
      setNotifications((list) => [
        { ...n, id: `n-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), read: false },
        ...list,
      ]),
    [setNotifications],
  )

  const isDownloaded = useCallback((id: string) => downloads.some((d) => d.bookId === id), [downloads])
  const canAccess = useCallback((book: Book) => !book.premium || isPremium, [isPremium])

  const notifyDownloadsRef = useRef(prefs.notifyDownloads)
  useEffect(() => {
    notifyDownloadsRef.current = prefs.notifyDownloads
  }, [prefs.notifyDownloads])

  const startDownload = useCallback(
    async (book: Book) => {
      if (isDownloaded(book.id) || controllers.current[book.id]) return
      if (!canAccess(book)) {
        toast('Este libro requiere Premium para descargarse.', 'error')
        return
      }
      if (!isPremium && downloads.length >= FREE_DOWNLOAD_LIMIT) {
        toast(`El plan Gratis permite ${FREE_DOWNLOAD_LIMIT} descargas. Elimina una o mejora tu plan.`, 'error')
        return
      }
      const controller = new AbortController()
      controllers.current[book.id] = controller
      setDownloading((d) => ({ ...d, [book.id]: 0 }))
      try {
        const bytes = await downloadBook(book, (pct) => setDownloading((d) => ({ ...d, [book.id]: pct })), controller.signal)
        setDownloads((list) =>
          list.some((d) => d.bookId === book.id)
            ? list
            : [{ bookId: book.id, downloadedAt: new Date().toISOString(), bytes }, ...list],
        )
        toast(`«${book.title}» ya está disponible sin conexión`)
        if (notifyDownloadsRef.current)
          addNotification({
            title: 'Tu descarga terminó',
            body: `«${book.title}» está disponible sin conexión.`,
            kind: 'download',
            link: '/downloads',
          })
      } catch (e) {
        if ((e as Error).name !== 'AbortError') toast((e as Error).message || 'No se pudo descargar el libro', 'error')
      } finally {
        delete controllers.current[book.id]
        setDownloading(({ [book.id]: _done, ...rest }) => rest)
      }
    },
    [isDownloaded, canAccess, isPremium, downloads.length, toast, setDownloads, addNotification],
  )

  const cancelDownload = useCallback((id: string) => controllers.current[id]?.abort(), [])

  const removeDownload = useCallback(
    async (id: string) => {
      await removeBookDownload(id).catch(() => undefined)
      setDownloads((list) => list.filter((d) => d.bookId !== id))
      toast('Descarga eliminada', 'info')
    },
    [setDownloads, toast],
  )

  const saveProgress = useCallback<LibraryValue['saveProgress']>(
    (p) =>
      setProgress((all) => ({
        ...all,
        [p.bookId]: { ...p, bookmarks: all[p.bookId]?.bookmarks ?? [], updatedAt: new Date().toISOString() },
      })),
    [setProgress],
  )

  const addBookmark = useCallback<LibraryValue['addBookmark']>(
    (bookId, b) =>
      setProgress((all) => {
        const current = all[bookId]
        if (!current) return all
        const bookmarks = [...current.bookmarks, { ...b, createdAt: new Date().toISOString() }].sort(
          (x, y) => x.chapter - y.chapter || x.position - y.position,
        )
        return { ...all, [bookId]: { ...current, bookmarks } }
      }),
    [setProgress],
  )

  const removeBookmark = useCallback(
    (bookId: string, index: number) =>
      setProgress((all) => {
        const current = all[bookId]
        if (!current) return all
        return { ...all, [bookId]: { ...current, bookmarks: current.bookmarks.filter((_, i) => i !== index) } }
      }),
    [setProgress],
  )

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) =>
      setTasks((list) =>
        list.map((t) => {
          if (t.id !== id) return t
          const next = { ...t, ...patch }
          // Keep status and progress consistent with each other.
          if (patch.progress !== undefined && patch.status === undefined) {
            next.status = next.progress >= 100 ? 'completada' : next.progress > 0 ? 'en-progreso' : 'pendiente'
          }
          if (patch.status === 'completada') next.progress = 100
          if (patch.status === 'pendiente' && patch.progress === undefined) next.progress = 0
          if (patch.status === 'en-progreso' && (next.progress === 0 || next.progress === 100))
            next.progress = next.progress === 0 ? 10 : 90
          return next
        }),
      ),
    [setTasks],
  )

  const savePracticeResult = useCallback<LibraryValue['savePracticeResult']>(
    (set, score, max) => {
      setPractice((all) => {
        const prev = all[set.id]
        const pct = max ? score / max : 0
        return {
          ...all,
          [set.id]: {
            setId: set.id,
            bookId: set.bookId,
            chapter: set.chapter,
            score,
            max,
            best: Math.max(prev?.best ?? 0, pct),
            attempts: (prev?.attempts ?? 0) + 1,
            completedAt: new Date().toISOString(),
          },
        }
      })
      // A task linked to this practice advances with the result.
      setTasks((list) =>
        list.map((t) => {
          const linked = t.practiceSetId ?? TASKS.find((s) => s.id === t.id)?.practiceSetId
          if (linked !== set.id || t.status === 'completada') return t
          const progress = Math.max(t.progress, Math.round((max ? score / max : 0) * 100))
          return { ...t, practiceSetId: linked, progress, status: progress >= 100 ? 'completada' : 'en-progreso' }
        }),
      )
    },
    [setPractice, setTasks],
  )

  const markNotificationRead = useCallback(
    (id: string) => setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [setNotifications],
  )
  const markAllNotificationsRead = useCallback(
    () => setNotifications((list) => list.map((n) => ({ ...n, read: true }))),
    [setNotifications],
  )
  const clearNotifications = useCallback(() => setNotifications([]), [setNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const value = useMemo<LibraryValue>(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      downloads,
      downloading,
      isDownloaded,
      startDownload,
      cancelDownload,
      removeDownload,
      progress,
      saveProgress,
      addBookmark,
      removeBookmark,
      tasks,
      updateTask,
      practice,
      savePracticeResult,
      notifications,
      unreadCount,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      canAccess,
    }),
    [
      favorites, isFavorite, toggleFavorite, downloads, downloading, isDownloaded, startDownload, cancelDownload,
      removeDownload, progress, saveProgress, addBookmark, removeBookmark, tasks, updateTask, practice, savePracticeResult, notifications,
      unreadCount, addNotification, markNotificationRead, markAllNotificationsRead, clearNotifications, canAccess,
    ],
  )
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
