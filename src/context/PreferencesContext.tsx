import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { DEFAULT_PREFERENCES } from '../data/mock'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { usePersistentState } from '../hooks/usePersistentState'
import { setLang } from '../i18n'
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
  // Set while rendering (not in an effect) so everything rendered below already uses it.
  setLang(prefs.language === 'en' ? 'en' : 'es')

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

/** Remounts the screens when the language changes, so every string is rendered again in the new language. */
export function LanguageBoundary({ children }: { children: ReactNode }) {
  const { prefs } = usePreferences()
  return <Fragment key={prefs.language}>{children}</Fragment>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
