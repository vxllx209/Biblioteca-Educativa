import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AudioProvider } from './context/AudioContext'
import { AuthProvider } from './context/AuthContext'
import { LibraryProvider } from './context/LibraryContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <ToastProvider>
          <AuthProvider>
            <LibraryProvider>
              <AudioProvider>
                <App />
              </AudioProvider>
            </LibraryProvider>
          </AuthProvider>
        </ToastProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Offline support (production builds only, so it never interferes with hot reload).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined)
  })
}
