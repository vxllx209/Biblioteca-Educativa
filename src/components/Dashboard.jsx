import { useEffect, useState } from 'react'
import { backend } from '../lib/backend.js'
import { SUBJECTS, SUBJECT_KEYS } from '../lib/subjects.js'
import { getSeedPdfs } from '../lib/library.js'
import { PAES_SUBJECTS, PAES_SUBJECT_KEYS } from '../lib/paesSubjects.js'
import { getPaesSeedPdfs } from '../lib/paesLibrary.js'

export default function Dashboard({ activeSubject, onSelectSubject, activePaes, onSelectPaes }) {
  const [counts, setCounts] = useState({})
  const [paesCounts, setPaesCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      Promise.all(SUBJECT_KEYS.map((key) => backend.pdfs.countBySubject(key))),
      Promise.all(PAES_SUBJECT_KEYS.map((key) => backend.pdfs.countBySubject(key))),
    ]).then(([subjectResults, paesResults]) => {
      if (!mounted) return
      const nextCounts = {}
      SUBJECT_KEYS.forEach((key, i) => {
        nextCounts[key] = subjectResults[i] + getSeedPdfs(key).length
      })
      const nextPaesCounts = {}
      PAES_SUBJECT_KEYS.forEach((key, i) => {
        nextPaesCounts[key] = paesResults[i] + getPaesSeedPdfs(key).length
      })
      setCounts(nextCounts)
      setPaesCounts(nextPaesCounts)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <div className="dashboard-section-title">Materias</div>
      <div className="subjects-grid">
        {SUBJECT_KEYS.map((key, i) => {
          const subject = SUBJECTS[key]
          const selected = key === activeSubject
          const count = counts[key] ?? 0
          return (
            <button
              key={key}
              className={`subject-card ${selected ? 'selected' : ''}`}
              style={{ '--card-color': subject.color, animationDelay: `${i * 40}ms` }}
              onClick={() => onSelectSubject(key)}
            >
              <span className="subj-icon">
                <i className={`fas ${subject.icon}`}></i>
              </span>
              <h3>{subject.nombre}</h3>
              <p>{loading ? 'Cargando…' : `${count} PDF${count === 1 ? '' : 's'} disponible${count === 1 ? '' : 's'}`}</p>
            </button>
          )
        })}
      </div>

      <div className="dashboard-section-title dashboard-section-title-spaced">PAES</div>
      <div className="subjects-grid">
        {PAES_SUBJECT_KEYS.map((key, i) => {
          const subject = PAES_SUBJECTS[key]
          const selected = key === activePaes
          const count = paesCounts[key] ?? 0
          return (
            <button
              key={key}
              className={`subject-card ${selected ? 'selected' : ''}`}
              style={{ '--card-color': subject.color, animationDelay: `${i * 40}ms` }}
              onClick={() => onSelectPaes(key)}
            >
              <span className="subj-icon">
                <i className={`fas ${subject.icon}`}></i>
              </span>
              <h3>{subject.nombre}</h3>
              <p>{loading ? 'Cargando…' : `${count} PDF${count === 1 ? '' : 's'} disponible${count === 1 ? '' : 's'}`}</p>
            </button>
          )
        })}
      </div>
    </>
  )
}
