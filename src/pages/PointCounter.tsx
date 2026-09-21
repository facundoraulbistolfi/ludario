import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import styles from './PointCounter.module.css'

interface Player {
  id: string
  name: string
  color: string
  score: number
}

const COOKIE_NAME = 'ludario_point_counter_v2'
const STORAGE_KEYS = ['ludario-point-counter-state-v1', 'tabletop-point-counter-state-v1']
const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const MAX_NAME_LENGTH = 18
const PALETTE = ['#d52b77', '#3166e8', '#e86f2c', '#23a36d', '#8c4ed8', '#d19a20']
const DEFAULT_PLAYERS: Player[] = [
  { id: 'dai', name: 'Dai', color: PALETTE[0], score: 5 },
  { id: 'ali', name: 'Ali', color: PALETTE[1], score: 5 },
  { id: 'facu', name: 'Facu', color: PALETTE[2], score: 5 },
]

function createPlayerId() {
  if ('randomUUID' in crypto) return crypto.randomUUID()
  return `player_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizePlayers(value: unknown): Player[] | null {
  if (!Array.isArray(value)) return null
  const players = value.slice(0, MAX_PLAYERS).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return []
    const candidate = raw as Partial<Player>
    const score = Number(candidate.score)
    return [{
      id: typeof candidate.id === 'string' && candidate.id ? candidate.id : createPlayerId(),
      name: String(candidate.name ?? '').trim().slice(0, MAX_NAME_LENGTH) || `Jugador ${index + 1}`,
      color: typeof candidate.color === 'string' && /^#[0-9a-f]{6}$/i.test(candidate.color)
        ? candidate.color.toLowerCase()
        : PALETTE[index % PALETTE.length],
      score: Number.isFinite(score) ? Math.trunc(score) : 0,
    }]
  })
  return players.length >= MIN_PLAYERS ? players : null
}

function loadPlayers() {
  try {
    const prefix = `${COOKIE_NAME}=`
    const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(prefix))
    if (cookie) {
      const parsed = JSON.parse(decodeURIComponent(cookie.slice(prefix.length))) as { players?: unknown }
      const players = normalizePlayers(parsed.players)
      if (players) return players
    }
  } catch {
    // Si la cookie quedó corrupta, se intenta migrar el estado anterior.
  }

  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as { players?: unknown }
      const players = normalizePlayers(parsed.players)
      if (players) return players
    } catch {
      // Continúa con la siguiente fuente disponible.
    }
  }
  return DEFAULT_PLAYERS.map(player => ({ ...player }))
}

function persistPlayers(players: Player[]) {
  const value = encodeURIComponent(JSON.stringify({ players }))
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
  try {
    STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
  } catch {
    // La cookie sigue siendo la fuente principal.
  }
}

function shadeColor(hex: string, percent: number) {
  const number = Number.parseInt(hex.slice(1), 16)
  const amount = Math.round(2.55 * percent)
  const clamp = (value: number) => Math.max(0, Math.min(255, value))
  const channels = [clamp((number >> 16) + amount), clamp(((number >> 8) & 255) + amount), clamp((number & 255) + amount)]
  return `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.12.61.65 1.05 1.27 1.06H21v4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
    </svg>
  )
}

