export default function PdfViewerModal({ title, url, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-viewer">
        <div className="modal-viewer-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <iframe title={title} src={url}></iframe>
      </div>
    </div>
  )
}
