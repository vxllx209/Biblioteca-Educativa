import { useState } from 'react'

export default function UploadModal({ onCancel, onUpload }) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    await onUpload({ title: title.trim(), file })
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <h3>Subir PDF</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="pdfTitle">Título</label>
            <input
              type="text"
              id="pdfTitle"
              placeholder="Ej: Guía de fracciones"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pdfFile">Archivo PDF</label>
            <label className="file-drop" htmlFor="pdfFile">
              <i className="fas fa-cloud-arrow-up"></i>
              <span>{file ? file.name : 'Haz clic para elegir un archivo PDF'}</span>
            </label>
            <input
              type="file"
              id="pdfFile"
              accept="application/pdf"
              required
              hidden
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Subiendo…
                </>
              ) : (
                'Subir'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
