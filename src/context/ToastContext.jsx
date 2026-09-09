import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

let idSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      delete timers.current[id]
    }, 250)
  }, [])

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = ++idSeq
      setToasts((prev) => [...prev, { id, message, type, leaving: false }])
      timers.current[id] = setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type} ${t.leaving ? 'leaving' : 'show'}`}>
            <i
              className={`fas ${
                t.type === 'success'
                  ? 'fa-circle-check'
                  : t.type === 'error'
                    ? 'fa-circle-exclamation'
                    : 'fa-circle-info'
              }`}
            ></i>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
