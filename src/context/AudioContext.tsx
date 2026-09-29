import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getBook } from '../data/books'
import { usePersistentState } from '../hooks/usePersistentState'
import { userKey } from '../lib/storage'
import type { AudioProgress, Book } from '../types'
import { useAuth } from './AuthContext'
import { usePreferences } from './PreferencesContext'

/**
 * Audiobook playback state shared by the full-screen AudioPlayer and the persistent MiniPlayer.
 * Playback is simulated with a clock (no audio files are bundled); swapping in an <audio> element
 * only requires driving `position` from its `timeupdate` event.
 */
interface AudioValue {
  book: Book | null
  track: number
  position: number
  duration: number
  playing: boolean
  rate: number
  volume: number
  /** Free plan listens to the first chapter only. */
  previewOnly: boolean
  load: (bookId: string, opts?: { autoplay?: boolean; track?: number }) => void
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (seconds: number) => void
  skip: (delta: number) => void
  setTrack: (index: number) => boolean
  setRate: (rate: number) => void
  setVolume: (volume: number) => void
  close: () => void
  savedPosition: (bookId: string) => AudioProgress | undefined
}

const AudioCtx = createContext<AudioValue | null>(null)
const TICK_MS = 250

export function AudioProvider({ children }: { children: ReactNode }) {
  const { user, isPremium } = useAuth()
  const { prefs, setPref } = usePreferences()
  const [saved, setSaved] = usePersistentState<Record<string, AudioProgress>>(
    user ? userKey(user.id, 'audio') : null,
    () => ({}),
  )
  const [bookId, setBookId] = useState<string | null>(null)
  const [track, setTrackState] = useState(0)
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)

  const book = bookId ? (getBook(bookId) ?? null) : null
  const duration = book?.chapters[track]?.audioSeconds ?? 0
  const previewOnly = !isPremium
  const rate = prefs.audioRate
  const volume = prefs.audioVolume

  // Reset the player when the session changes.
  const [sessionUser, setSessionUser] = useState(user?.id)
  if (sessionUser !== user?.id) {
    setSessionUser(user?.id)
    setBookId(null)
    setPlaying(false)
  }

  const persist = useCallback(
    (id: string, t: number, pos: number) =>
      setSaved((all) => ({ ...all, [id]: { bookId: id, track: t, position: pos, updatedAt: new Date().toISOString() } })),
    [setSaved],
  )

  const stateRef = useRef({ bookId, track, position })
  useEffect(() => {
    stateRef.current = { bookId, track, position }
  }, [bookId, track, position])

  // Clock
  useEffect(() => {
    if (!playing || !book) return
    const id = setInterval(() => {
      setPosition((p) => Math.min(duration, p + (TICK_MS / 1000) * rate))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [playing, book, duration, rate])

  // End of track: advance or stop.
  useEffect(() => {
    if (!book || !playing || position < duration) return
    const last = previewOnly ? 0 : book.chapters.length - 1
    if (track < last) {
      setTrackState(track + 1)
      setPosition(0)
    } else {
      setPlaying(false)
    }
  }, [position, duration, book, playing, track, previewOnly])

  // Persist every ~5 seconds of listening.
  const bucket = Math.floor(position / 5)
  useEffect(() => {
    const s = stateRef.current
    if (s.bookId) persist(s.bookId, s.track, s.position)
  }, [bucket, track, persist])

  const load = useCallback<AudioValue['load']>(
    (id, opts = {}) => {
      const b = getBook(id)
      if (!b) return
      if (id !== stateRef.current.bookId) {
        const s = saved[id]
        const t = opts.track ?? s?.track ?? 0
        const safeTrack = !isPremium ? 0 : Math.min(t, b.chapters.length - 1)
        setBookId(id)
        setTrackState(safeTrack)
        setPosition(opts.track === undefined && s && s.track === safeTrack ? s.position : 0)
      }
      if (opts.autoplay) setPlaying(true)
    },
    [saved, isPremium],
  )

  const play = useCallback(() => {
    if (!stateRef.current.bookId) return
    if (duration && position >= duration) setPosition(0)
    setPlaying(true)
  }, [duration, position])
  const pause = useCallback(() => {
    setPlaying(false)
    const s = stateRef.current
    if (s.bookId) persist(s.bookId, s.track, s.position)
  }, [persist])
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play])
  const seek = useCallback((s: number) => setPosition(Math.max(0, Math.min(duration, s))), [duration])
  const skip = useCallback((d: number) => setPosition((p) => Math.max(0, Math.min(duration, p + d))), [duration])

  const setTrack = useCallback(
    (index: number) => {
      if (!book || index < 0 || index >= book.chapters.length) return false
      if (previewOnly && index > 0) return false
      setTrackState(index)
      setPosition(0)
      return true
    },
    [book, previewOnly],
  )

  const setRate = useCallback((r: number) => setPref('audioRate', r), [setPref])
  const setVolume = useCallback((v: number) => setPref('audioVolume', Math.max(0, Math.min(1, v))), [setPref])
  const close = useCallback(() => {
    pause()
    setBookId(null)
  }, [pause])
  const savedPosition = useCallback((id: string) => saved[id], [saved])

  const value = useMemo<AudioValue>(
    () => ({
      book, track, position, duration, playing, rate, volume, previewOnly,
      load, play, pause, toggle, seek, skip, setTrack, setRate, setVolume, close, savedPosition,
    }),
    [book, track, position, duration, playing, rate, volume, previewOnly, load, play, pause, toggle, seek, skip, setTrack, setRate, setVolume, close, savedPosition],
  )
  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
