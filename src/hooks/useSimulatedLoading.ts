import { useEffect, useState } from 'react'

/** Short artificial delay so skeleton states are visible, as they would be with a real API. */
export function useSimulatedLoading(deps: unknown[] = [], ms = 450) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return loading
}
