import { Link } from 'react-router-dom'
import { prefetchRoute } from '../lib/page-loaders'

export default function HomeCornerButton() {
  function warmHome() {
    prefetchRoute('/')
  }

  return (
    <Link
      className="home-corner-button"
      to="/"
      aria-label="Volver al inicio"
      title="Volver a Ludario"
      onMouseEnter={warmHome}
      onFocus={warmHome}
    >
      <span aria-hidden="true">📚</span>
    </Link>
  )
}
