import { useState } from 'react'
import styles from './Truco.module.css'

const MAX_SCORE = 30
const HALF_SCORE = 15

type TeamKey = 'nosotros' | 'ellos'

const DEFAULT_NAMES: Record<TeamKey, string> = {
  nosotros: 'Nosotros',
  ellos: 'Ellos',
}

/* ── Caja de un grupo de 5 palitos ───────────────────────────────────────── */

function GrupoBox({ filled, active }: { filled: number; active: boolean }) {
  const W = 48, H = 56, PAD = 9
  const step = (W - PAD * 2) / 3.6

  return (
    <svg
      className={[
        styles.grupoBox,
        active ? styles.grupoBoxActive : '',
        filled >= 5 ? styles.grupoBoxFull : '',
      ].join(' ')}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-label={`${filled} de 5`}
    >
      <rect x={4} y={4} width={W - 8} height={H - 8} rx={3} fill="none" strokeWidth="2.2" />
      {Array.from({ length: Math.min(filled, 4) }, (_, i) => {
        const x = PAD + i * step
        return (
          <line
            key={`v${i}`}
            x1={x + 3} y1={PAD - 2}
            x2={x} y2={H - PAD + 2}
            strokeWidth="2.5" strokeLinecap="round"
          />
        )
      })}
      {filled >= 5 && (
        <line x1={3} y1={H - 5} x2={W - 3} y2={5} strokeWidth="2.5" strokeLinecap="round" />
      )}
    </svg>
  )
}

/* ── Columna de palitos (malas + buenas) ─────────────────────────────────── */

function PalitosVertical({ score }: { score: number }) {
  const enBuenas = score >= HALF_SCORE
  const activeGroup = score < HALF_SCORE
    ? Math.min(2, Math.floor(score / 5))
    : 3 + Math.min(2, Math.floor((score - HALF_SCORE) / 5))

  return (
    <div className={styles.palitoVertical}>
      <div className={`${styles.palitoSection} ${!enBuenas ? styles.palitoSectionActive : ''}`}>
        {[0, 1, 2].map(g => (
          <GrupoBox
            key={g}
            filled={Math.max(0, Math.min(5, score - g * 5))}
            active={activeGroup === g}
          />
        ))}
      </div>
      <div className={styles.sectionDivider} />
      <div className={`${styles.palitoSection} ${enBuenas ? styles.palitoSectionActive : ''}`}>
        {[0, 1, 2].map(g => (
          <GrupoBox
            key={g}
            filled={Math.max(0, Math.min(5, score - HALF_SCORE - g * 5))}
            active={activeGroup === 3 + g}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Ornamento fileteado SVG ─────────────────────────────────────────────── */

function Ornamento({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 20" fill="none" aria-hidden="true">
      <path d="M0 10 Q25 2 50 10 Q75 18 100 10 Q125 2 150 10 Q175 18 200 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="10" r="3" fill="currentColor" />
      <circle cx="50" cy="10" r="2" fill="currentColor" />
      <circle cx="150" cy="10" r="2" fill="currentColor" />
      <path d="M88 10 L95 4 L102 10 L95 16 Z" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

/* ── Componente principal ────────────────────────────────────────────────── */

export default function Truco() {
  const [names, setNames] = useState<Record<TeamKey, string>>(DEFAULT_NAMES)
  const [scores, setScores] = useState<Record<TeamKey, number>>({ nosotros: 0, ellos: 0 })

  const winner: TeamKey | null =
    scores.nosotros >= MAX_SCORE ? 'nosotros' :
    scores.ellos >= MAX_SCORE ? 'ellos' :
    null

  function add(team: TeamKey) {
    if (winner) return
    setScores(prev => ({ ...prev, [team]: Math.min(MAX_SCORE, prev[team] + 1) }))
  }

  function sub(team: TeamKey) {
    if (winner) return
    setScores(prev => ({ ...prev, [team]: Math.max(0, prev[team] - 1) }))
  }

  function reset() {
    setScores({ nosotros: 0, ellos: 0 })
    setNames(DEFAULT_NAMES)
  }

  const TEAMS: TeamKey[] = ['nosotros', 'ellos']

  return (
    <div className={styles.root}>
      <main className="page">
        {/* ── Cartel ── */}
        <header className={styles.cartel}>
          <Ornamento className={styles.ornTop} />
          <p className={styles.cartelEyebrow}>Anotador Criollo</p>
          <h1 className={styles.cartelTitle}>Truco</h1>
          <Ornamento className={styles.ornBottom} />
        </header>

        {/* ── Tablero ── */}
        <section className={styles.tablero} aria-label="Marcador">
          {TEAMS.map(k => (
            <article key={k} className={`${styles.panel} ${winner === k ? styles.panelWinner : ''}`}>

              {/* nombre editable */}
              <div className={styles.nombreWrap}>
                <input
                  className={styles.nombreInput}
                  value={names[k]}
                  maxLength={20}
                  aria-label={`Nombre del equipo ${DEFAULT_NAMES[k]}`}
                  onChange={e => setNames(prev => ({ ...prev, [k]: e.target.value }))}
                />
                <span className={styles.nombreUnderline} aria-hidden="true" />
              </div>

              {/* puntaje */}
              <div className={styles.puntajeWrap}>
                <span className={styles.puntaje}>{scores[k]}</span>
                <span className={styles.puntajeDe}>/30</span>
              </div>

              {/* palitos verticales */}
              <PalitosVertical score={scores[k]} />

              {/* botones */}
              <div className={styles.botones} role="group" aria-label={`Puntos para ${names[k]}`}>
                <button className={styles.btnMenos} onClick={() => sub(k)} aria-label="Restar 1">−1</button>
                <button className={styles.btnMas} onClick={() => add(k)} aria-label="Sumar 1">+1</button>
              </div>

              {/* corona ganador */}
              {winner === k && (
                <div className={styles.coronaWrap} role="status">
                  <span className={styles.corona} aria-label="Ganador">♛</span>
                  <span className={styles.coronaText}>¡Ganó!</span>
                </div>
              )}
            </article>
          ))}
        </section>

        {/* ── Footer ── */}
        <footer className={styles.pie}>
          <Ornamento className={styles.ornPie} />
          <button className={styles.btnReset} onClick={reset}>
            Nueva partida
          </button>
        </footer>
      </main>
    </div>
  )
}
