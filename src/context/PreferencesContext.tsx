import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { DEFAULT_PREFERENCES } from '../data/mock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePersistentState } from '../hooks/usePersistentState'
import type { Preferences } from '../types'

interface PreferencesValue {
  prefs: Preferences
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  resetPrefs: () => void
  isDark: boolean
}

const PreferencesContext = createContext<PreferencesValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [stored, setPrefs] = usePersistentState<Preferences>('prefs', () => DEFAULT_PREFERENCES)
  const prefs = useMemo(() => ({ ...DEFAULT_PREFERENCES, ...stored }), [stored])
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const isDark = prefs.theme === 'dark' || (prefs.theme === 'auto' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#18201D' : '#285B4A')
  }, [isDark])

  useEffect(() => {
    document.documentElement.lang = prefs.language
  }, [prefs.language])

  const setPref = useCallback<PreferencesValue['setPref']>(
    (key, value) => setPrefs((p) => ({ ...p, [key]: value })),
    [setPrefs],
  )
  const resetPrefs = useCallback(() => setPrefs(DEFAULT_PREFERENCES), [setPrefs])

  const value = useMemo(() => ({ prefs, setPref, resetPrefs, isDark }), [prefs, setPref, resetPrefs, isDark])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
