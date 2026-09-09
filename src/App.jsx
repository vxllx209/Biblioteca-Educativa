import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { SUBJECTS, nombreDesdeEmail } from './lib/subjects.js'
import { PAES_SUBJECTS } from './lib/paesSubjects.js'
import { getSeedPdfs } from './lib/library.js'
import { getPaesSeedPdfs } from './lib/paesLibrary.js'
import AuthScreen from './components/AuthScreen.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import SubjectView from './components/SubjectView.jsx'
import './App.css'

function AppShell() {
  const { session, signOut } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')
  const [activeSubject, setActiveSubject] = useState('matematicas')
  const [activePaes, setActivePaes] = useState('paes-lectora')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const theme =
      activeView === 'subject'
        ? SUBJECTS[activeSubject]
        : activeView === 'paes'
          ? PAES_SUBJECTS[activePaes]
          : SUBJECTS.matematicas
    const root = document.documentElement
    root.style.setProperty('--accent', theme.color)
    root.style.setProperty('--accent-dark', theme.dark)
    root.style.setProperty('--accent-light', theme.light)
    root.style.setProperty('--bg-tint', theme.bgTint)
  }, [activeView, activeSubject, activePaes])

  function goDashboard() {
    setActiveView('dashboard')
    setSidebarOpen(false)
  }

  function goSubject(key) {
    setActiveSubject(key)
    setActiveView('subject')
    setSidebarOpen(false)
  }

  function goPaes(key) {
    setActivePaes(key)
    setActiveView('paes')
    setSidebarOpen(false)
  }

  const userName = nombreDesdeEmail(session.user.email)
  const currentSubject = SUBJECTS[activeSubject]
  const currentPaes = PAES_SUBJECTS[activePaes]

  return (
    <div id="app">
      <Sidebar
        activeView={activeView}
        activeSubject={activeSubject}
        activePaes={activePaes}
        onSelectDashboard={goDashboard}
        onSelectSubject={goSubject}
        onSelectPaes={goPaes}
        onLogout={signOut}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">
        <Header
          title={
            activeView === 'dashboard'
              ? 'Dashboard'
              : activeView === 'subject'
                ? currentSubject.nombre
                : currentPaes.nombre
          }
          subtitle={
            activeView === 'dashboard'
              ? 'Elige una materia para repasar'
              : activeView === 'subject'
                ? 'Material de estudio en PDF'
                : 'Ensayos y guías de práctica PAES'
          }
          userName={userName}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <div className="content">
          {activeView === 'dashboard' && (
            <Dashboard
              activeSubject={activeSubject}
              onSelectSubject={goSubject}
              activePaes={activePaes}
              onSelectPaes={goPaes}
            />
          )}
          {activeView === 'subject' && (
            <SubjectView
              subjectKey={activeSubject}
              subject={currentSubject}
              seedPdfs={getSeedPdfs(activeSubject)}
              subtitleText="Material de estudio en PDF"
            />
          )}
          {activeView === 'paes' && (
            <SubjectView
              subjectKey={activePaes}
              subject={currentPaes}
              seedPdfs={getPaesSeedPdfs(activePaes)}
              subtitleText="Ensayos y guías de práctica PAES"
            />
          )}
        </div>
      </main>
    </div>
  )
}

function Root() {
  const { session, ready } = useAuth()

  if (!ready) return null
  return session ? <AppShell /> : <AuthScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Root />
      </ToastProvider>
    </AuthProvider>
  )
}
