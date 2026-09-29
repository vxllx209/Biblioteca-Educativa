import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { storage } from '../lib/storage'

/**
 * useState backed by localStorage. When `key` changes (e.g. another user signs in)
 * the state is reloaded from the new key. A null key keeps the state in memory only.
 */
export function usePersistentState<T>(key: string | null, initial: () => T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => (key ? storage.get(key, initial()) : initial()))
  const [loadedKey, setLoadedKey] = useState(key)

  if (key !== loadedKey) {
    setLoadedKey(key)
    setState(key ? storage.get(key, initial()) : initial())
  }

  useEffect(() => {
    if (key) storage.set(key, state)
  }, [key, state])

  return [state, setState]
}
