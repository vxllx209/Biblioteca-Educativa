import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerPassword2, setRegisterPassword2] = useState('')

  function switchTo(nextMode) {
    setMode(nextMode)
    setMessage(null)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(loginEmail.trim(), loginPassword)
    setLoading(false)
    if (error) setMessage({ type: 'error', text: error.message })
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (registerPassword !== registerPassword2) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }
    setLoading(true)
    const { error } = await signUp(registerEmail.trim(), registerPassword)
    setLoading(false)
    if (error) setMessage({ type: 'error', text: error.message })
  }

  return (
    <div id="authScreen">
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">
            <i className="fas fa-book-reader"></i>
          </span>
          <h1>Biblioteca Educativa</h1>
        </div>
        <p className="subtitle">
          {mode === 'login'
            ? 'Inicia sesión para repasar y estudiar'
            : 'Crea tu cuenta para empezar a estudiar'}
        </p>

        {message && (
          <div className={message.type === 'error' ? 'auth-error' : 'auth-info'}>
            <i
              className={`fas ${message.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}
            ></i>
            {message.text}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} noValidate={false}>
            <div className="field">
              <label htmlFor="loginEmail">Correo (Gmail)</label>
              <input
                type="email"
                id="loginEmail"
                placeholder="tucorreo@gmail.com"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="loginPassword">Contraseña</label>
              <input
                type="password"
                id="loginPassword"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Ingresando…
                </>
              ) : (
                <>
                  <i className="fas fa-right-to-bracket"></i> Iniciar sesión
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="registerEmail">Correo (Gmail)</label>
              <input
                type="email"
                id="registerEmail"
                placeholder="tucorreo@gmail.com"
                required
                autoComplete="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="registerPassword">Contraseña</label>
              <input
                type="password"
                id="registerPassword"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="registerPassword2">Confirmar contraseña</label>
              <input
                type="password"
                id="registerPassword2"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                value={registerPassword2}
                onChange={(e) => setRegisterPassword2(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creando cuenta…
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> Crear cuenta
                </>
              )}
            </button>
          </form>
        )}

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <a onClick={() => switchTo('register')}>Regístrate</a>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta? <a onClick={() => switchTo('login')}>Inicia sesión</a>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
