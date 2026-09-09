import { SUBJECTS, SUBJECT_KEYS } from '../lib/subjects.js'
import { PAES_SUBJECTS, PAES_SUBJECT_KEYS } from '../lib/paesSubjects.js'

export default function Sidebar({
  activeView,
  activeSubject,
  activePaes,
  onSelectDashboard,
  onSelectSubject,
  onSelectPaes,
  onLogout,
  open,
  onClose,
}) {
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <i className="fas fa-book-reader"></i>
          <div>
            <h2>Biblioteca Educativa</h2>
            <span>Repasa por materia</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Principal</div>
          <button
            className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={onSelectDashboard}
          >
            <i className="fas fa-house"></i> Dashboard
          </button>

          <div className="nav-label nav-label-spaced">Materias</div>
          {SUBJECT_KEYS.map((key) => {
            const subject = SUBJECTS[key]
            const isActive = activeView === 'subject' && activeSubject === key
            return (
              <button
                key={key}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={isActive ? { '--subject-color': subject.color } : undefined}
                onClick={() => onSelectSubject(key)}
              >
                <i className={`fas ${subject.icon}`}></i> {subject.nombre}
              </button>
            )
          })}

          <div className="nav-label nav-label-spaced">PAES</div>
          {PAES_SUBJECT_KEYS.map((key) => {
            const subject = PAES_SUBJECTS[key]
            const isActive = activeView === 'paes' && activePaes === key
            return (
              <button
                key={key}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={isActive ? { '--subject-color': subject.color } : undefined}
                onClick={() => onSelectPaes(key)}
              >
                <i className={`fas ${subject.icon}`}></i> {subject.nombre}
              </button>
            )
          })}

          <button className="nav-link logout" onClick={onLogout}>
            <i className="fas fa-right-from-bracket"></i> Cerrar sesión
          </button>
        </nav>
      </aside>
    </>
  )
}