export default function PointCounter() {
  const [players, setPlayers] = useState<Player[]>(loadPlayers)
  const [scorePlayerId, setScorePlayerId] = useState<string | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [customAdd, setCustomAdd] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<Player[]>([])
  const [resetOpen, setResetOpen] = useState(false)
  const [bumpedPlayerId, setBumpedPlayerId] = useState<string | null>(null)
  const scoreInputRef = useRef<HTMLInputElement>(null)
  const firstNameInputRef = useRef<HTMLInputElement>(null)
  const activePlayer = useMemo(() => players.find(player => player.id === scorePlayerId) ?? null, [players, scorePlayerId])

  useEffect(() => persistPlayers(players), [players])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    if (!activePlayer) return
    requestAnimationFrame(() => { scoreInputRef.current?.focus(); scoreInputRef.current?.select() })
  }, [activePlayer])

  useEffect(() => {
    if (settingsOpen) requestAnimationFrame(() => firstNameInputRef.current?.focus())
  }, [settingsOpen])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setScorePlayerId(null)
      setSettingsOpen(false)
      setResetOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  function animateScore(playerId: string) {
    setBumpedPlayerId(null)
    requestAnimationFrame(() => setBumpedPlayerId(playerId))
    window.setTimeout(() => setBumpedPlayerId(current => current === playerId ? null : current), 240)
  }

  function setScore(playerId: string, score: number) {
    if (!Number.isFinite(score)) return
    setPlayers(current => current.map(player => player.id === playerId ? { ...player, score: Math.trunc(score) } : player))
    animateScore(playerId)
  }

  function changeScore(playerId: string, delta: number) {
    setPlayers(current => current.map(player => player.id === playerId ? { ...player, score: player.score + delta } : player))
    animateScore(playerId)
    navigator.vibrate?.(18)
  }

  function openScoreEditor(player: Player) {
    setScorePlayerId(player.id)
    setScoreInput(String(player.score))
    setCustomAdd('')
  }

  function saveExactScore() {
    if (!activePlayer || scoreInput.trim() === '') return
    const value = Number(scoreInput)
    if (!Number.isFinite(value)) return
    setScore(activePlayer.id, value)
    setScorePlayerId(null)
  }

  function addFromEditor(amount: number) {
    if (!activePlayer || !Number.isFinite(amount) || amount <= 0) return
    changeScore(activePlayer.id, Math.trunc(amount))
    setScorePlayerId(null)
  }

  function openSettings() {
    setSettingsDraft(players.map(player => ({ ...player })))
    setSettingsOpen(true)
  }

  function updateDraft(playerId: string, patch: Partial<Player>) {
    setSettingsDraft(current => current.map(player => player.id === playerId ? { ...player, ...patch } : player))
  }

  function addPlayer() {
    if (settingsDraft.length >= MAX_PLAYERS) return
    const index = settingsDraft.length
    setSettingsDraft(current => [...current, {
      id: createPlayerId(),
      name: `Jugador ${index + 1}`,
      color: PALETTE[index % PALETTE.length],
      score: 0,
    }])
  }

  function removePlayer(playerId: string) {
    if (settingsDraft.length > MIN_PLAYERS) setSettingsDraft(current => current.filter(player => player.id !== playerId))
  }

  function saveSettings() {
    const nextPlayers = normalizePlayers(settingsDraft)
    if (!nextPlayers) return
    setPlayers(nextPlayers)
    setSettingsOpen(false)
  }

  function requestReset() {
    setSettingsOpen(false)
    setResetOpen(true)
  }

  function resetScores() {
    setPlayers(current => current.map(player => ({ ...player, score: 0 })))
    setResetOpen(false)
  }

  const boardStyle = {
    '--portrait-rows': players.length,
    '--landscape-columns': Math.min(players.length, 3),
    '--landscape-rows': Math.ceil(players.length / Math.min(players.length, 3)),
  } as CSSProperties

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <h1>Contador de puntos</h1>
        <div className={styles.headerActions}>
          <p className={styles.hint}>Laterales −1 / +1<br />Centro para editar</p>
          <button className={styles.settingsButton} type="button" onClick={openSettings} aria-label="Configurar jugadores y colores" title="Configuración"><GearIcon /></button>
        </div>
      </header>

      <section className={styles.scoreboard} style={boardStyle} data-count={players.length} aria-label="Puntajes">
        {players.map(player => (
          <article className={styles.player} key={player.id} aria-label={`Puntaje de ${player.name}: ${player.score}`} style={{ '--surface': `linear-gradient(135deg, ${player.color} 0%, ${shadeColor(player.color, -28)} 100%)` } as CSSProperties}>
            <button className={styles.scoreAction} type="button" onClick={() => changeScore(player.id, -1)} aria-label={`Restar un punto a ${player.name}`}><span className={styles.actionMark} aria-hidden="true">−</span></button>
            <button className={styles.playerContent} type="button" onClick={() => openScoreEditor(player)} aria-label={`Editar puntaje de ${player.name}`}>
              <span className={styles.playerName}>{player.name}</span>
              <span className={`${styles.score} ${bumpedPlayerId === player.id ? styles.bump : ''}`} aria-hidden="true">{player.score}</span>
            </button>
            <button className={styles.scoreAction} type="button" onClick={() => changeScore(player.id, 1)} aria-label={`Sumar un punto a ${player.name}`}><span className={styles.actionMark} aria-hidden="true">+</span></button>
          </article>
        ))}
      </section>

      {activePlayer && (
        <div className={styles.overlay} role="presentation" onPointerDown={event => { if (event.target === event.currentTarget) setScorePlayerId(null) }}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="score-editor-title">
            <form className={styles.editor} onSubmit={event => { event.preventDefault(); saveExactScore() }}>
              <label className={styles.editorLabel} htmlFor="point-counter-score-input">Valor exacto<strong id="score-editor-title">{activePlayer.name}</strong></label>
              <input ref={scoreInputRef} id="point-counter-score-input" className={styles.scoreInput} type="number" inputMode="numeric" step="1" value={scoreInput} onChange={event => setScoreInput(event.target.value)} />
              <p className={styles.sectionTitle}>Sumar al puntaje</p>
              <div className={styles.quickAdds}>{[5, 10, 15].map(amount => <button key={amount} className={styles.quickAdd} type="button" onClick={() => addFromEditor(amount)}>+{amount}</button>)}</div>
              <div className={styles.customAddRow}>
                <input className={styles.customAddInput} type="number" inputMode="numeric" min="1" step="1" placeholder="Otra cantidad" aria-label="Cantidad personalizada para sumar" value={customAdd} onChange={event => setCustomAdd(event.target.value)} />
                <button className={styles.customAddButton} type="button" onClick={() => addFromEditor(Number(customAdd))}>Sumar</button>
              </div>
              <div className={styles.dialogActions}>
                <button className={styles.cancelButton} type="button" onClick={() => setScorePlayerId(null)}>Cancelar</button>
                <button className={styles.saveButton} type="submit">Guardar valor</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className={styles.overlay} role="presentation" onPointerDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false) }}>
          <section className={`${styles.dialog} ${styles.settingsDialog}`} role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <form className={styles.settingsPanel} onSubmit={event => { event.preventDefault(); saveSettings() }}>
              <h2 className={styles.settingsHeading} id="settings-title">Jugadores</h2>
              <div className={styles.playerSettings}>
                {settingsDraft.map((player, index) => (
                  <div className={styles.playerSetting} key={player.id}>
                    <label className={styles.settingField}>Nombre<input ref={index === 0 ? firstNameInputRef : undefined} className={styles.settingName} type="text" maxLength={MAX_NAME_LENGTH} autoComplete="off" value={player.name} onChange={event => updateDraft(player.id, { name: event.target.value })} /></label>
                    <label className={styles.settingField}>Color<input className={styles.settingColor} type="color" value={player.color} onChange={event => updateDraft(player.id, { color: event.target.value })} aria-label={`Color de ${player.name || `Jugador ${index + 1}`}`} /></label>
                    <button className={styles.removePlayer} type="button" disabled={settingsDraft.length <= MIN_PLAYERS} onClick={() => removePlayer(player.id)} aria-label={`Quitar ${player.name || `Jugador ${index + 1}`}`}>×</button>
                  </div>
                ))}
              </div>
              <div className={styles.settingsTools}>
                <button className={styles.addPlayer} type="button" disabled={settingsDraft.length >= MAX_PLAYERS} onClick={addPlayer}>+ Agregar jugador</button>
                <p>Mínimo 2 · máximo 6</p>
              </div>
              <div className={styles.dangerZone}><button className={styles.resetScores} type="button" onClick={requestReset}>Reiniciar todos los puntajes</button></div>
              <div className={styles.dialogActions}>
                <button className={styles.cancelButton} type="button" onClick={() => setSettingsOpen(false)}>Cancelar</button>
                <button className={styles.saveButton} type="submit">Guardar</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {resetOpen && (
        <div className={styles.overlay} role="presentation" onPointerDown={event => { if (event.target === event.currentTarget) setResetOpen(false) }}>
          <section className={`${styles.dialog} ${styles.confirmDialog}`} role="alertdialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-description">
            <div className={styles.confirmPanel}>
              <h2 id="reset-title">¿Reiniciar puntajes?</h2>
              <p id="reset-description">Todos los jugadores volverán a 0. Esta acción no se puede deshacer.</p>
              <div className={styles.dialogActions}>
                <button className={styles.cancelButton} type="button" onClick={() => setResetOpen(false)}>Cancelar</button>
                <button className={`${styles.saveButton} ${styles.confirmReset}`} type="button" onClick={resetScores}>Sí, reiniciar</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
