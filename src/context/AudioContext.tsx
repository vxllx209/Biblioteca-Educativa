import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getBook, trackUrls } from '../data/books'
import { usePersistentState } from '../hooks/usePersistentState'
import { userKey } from '../lib/storage'
import type { AudioProgress, Book } from '../types'
import { useAuth } from './AuthContext'
import { usePreferences } from './PreferencesContext'
import { useToast } from './ToastContext'

/**
 * Audiobook playback shared by the full-screen AudioPlayer and the persistent MiniPlayer.
 * Streams the LibriVox MP3 recordings through a single HTMLAudioElement.
 */
export type AudioStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AudioValue {
  book: Book | null
  track: number
  position: number
  duration: number
  playing: boolean
  status: AudioStatus
  rate: number
  volume: number
  /** Free plan listens to the first track only. */
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
}

const AudioCtx = createContext<AudioValue | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const { user, isPremium } = useAuth()
  const { prefs, setPref } = usePreferences()
  const toast = useToast()
  const [saved, setSaved] = usePersistentState<Record<string, AudioProgress>>(user ? userKey(user.id, 'audio.v2') : null, () => ({}))
  const [el] = useState<HTMLAudioElement | null>(() => (typeof Audio === 'undefined' ? null : new Audio()))
  const [bookId, setBookId] = useState<string | null>(null)
  const [track, setTrackState] = useState(0)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [status, setStatus] = useState<AudioStatus>('idle')
  const pendingSeek = useRef(0)
  /** Remaining fallback URLs for the current track, and whether playback was requested. */
  const fallbacks = useRef<string[]>([])
  const wantPlay = useRef(false)
  const restored = useRef(false)
  const [lastBook, setLastBook] = usePersistentState<string | null>(user ? userKey(user.id, 'audio.last') : null, () => null)

  const book = bookId ? (getBook(bookId) ?? null) : null
  const previewOnly = !isPremium
  const rate = prefs.audioRate
  const volume = prefs.audioVolume

  const state = useRef({ bookId, track, previewOnly, saved })
  useEffect(() => {
    state.current = { bookId, track, previewOnly, saved }
  }, [bookId, track, previewOnly, saved])

  const persist = useCallback(
    (id: string, t: number, pos: number) =>
      setSaved((all) => ({ ...all, [id]: { bookId: id, track: t, position: pos, updatedAt: new Date().toISOString() } })),
    [setSaved],
  )

  const startTrack = useCallback(
    (b: Book, index: number, at: number, autoplay: boolean) => {
      if (!el) return
      window.speechSynthesis?.cancel()
      setTrackState(index)
      setPosition(at)
      setDuration(b.audio?.tracks[index]?.seconds ?? 0)
      setStatus('loading')
      pendingSeek.current = at
      const [first, ...rest] = trackUrls(b, index)
      fallbacks.current = rest
      wantPlay.current = autoplay
      el.src = first
      el.load()
      if (autoplay)
        el.play().catch((e: Error) => {
          if (e.name !== 'AbortError' && e.name !== 'NotSupportedError') setPlaying(false)
        })
    },
    [el],
  )

  // Wire the element's events once.
  useEffect(() => {
    if (!el) return
    el.preload = 'metadata'
    const on = <K extends keyof HTMLMediaElementEventMap>(type: K, fn: () => void) => {
      el.addEventListener(type, fn)
      return () => el.removeEventListener(type, fn)
    }
    const offs = [
      on('loadedmetadata', () => {
        if (isFinite(el.duration)) setDuration(el.duration)
        if (pendingSeek.current) {
          el.currentTime = Math.min(pendingSeek.current, Math.max(0, el.duration - 1))
          pendingSeek.current = 0
        }
        setStatus('ready')
      }),
      on('timeupdate', () => setPosition(el.currentTime)),
      on('play', () => {
        window.speechSynthesis?.cancel()
        wantPlay.current = true
        setPlaying(true)
      }),
      on('pause', () => {
        if (!el.error) wantPlay.current = false
        setPlaying(false)
      }),
      on('waiting', () => setStatus('loading')),
      on('playing', () => setStatus('ready')),
      on('canplay', () => setStatus('ready')),
      on('error', () => {
        if (!el.getAttribute('src')) return
        // A mirror failed: try the next copy of the same track, keeping the position.
        const next = fallbacks.current.shift()
        if (next) {
          pendingSeek.current = pendingSeek.current || el.currentTime
          el.src = next
          el.load()
          if (wantPlay.current) el.play().catch(() => undefined)
          return
        }
        setStatus('error')
        setPlaying(false)
      }),
      on('ended', () => {
        const s = state.current
        const b = s.bookId ? getBook(s.bookId) : undefined
        if (!b?.audio) return
        const last = s.previewOnly ? 0 : b.audio.tracks.length - 1
        if (s.track < last) startTrack(b, s.track + 1, 0, true)
        else persist(b.id, s.track, 0)
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [el, startTrack, persist])

  useEffect(() => {
    if (status === 'error') toast('No se pudo reproducir el audio. Revisa tu conexión a internet.', 'error')
  }, [status, toast])

  useEffect(() => {
    if (el) el.playbackRate = rate
  }, [el, rate, status])
  useEffect(() => {
    if (el) el.volume = volume
  }, [el, volume])

  // Stop and reset when the session changes.
  useEffect(() => {
    if (!el) return
    el.pause()
    el.removeAttribute('src')
    setBookId(null)
    setStatus('idle')
  }, [el, user?.id])

  // Remember the open audiobook so the mini-player comes back (paused) after a reload.
  useEffect(() => {
    if (bookId) setLastBook(bookId)
  }, [bookId, setLastBook])
  useEffect(() => {
    if (restored.current || !lastBook || bookId) return
    restored.current = true
    const b = getBook(lastBook)
    const resume = saved[lastBook]
    if (!b?.audio) return
    const index = previewOnly ? 0 : Math.min(resume?.track ?? 0, b.audio.tracks.length - 1)
    setBookId(b.id)
    startTrack(b, index, resume && resume.track === index ? resume.position : 0, false)
  }, [lastBook, bookId, saved, previewOnly, startTrack])

  // Persist every ~5 seconds of listening.
  const bucket = Math.floor(position / 5)
  useEffect(() => {
    if (bookId && status !== 'loading') persist(bookId, track, el?.currentTime ?? 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, track, bookId])

  const load = useCallback<AudioValue['load']>(
    (id, opts = {}) => {
      const b = getBook(id)
      if (!b?.audio || !el) return
      restored.current = true // an explicit load wins over restoring the last session
      const s = state.current
      if (id === s.bookId && opts.track === undefined) {
        if (opts.autoplay) el.play().catch(() => setPlaying(false))
        return
      }
      const resume = s.saved[id]
      const wanted = opts.track ?? resume?.track ?? 0
      const index = s.previewOnly ? 0 : Math.min(wanted, b.audio.tracks.length - 1)
      const at = opts.track === undefined && resume && resume.track === index ? resume.position : 0
      setBookId(id)
      startTrack(b, index, at, !!opts.autoplay)
    },
    [el, startTrack],
  )

  const play = useCallback(() => {
    if (!el || !bookId) return
    wantPlay.current = true
    if (status === 'error') {
      const b = getBook(bookId)
      if (b) startTrack(b, track, position, true)
      return
    }
    el.play().catch(() => setPlaying(false))
  }, [el, bookId, status, track, position, startTrack])

  const pause = useCallback(() => {
    el?.pause()
    if (bookId && el) persist(bookId, track, el.currentTime)
  }, [el, bookId, track, persist])

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play])

  const seek = useCallback(
    (s: number) => {
      if (!el) return
      const target = Math.max(0, Math.min(duration || s, s))
      if (el.readyState >= 1) el.currentTime = target
      else pendingSeek.current = target
      setPosition(target)
    },
    [el, duration],
  )
  const skip = useCallback((d: number) => seek((el?.currentTime ?? position) + d), [el, seek, position])

  const setTrack = useCallback(
    (index: number) => {
      if (!book?.audio || index < 0 || index >= book.audio.tracks.length) return false
      if (previewOnly && index > 0) return false
      startTrack(book, index, 0, playing || status === 'loading')
      return true
    },
    [book, previewOnly, startTrack, playing, status],
  )

  const setRate = useCallback((r: number) => setPref('audioRate', r), [setPref])
  const setVolume = useCallback((v: number) => setPref('audioVolume', Math.max(0, Math.min(1, v))), [setPref])

  const close = useCallback(() => {
    pause()
    setLastBook(null)
    if (el) {
      el.removeAttribute('src')
      el.load()
    }
    setBookId(null)
    setStatus('idle')
  }, [pause, el, setLastBook])

  // Lock-screen / hardware media controls.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !book?.audio) return
    const t = book.audio.tracks[track]
    navigator.mediaSession.metadata = new MediaMetadata({ title: t?.title ?? book.title, artist: book.author, album: book.title })
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => play()],
      ['pause', () => pause()],
      ['seekbackward', () => skip(-10)],
      ['seekforward', () => skip(10)],
      ['previoustrack', () => setTrack(track - 1)],
      ['nexttrack', () => setTrack(track + 1)],
    ]
    handlers.forEach(([a, h]) => {
      try {
        navigator.mediaSession.setActionHandler(a, h)
      } catch {
        /* unsupported action */
      }
    })
  }, [book, track, play, pause, skip, setTrack])

  const value = useMemo<AudioValue>(
    () => ({
      book, track, position, duration, playing, status, rate, volume, previewOnly,
      load, play, pause, toggle, seek, skip, setTrack, setRate, setVolume, close,
    }),
    [book, track, position, duration, playing, status, rate, volume, previewOnly, load, play, pause, toggle, seek, skip, setTrack, setRate, setVolume, close],
  )
  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}
