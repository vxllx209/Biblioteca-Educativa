export default function PdfCard({ pdf, canDelete, onView, onDownload, onDelete }) {
  return (
    <div className="pdf-card">
      <div className="pdf-card-top">
        <i className="fas fa-file-pdf pdf-icon"></i>
        {pdf.isSeed && (
          <span className="pdf-badge">
            <i className="fas fa-circle-check"></i> Oficial
          </span>
        )}
      </div>
      <h4>{pdf.title}</h4>
      {pdf.topic && <div className="pdf-topic">{pdf.topic}</div>}
      <div className="pdf-meta">
        {pdf.uploader_name || 'Usuario'} · {new Date(pdf.created_at).getFullYear()}
      </div>
      <div className="pdf-actions">
        <button className="btn btn-outline" onClick={onView}>
          <i className="fas fa-eye"></i> Ver
        </button>
        <button className="btn btn-outline" onClick={onDownload}>
          <i className="fas fa-download"></i>
        </button>
        {canDelete && (
          <button className="btn btn-danger btn-icon-only" onClick={onDelete} aria-label="Eliminar PDF">
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </div>
  )
}
