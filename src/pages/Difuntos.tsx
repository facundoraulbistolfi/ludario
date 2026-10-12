import { useEffect } from 'react'

const mapUrl = `${import.meta.env.BASE_URL}difuntos/`

export default function Difuntos() {
  useEffect(() => {
    window.location.replace(mapUrl)
  }, [])

  return (
    <main className="page" aria-busy="true">
      <p>Abriendo Sierra de los Difuntos…</p>
      <a href={mapUrl}>Abrir el mapa</a>
    </main>
  )
}
