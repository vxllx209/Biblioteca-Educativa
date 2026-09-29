import { Gauge, Lock, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { useAudio } from '../context/AudioContext'
import { cn, formatTime } from '../lib/format'
import { BookCover } from './BookCover'
import { PremiumGate } from './PremiumGate'

const RATES = [0.75, 1, 1.25, 1.5, 2]

export function AudioPlayer() {
  const a = useAudio()
  const [gate, setGate] = useState(false)
  const [lastVolume, setLastVolume] = useState(0.8)
  if (!a.book) return null
  const { book, track, position, duration } = a
  const chapter = book.chapters[track]
  const fill = duration ? (position / duration) * 100 : 0
  // Approximate "now narrating" paragraph from position within the track.
  const paragraphIndex = Math.min(chapter.paragraphs.length - 1, Math.floor((position / Math.max(1, duration)) * chapter.paragraphs.length))

  const goTrack = (i: number) => {
    if (!a.setTrack(i) && a.previewOnly && i > 0 && i < book.chapters.length) setGate(true)
  }
  const nextRate = () => a.setRate(RATES[(RATES.indexOf(a.rate) + 1) % RATES.length] ?? 1)
  const VolumeIcon = a.volume === 0 ? VolumeX : a.volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-14">
      <div className="mx-auto w-full max-w-[260px] sm:max-w-[300px] lg:max-w-none">
        <div className="overflow-hidden rounded-[18px] shadow-pop">
          <BookCover book={book} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="text-center lg:text-left">
          <p className="text-sm font-medium text-secondary">{chapter.title}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-[28px]">{book.title}</h1>
          <p className="mt-1 text-[15px] text-muted">{book.author}</p>
        </div>

        <div className="mt-8">
          <label htmlFor="audio-seek" className="sr-only">
            Posición de reproducción
          </label>
          <input
            id="audio-seek"
            type="range"
            min={0}
            max={duration}
            step={1}
            value={Math.floor(position)}
            onChange={(e) => a.seek(Number(e.target.value))}
            className="range"
            style={{ ['--fill' as string]: `${fill}%` }}
            aria-valuetext={`${formatTime(position)} de ${formatTime(duration)}`}
          />
          <div className="flex justify-between text-xs font-medium text-muted tabular-nums">
            <span>{formatTime(position)}</span>
            <span>-{formatTime(duration - position)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 sm:gap-4">
          <button onClick={() => goTrack(track - 1)} disabled={track === 0} className="icon-btn border-transparent disabled:opacity-40" aria-label="Capítulo anterior">
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
            {a.playing ? <Pause className="size-7 fill-current" /> : <Play className="ml-1 size-7 fill-current" />}
          </button>
          <button onClick={() => a.skip(10)} className="icon-btn relative size-12 border-transparent" aria-label="Avanzar 10 segundos">
            <RotateCw className="size-6" strokeWidth={1.75} />
            <span className="absolute text-[9px] font-bold">10</span>
          </button>
          <button
            onClick={() => goTrack(track + 1)}
            disabled={track >= book.chapters.length - 1}
            className="icon-btn border-transparent disabled:opacity-40"
            aria-label="Capítulo siguiente"
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

        <section className="card mt-8 p-5" aria-labelledby="now-narrating">
          <h2 id="now-narrating" className="text-xs font-semibold tracking-wide text-secondary uppercase">
            Narrando ahora
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-text">{chapter.paragraphs[paragraphIndex]}</p>
        </section>

        <section className="mt-6" aria-labelledby="chapters-title">
          <h2 id="chapters-title" className="mb-3 text-base font-semibold text-text">
            Capítulos
          </h2>
          <ol className="space-y-2">
            {book.chapters.map((c, i) => {
              const locked = a.previewOnly && i > 0
              return (
                <li key={c.title}>
                  <button
                    onClick={() => goTrack(i)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-2 text-left text-sm transition-colors duration-200',
                      i === track ? 'border-line-active bg-softer text-accent' : 'border-line bg-surface text-text hover:border-line-active',
                    )}
                    aria-current={i === track ? 'true' : undefined}
                  >
                    <span className="w-5 text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
                    <span className="flex-1 font-medium">{c.title}</span>
                    {locked ? <Lock className="size-4 text-muted" aria-label="Premium" /> : <span className="text-xs text-muted tabular-nums">{formatTime(c.audioSeconds)}</span>}
                  </button>
                </li>
              )
            })}
          </ol>
          {a.previewOnly && (
            <p className="mt-3 text-xs text-muted">Con el plan Gratis puedes escuchar el primer capítulo como vista previa.</p>
          )}
        </section>
      </div>
      <PremiumGate open={gate} onClose={() => setGate(false)} message="Escucha el audiolibro completo, sin límites, con un plan Premium." />
    </div>
  )
}
