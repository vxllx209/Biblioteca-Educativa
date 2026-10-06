import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { storage, userKey } from '../lib/storage'
import { supabase } from '../lib/supabase'
import { usePersistentState } from './usePersistentState'

const SAVE_DELAY = 800

/**
 * Per-user state kept in localStorage (instant, works offline) and mirrored to the
 * Supabase `user_state` table so it follows the user across devices.
 *
 * On sign-in the remote copy wins, unless this device has changes that never reached
 * the server (tracked with a "dirty" flag), in which case the local copy is pushed.
 * Without Supabase configured it behaves exactly like usePersistentState.
 */
export function useSyncedState<T>(uid: string | null, name: string, initial: () => T): [T, Dispatch<SetStateAction<T>>] {
  const localKey = uid ? userKey(uid, name) : null
  const [state, setState] = usePersistentState<T>(localKey, initial)
  /** User whose remote copy has been loaded; saving waits for it so we never overwrite the server with defaults. */
  const [readyFor, setReadyFor] = useState<string | null>(null)
  const lastSynced = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase || !uid) return
    let cancelled = false
    const dirtyKey = `${userKey(uid, name)}:dirty`
    supabase
      .from('user_state')
      .select('value')
      .eq('user_id', uid)
      .eq('key', name)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error) return
        if (data && !storage.get(dirtyKey, false)) {
          lastSynced.current = JSON.stringify(data.value)
          setState(data.value as T)
        } else {
          lastSynced.current = null
        }
        setReadyFor(uid)
      })
    return () => {
      cancelled = true
    }
  }, [uid, name, setState])

  useEffect(() => {
    if (!supabase || !uid || readyFor !== uid) return
    const json = JSON.stringify(state)
    if (json === lastSynced.current) return
    const dirtyKey = `${userKey(uid, name)}:dirty`
    storage.set(dirtyKey, true)
    const client = supabase
    const timer = setTimeout(() => {
      client
        .from('user_state')
        .upsert({ user_id: uid, key: name, value: state, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) return
          lastSynced.current = json
          storage.remove(dirtyKey)
        })
    }, SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [uid, name, state, readyFor])

  return [state, setState]
}
