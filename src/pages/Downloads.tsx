import { BookOpen, CloudOff, Download, HardDrive, Trash2, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookCover } from '../components/BookCover'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { ProgressBar } from '../components/ProgressBar'
import { EmptyState, RowSkeleton } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { BOOKS, getBook } from '../data/books'
import { FREE_DOWNLOAD_LIMIT } from '../data/mock'
import { useSimulatedLoading } from '../hooks/useSimulatedLoading'
import { formatDate } from '../lib/format'
import type { Book, Download as DownloadItem } from '../types'

export default function Downloads() {
  const { downloads, downloading, removeDownload } = useLibrary()
  const { isPremium } = useAuth()
  const [confirm, setConfirm] = useState<Book | null>(null)
  const loading = useSimulatedLoading()

  const items = useMemo(
    () => downloads.map((d) => ({ d, book: getBook(d.bookId) })).filter((x): x is { d: DownloadItem; book: Book } => !!x.book),
    [downloads],
  )
  const inProgress = Object.entries(downloading)
  const totalMB = items.reduce((s, x) => s + x.d.sizeMB, 0)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mis descargas"
        subtitle={`${items.length} ${items.length === 1 ? 'libro descargado' : 'libros descargados'} · ${totalMB.toFixed(1)} MB`}
      />

      {!isPremium && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[14px] bg-softer px-4 py-3 text-sm text-muted">
          <HardDrive className="size-4 text-accent" aria-hidden />
          <span className="flex-1">
            Plan Gratis: {items.length} de {FREE_DOWNLOAD_LIMIT} descargas usadas.
          </span>
          <Link to="/premium" className="font-semibold text-accent hover:underline">
            Descargas ilimitadas
          </Link>
        </div>
      )}

      {inProgress.length > 0 && (
        <ul className="mb-6 space-y-3" aria-label="Descargas en curso">
          {inProgress.map(([id, pct]) => {
            const b = BOOKS.find((x) => x.id === id)
            return (
              <li key={id} className="card flex items-center gap-4 p-4">
                <Download className="size-5 animate-pulse text-accent" aria-hidden />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">{b?.title}</p>
                  <ProgressBar value={pct} showValue className="mt-2" label={`Descargando ${b?.title}`} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CloudOff}
          title="No tienes descargas"
          description="Descarga libros desde su página de detalle para leerlos sin conexión a internet."
          action={
            <Link to="/explore" className="btn-primary">
              Explorar libros
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {items.map(({ d, book }) => (
            <li key={book.id} className="card flex gap-4 p-4 sm:p-5">
              <Link to={`/book/${book.id}`} className="w-20 shrink-0 overflow-hidden rounded-[10px] shadow-card sm:w-24" aria-label={`Ver ${book.title}`}>
                <BookCover book={book} showText={false} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-[15px] font-semibold text-text">{book.title}</h2>
                    <p className="truncate text-[13px] text-muted">{book.author}</p>
                  </div>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{d.sizeMB.toFixed(1)} MB</span>
                  <span aria-hidden>·</span>
                  <span>Descargado el {formatDate(d.downloadedAt)}</span>
                </p>
                <span className="badge mt-2 w-fit bg-success-soft text-success">
                  <WifiOff className="size-3.5" aria-hidden /> Disponible sin conexión
                </span>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link to={`/reader/${book.id}`} className="btn-primary h-10 min-h-10 flex-1 px-4 text-sm sm:flex-none">
                    <BookOpen className="size-4" aria-hidden /> Abrir
                  </Link>
                  <button
                    onClick={() => setConfirm(book)}
                    className="btn h-10 min-h-10 flex-1 border border-line px-4 text-sm text-error hover:border-error/40 hover:bg-error-soft sm:flex-none"
                  >
                    <Trash2 className="size-4" aria-hidden /> Eliminar descarga
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="¿Eliminar descarga?"
        description={confirm ? `“${confirm.title}” dejará de estar disponible sin conexión. Podrás descargarlo de nuevo cuando quieras.` : ''}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(null)}>
              Cancelar
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                if (confirm) removeDownload(confirm.id)
                setConfirm(null)
              }}
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">Tu progreso de lectura y tus marcadores se conservarán.</p>
      </Modal>
    </div>
  )
}
