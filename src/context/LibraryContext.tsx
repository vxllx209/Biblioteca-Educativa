import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DEMO_USER, DOWNLOADS, FAVORITES, FREE_DOWNLOAD_LIMIT, NOTIFICATIONS, READING_PROGRESS, TASKS } from '../data/mock'
import { usePersistentState } from '../hooks/usePersistentState'
import { userKey } from '../lib/storage'
import type { AppNotification, Book, Download, ReadingProgress, Task } from '../types'
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
  removeDownload: (bookId: string) => void

  progress: Record<string, ReadingProgress>
  saveProgress: (p: Omit<ReadingProgress, 'updatedAt' | 'bookmarks'>) => void
  toggleBookmark: (bookId: string, page: number) => void

  tasks: Task[]
  updateTask: (id: string, patch: Partial<Task>) => void

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

  const [favorites, setFavorites] = usePersistentState<string[]>(k('favorites'), () => (isDemo ? FAVORITES : []))
  const [downloads, setDownloads] = usePersistentState<Download[]>(k('downloads'), () => (isDemo ? DOWNLOADS : []))
  const [progress, setProgress] = usePersistentState<Record<string, ReadingProgress>>(k('progress'), () =>
    isDemo ? byBook(READING_PROGRESS) : {},
  )
  const [tasks, setTasks] = usePersistentState<Task[]>(k('tasks'), () => TASKS)
  const [notifications, setNotifications] = usePersistentState<AppNotification[]>(k('notifications'), () =>
    isDemo ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.kind !== 'download'),
  )
  const [downloading, setDownloading] = useState<Record<string, number>>({})
  const timers = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  useEffect(() => {
    const active = timers.current
    return () => Object.values(active).forEach(clearInterval)
  }, [])

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

  const finishDownload = useCallback(
    (book: Book) => {
      setDownloads((list) =>
        list.some((d) => d.bookId === book.id)
          ? list
          : [{ bookId: book.id, downloadedAt: new Date().toISOString(), sizeMB: book.sizeMB }, ...list],
      )
      toast(`“${book.title}” se descargó correctamente`)
      if (notifyDownloadsRef.current)
        addNotification({
          title: 'Tu descarga terminó',
          body: `“${book.title}” está disponible sin conexión.`,
          kind: 'download',
          link: '/downloads',
        })
    },
    [setDownloads, toast, addNotification],
  )

  const startDownload = useCallback(
    (book: Book) => {
      if (isDownloaded(book.id) || timers.current[book.id]) return
      if (!canAccess(book)) {
        toast('Este libro requiere Premium para descargarse.', 'error')
        return
      }
      if (!isPremium && downloads.length >= FREE_DOWNLOAD_LIMIT) {
        toast(`El plan Gratis permite ${FREE_DOWNLOAD_LIMIT} descargas. Elimina una o mejora tu plan.`, 'error')
        return
      }
      // Simulated transfer; replace with a real fetch + Cache API / IndexedDB when a backend exists.
      let value = 0
      setDownloading((d) => ({ ...d, [book.id]: 0 }))
      timers.current[book.id] = setInterval(() => {
        value = Math.min(100, value + 12 + Math.random() * 14)
        if (value < 100) {
          setDownloading((d) => ({ ...d, [book.id]: value }))
          return
        }
        clearInterval(timers.current[book.id])
        delete timers.current[book.id]
        setDownloading(({ [book.id]: _done, ...rest }) => rest)
        finishDownload(book)
      }, 220)
    },
    [isDownloaded, canAccess, isPremium, downloads.length, toast, finishDownload],
  )

  const removeDownload = useCallback(
    (id: string) => {
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

  const toggleBookmark = useCallback(
    (bookId: string, page: number) =>
      setProgress((all) => {
        const current = all[bookId]
        if (!current) return all
        const has = current.bookmarks.includes(page)
        return {
          ...all,
          [bookId]: {
            ...current,
            bookmarks: has ? current.bookmarks.filter((b) => b !== page) : [...current.bookmarks, page].sort((a, b) => a - b),
          },
        }
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
      removeDownload,
      progress,
      saveProgress,
      toggleBookmark,
      tasks,
      updateTask,
      notifications,
      unreadCount,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      canAccess,
    }),
    [
      favorites, isFavorite, toggleFavorite, downloads, downloading, isDownloaded, startDownload, removeDownload,
      progress, saveProgress, toggleBookmark, tasks, updateTask, notifications, unreadCount, addNotification,
      markNotificationRead, markAllNotificationsRead, clearNotifications, canAccess,
    ],
  )
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
