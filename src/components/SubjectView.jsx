import { useCallback, useEffect, useState } from 'react'
import { backend } from '../lib/backend.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import PdfCard from './PdfCard.jsx'
import UploadModal from './UploadModal.jsx'
import PdfViewerModal from './PdfViewerModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'

export default function SubjectView({ subjectKey, subject, seedPdfs, subtitleText }) {
  const { session } = useAuth()
  const showToast = useToast()

  const [uploaded, setUploaded] = useState(null)
  const [error, setError] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [viewer, setViewer] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setUploaded(null)
    setError(false)
    try {
      const data = await backend.pdfs.listBySubject(subjectKey)
      setUploaded(data)
    } catch (err) {
      setError(true)
      showToast('Error al cargar PDFs: ' + err.message, 'error')
    }
  }, [subjectKey, showToast])

  useEffect(() => {
    load()
  }, [load])

  const allPdfs = [...seedPdfs, ...(uploaded || [])]

  async function handleUpload({ title, file }) {
    try {
      await backend.pdfs.upload({
        subject: subjectKey,
        title,
        file,
        userId: session.user.id,
        userName: session.user.email,
      })
      showToast('PDF subido correctamente', 'success')
      setShowUpload(false)
      load()
    } catch (err) {
      showToast('Error al subir el PDF: ' + err.message, 'error')
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await backend.pdfs.remove(pendingDelete.id)
      showToast('PDF eliminado', 'success')
      setPendingDelete(null)
      load()
    } catch (err) {
      showToast('Error al borrar: ' + err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  function handleView(pdf) {
    if (pdf.isSeed) {
      window.open(pdf.url, '_blank', 'noopener')
    } else {
      setViewer({ title: pdf.title, url: backend.pdfs.getUrl(pdf) })
    }
  }

  function handleDownload(pdf) {
    if (pdf.isSeed) {
      window.open(pdf.url, '_blank', 'noopener')
      return
    }
    const url = backend.pdfs.getUrl(pdf)
    const a = document.createElement('a')
    a.href = url
    a.download = pdf.title.toLowerCase().endsWith('.pdf') ? pdf.title : `${pdf.title}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div>
      <div className="section-header">
        <h3>
          <i className={`fas ${subject.icon}`}></i> {subject.nombre}
          <small>{subtitleText}</small>
        </h3>
        <button className="btn" onClick={() => setShowUpload(true)}>
          <i className="fas fa-upload"></i> Subir PDF
        </button>
      </div>

      {uploaded === null && !error && seedPdfs.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando…</p>
        </div>
      )}

      {error && (
        <div className="empty-state">
          <i className="fas fa-triangle-exclamation"></i>
          <p>No se pudieron cargar los PDFs.</p>
        </div>
      )}

      {!error && allPdfs.length === 0 && uploaded !== null && (
        <div className="empty-state">
          <i className="fas fa-file-circle-question"></i>
          <p>Todavía no hay PDFs en esta materia.</p>
        </div>
      )}

      {allPdfs.length > 0 && (
        <div className="pdf-grid">
          {allPdfs.map((pdf) => (
            <PdfCard
              key={pdf.id}
              pdf={pdf}
              canDelete={!pdf.isSeed && session && pdf.uploaded_by === session.user.id}
              onView={() => handleView(pdf)}
              onDownload={() => handleDownload(pdf)}
              onDelete={() => setPendingDelete(pdf)}
            />
          ))}
        </div>
      )}

      {showUpload && (
        <UploadModal onCancel={() => setShowUpload(false)} onUpload={handleUpload} />
      )}

      {viewer && (
        <PdfViewerModal
          title={viewer.title}
          url={viewer.url}
          onClose={() => {
            URL.revokeObjectURL(viewer.url)
            setViewer(null)
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Eliminar PDF"
          message={`¿Seguro que quieres eliminar "${pendingDelete.title}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
