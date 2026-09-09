export default function ConfirmModal({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-confirm">
        <div className="modal-confirm-icon">
          <i className="fas fa-triangle-exclamation"></i>
        </div>
        <h3>{title}</h3>
        <p className="modal-confirm-text">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
