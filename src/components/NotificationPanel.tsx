import { Bell, BellOff, BookOpen, CheckCheck, ClipboardList, Download, Info, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../context/LibraryContext'
import { cn, relativeTime } from '../lib/format'
import type { AppNotification } from '../types'

const kindIcon: Record<AppNotification['kind'], typeof Bell> = {
  download: Download,
  recommendation: BookOpen,
  task: ClipboardList,
  system: Info,
}

/** Bell button + dropdown panel (full-width sheet on mobile). */
export function NotificationPanel() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, clearNotifications } = useLibrary()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openItem = (n: AppNotification) => {
    markNotificationRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="icon-btn relative"
        aria-label={unreadCount ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="size-5" strokeWidth={1.8} aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 size-2.5 rounded-full border-2 border-surface bg-primary dark:bg-accent" aria-hidden />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="fixed inset-x-4 top-20 z-50 animate-rise overflow-hidden rounded-[18px] border border-line bg-surface shadow-pop sm:absolute sm:inset-x-auto sm:top-14 sm:right-0 sm:w-96"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-semibold text-text">Notificaciones</h2>
              <p className="text-xs text-muted">{unreadCount ? `${unreadCount} sin leer` : 'Estás al día'}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={markAllNotificationsRead}
                disabled={!unreadCount}
                className="grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-bg2 hover:text-accent disabled:opacity-40"
                aria-label="Marcar todas como leídas"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="size-[18px]" />
              </button>
              <button
                onClick={clearNotifications}
                disabled={!notifications.length}
                className="grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-bg2 hover:text-error disabled:opacity-40"
                aria-label="Borrar todas las notificaciones"
                title="Borrar todas"
              >
                <Trash2 className="size-[18px]" />
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="mb-3 grid size-12 place-items-center rounded-full bg-soft text-accent">
                <BellOff className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-text">No tienes notificaciones</p>
              <p className="mt-1 text-xs text-muted">Te avisaremos sobre tareas, descargas y novedades.</p>
            </div>
          ) : (
            <ul className="max-h-[60dvh] divide-y divide-line overflow-y-auto sm:max-h-96">
              {notifications.map((n) => {
                const Icon = kindIcon[n.kind]
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => openItem(n)}
                      className={cn(
                        'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-bg2',
                        !n.read && 'bg-softer',
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft text-accent">
                        <Icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="flex-1 text-sm font-semibold text-text">{n.title}</span>
                          {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary dark:bg-accent" aria-label="Sin leer" />}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-muted">{n.body}</span>
                        <span className="mt-1 block text-xs text-disabled">{relativeTime(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
