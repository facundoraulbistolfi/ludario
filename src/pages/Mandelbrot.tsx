import './StandaloneGame.css'

export default function Mandelbrot() {
  return (
    <main className="standalone-game">
      <iframe
        className="standalone-game__frame"
        src={`${import.meta.env.BASE_URL}mandelbrot/index.html`}
        title="Explorador de Mandelbrot"
        allow="fullscreen"
      />
    </main>
  )
}
