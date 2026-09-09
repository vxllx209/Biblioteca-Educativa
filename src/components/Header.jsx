import { inicialesDe } from '../lib/subjects.js'

export default function Header({ title, subtitle, userName, onMenuToggle }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Abrir menú">
          <i className="fas fa-bars"></i>
        </button>
        <div>
          <h1>{title}</h1>
          <small>{subtitle}</small>
        </div>
      </div>
      <div className="header-right">
        <span className="user-name">{userName}</span>
        <div className="avatar">{inicialesDe(userName)}</div>
      </div>
    </header>
  )
}
