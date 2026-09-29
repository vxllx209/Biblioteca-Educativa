import {
  CircleAlert,
  ExternalLink,
  Gauge,
  LoaderCircle,
  Lock,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAudio } from '../context/AudioContext'
import { totalAudioSeconds } from '../data/books'
import { cn, formatTime } from '../lib/format'
import { BookCover } from './BookCover'
import { PremiumGate } from './PremiumGate'

const RATES = [0.75, 1, 1.25, 1.5, 2]

export function AudioPlayer() {
  const a = useAudio()
  const [gate, setGate] = useState(false)
  const [lastVolume, setLastVolume] = useState(0.8)
  const listRef = useRef<HTMLOListElement>(null)

  // Keep the current track visible inside the list (without scrolling the page).
  useEffect(() => {
    const list = listRef.current
    const item = list?.children[a.track] as HTMLElement | undefined
    if (list && item) list.scrollTop = item.offsetTop - 8
  }, [a.track, a.book])

  if (!a.book?.audio) return null
  const { book, track, position, duration } = a
  const tracks = book.audio!.tracks
  const current = tracks[track]
  const fill = duration ? (position / duration) * 100 : 0
  const loading = a.status === 'loading'

  const goTrack = (i: number) => {
    if (!a.setTrack(i) && a.previewOnly && i > 0 && i < tracks.length) setGate(true)
  }
  const nextRate = () => a.setRate(RATES[(RATES.indexOf(a.rate) + 1) % RATES.length] ?? 1)
  const VolumeIcon = a.volume === 0 ? VolumeX : a.volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-14">
      <div className="mx-auto w-full max-w-[240px] sm:max-w-[280px] lg:max-w-none">
        <div className={cn('overflow-hidden rounded-[18px] shadow-pop transition-transform duration-500', a.playing && 'scale-[1.02]')}>
          <BookCover book={book} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="text-center lg:text-left">
          <p className="text-sm font-medium text-secondary">
            Pista {track + 1} de {tracks.length} · {current?.title}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-[28px]">{book.title}</h1>
          <p className="mt-1 text-[15px] text-muted">{book.author}</p>
        </div>

        {a.status === 'error' && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl bg-error-soft px-4 py-3 text-sm text-error">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>No se pudo cargar el audio. Necesitas conexión a internet para escuchar. Pulsa reproducir para reintentar.</span>
          </div>
        )}

        <div className="mt-8">
          <label htmlFor="audio-seek" className="sr-only">
            Posición de reproducción
          </label>
          <input
            id="audio-seek"
            type="range"
            min={0}
            max={Math.max(1, Math.floor(duration))}
            step={1}
            value={Math.floor(position)}
            onChange={(e) => a.seek(Number(e.target.value))}
            className="range"
            style={{ ['--fill' as string]: `${fill}%` }}
            aria-valuetext={`${formatTime(position)} de ${formatTime(duration)}`}
          />
          <div className="flex justify-between text-xs font-medium text-muted tabular-nums">
            <span>{formatTime(position)}</span>
            <span>-{formatTime(Math.max(0, duration - position))}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 sm:gap-4">
          <button onClick={() => goTrack(track - 1)} disabled={track === 0} className="icon-btn border-transparent disabled:opacity-40" aria-label="Pista anterior">
            <SkipBack className="size-5" />
          </button>
          <button onClick={() => a.skip(-10)} className="icon-btn relative size-12 border-transparent" aria-label="Retroceder 10 segundos">
            <RotateCcw className="size-6" strokeWidth={1.75} />
            <span className="absolute text-[9px] font-bold">10</span>
          </button>
          <button
            onClick={a.toggle}
            className="grid size-16 place-items-center rounded-full bg-primary text-white shadow-pop transition-all duration-200 hover:bg-primary-hover active:scale-95 sm:size-[72px]"
            aria-label={a.playing ? 'Pausar' : 'Reproducir'}
          >
            {loading && a.playing ? (
              <LoaderCircle className="size-7 animate-spin" />
            ) : a.playing ? (
              <Pause className="size-7 fill-current" />
            ) : (
              <Play className="ml-1 size-7 fill-current" />
            )}
          </button>
          <button onClick={() => a.skip(10)} className="icon-btn relative size-12 border-transparent" aria-label="Avanzar 10 segundos">
            <RotateCw className="size-6" strokeWidth={1.75} />
            <span className="absolute text-[9px] font-bold">10</span>
          </button>
          <button
            onClick={() => goTrack(track + 1)}
            disabled={track >= tracks.length - 1}
            className="icon-btn border-transparent disabled:opacity-40"
            aria-label="Pista siguiente"
          >
            <SkipForward className="size-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={nextRate} className="btn-secondary min-h-11 px-4 tabular-nums" aria-label={`Velocidad de reproducción ${a.rate}x. Cambiar`}>
            <Gauge className="size-4" aria-hidden />
            {a.rate}x
          </button>
          <div className="flex flex-1 items-center gap-1">
            <button
              onClick={() => {
                if (a.volume > 0) {
                  setLastVolume(a.volume)
                  a.setVolume(0)
                } else a.setVolume(lastVolume || 0.8)
              }}
              className="icon-btn border-transparent"
              aria-label={a.volume === 0 ? 'Activar sonido' : 'Silenciar'}
            >
              <VolumeIcon className="size-5" />
            </button>
            <label htmlFor="audio-volume" className="sr-only">
              Volumen
            </label>
            <input
              id="audio-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={a.volume}
              onChange={(e) => a.setVolume(Number(e.target.value))}
              className="range max-w-48"
              style={{ ['--fill' as string]: `${a.volume * 100}%` }}
              aria-valuetext={`${Math.round(a.volume * 100)}%`}
            />
          </div>
        </div>

        <section className="mt-8" aria-labelledby="tracks-title">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="tracks-title" className="text-base font-semibold text-text">
              Pistas
            </h2>
            <span className="text-xs text-muted">
              {tracks.length} pistas · {formatTime(totalAudioSeconds(book))}
            </span>
          </div>
          <ol ref={listRef} className="relative max-h-80 space-y-2 overflow-y-auto pr-1">
            {tracks.map((t, i) => {
              const locked = a.previewOnly && i > 0
              return (
                <li key={t.file}>
                  <button
                    onClick={() => goTrack(i)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left text-sm transition-colors duration-200',
                      i === track ? 'border-line-active bg-softer text-accent' : 'border-line bg-surface text-text hover:border-line-active',
                    )}
                    aria-current={i === track ? 'true' : undefined}
                  >
                    <span className="w-6 text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
                    <span className="flex-1 font-medium">{t.title}</span>
                    {locked ? (
                      <Lock className="size-4 text-muted" aria-label="Premium" />
                    ) : (
                      <span className="text-xs text-muted tabular-nums">{formatTime(t.seconds)}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
          {a.previewOnly && (
            <p className="mt-3 text-xs text-muted">Con el plan Gratis puedes escuchar la primera pista como vista previa.</p>
          )}
          <a
            href={`https://archive.org/details/${book.audio!.archiveId}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent"
          >
            Grabación de LibriVox, voluntarios · dominio público <ExternalLink className="size-3" aria-hidden />
          </a>
        </section>
      </div>
      <PremiumGate open={gate} onClose={() => setGate(false)} message="Escucha el audiolibro completo, sin límites, con un plan Premium." />
    </div>
  )
}
