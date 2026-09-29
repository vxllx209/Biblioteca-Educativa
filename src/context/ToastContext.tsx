import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { Toast, type ToastItem, type ToastVariant } from '../components/Toast'

interface ToastValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = ++counter.current
      setItems((list) => [...list.slice(-2), { id, message, variant }])
      setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4 md:top-6 md:right-6 md:left-auto md:items-end"
        aria-live="polite"
        role="status"
      >
        {items.map((t) => (
          <Toast key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
