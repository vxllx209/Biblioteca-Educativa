import { useCallback, useEffect, useState } from 'react'
import { loadBookContent } from '../lib/offline'
import type { BookContent } from '../types'

export function useBookContent(id: string | undefined) {
  const [state, setState] = useState<{ id?: string; data?: BookContent; error?: string }>({})
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    loadBookContent(id)
      .then((data) => !cancelled && setState({ id, data }))
      .catch((e: Error) => !cancelled && setState({ id, error: e.message || 'No se pudo cargar el libro.' }))
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  const retry = useCallback(() => {
    setState({})
    setAttempt((n) => n + 1)
  }, [])

  const current = state.id === id ? state : {}
  return { data: current.data, error: current.error, loading: !current.data && !current.error, retry }
}
