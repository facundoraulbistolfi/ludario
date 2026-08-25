import { useLocation } from 'react-router-dom'
import './StandaloneGame.css'

type StandaloneGameDefinition = {
  file: string
  title: string
}

const STANDALONE_GAMES: Record<string, StandaloneGameDefinition> = {
  '/tools/memo-duelo': { file: 'memo-duelo.html', title: 'Memo Duelo' },
  '/tools/veintiuno-secreto': { file: 'veintiuno-secreto.html', title: 'Veintiuno Secreto' },
  '/tools/codigo-rival': { file: 'codigo-rival.html', title: 'Código Rival' },
  '/tools/hegemonia': { file: 'hegemonia.html', title: 'Hegemonía' },
  '/tools/nexo': { file: 'nexo.html', title: 'Nexo' },
}

export default function StandaloneGame() {
  const { pathname } = useLocation()
  const game = STANDALONE_GAMES[pathname]

  if (!game) return null

  return (
    <main className="standalone-game">
      <iframe
        className="standalone-game__frame"
        src={`${import.meta.env.BASE_URL}games/${game.file}`}
        title={game.title}
        allow="fullscreen"
      />
    </main>
  )
}
