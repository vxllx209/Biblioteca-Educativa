import { useCallback, useEffect, useState } from 'react'

/** Loads data from an async source and reloads it on demand (after a mutation). */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true })
  const [version, setVersion] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps)

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    run().then(
      (data) => alive && setState({ data, loading: false }),
      (e: unknown) => alive && setState({ error: e instanceof Error ? e.message : 'Error inesperado', loading: false }),
    )
    return () => {
      alive = false
    }
  }, [run, version])

  return { ...state, reload: useCallback(() => setVersion((v) => v + 1), []) }
}
