# Sierra de los Difuntos

App autónoma publicada desde `public/difuntos/`. Se abre desde el catálogo mediante `/tools/difuntos`; la ruta React redirige al documento autónomo para conservar GPS, instalación y service worker al usarla sin conexión.

`npm run build:difuntos` compila el motor Three.js y regenera el HTML, el manifiesto de integridad y el worker. Usa esbuild, provisto por Vite. `npm run build` ejecuta este paso antes del build del catálogo.

- `app.js`, `style.css`, `index.template.html`: interfaz y mapa móvil.
- `data.json`: elevaciones, puntos, senderos aproximados y catálogo de vías; fotos optimizadas se referencian por rutas locales.
- `sw.template.js`: caché acotada a `/ludario/difuntos/`, verificación SHA-256, progreso y recuperación de descargas.
- `vendor/`: Three.js 0.170.0 y OrbitControls (MIT, créditos conservados en los archivos).

El listado usa la guía oficial de Sierra de los Difuntos de junio de 2026. Las fotos, el croquis y los sectores son del sitio oficial https://www.sierradelosdifuntos.com/. Relieve: Mapzen/AWS Terrain Tiles, NASA/USGS SRTM. Imagen satelital: Esri World Imagery y proveedores indicados en la app. Los croquis georreferenciados son aproximados y no reemplazan tracks medidos ni señalización del lugar.

Las coordenadas GPS se usan solo en el navegador. La caché usa el prefijo `ludario-difuntos-` y no controla ni elimina archivos de otras páginas de Ludario o del dominio.

## Recorridos personales y revisión geográfica

`tracks.js` importa GPX (tracks y routes), recorta a la zona, preserva segmentos y separa saltos >250 m. Los recorridos se guardan solo en este navegador y pueden exportarse como GPX o dentro de la copia HTML offline. `tracks.test.js` cubre límites, discontinuidades y exportación. No hay sincronización automática con Strava.

Dos sendas OSM con fuente individual complementan la cartografía. El croquis con desajustes está oculto inicialmente y usa trazos discontinuos. Ver `GEOGRAPHY.md` para resultados, método y límites de la revisión.

Actualización: por pedido del usuario, los seis senderos y lugares vuelven a estar visibles por defecto (preferencias v3). Dos recorridos públicos de Strava quedan incluidos offline, permiten ocultarse por separado y exportarse como GPX. Se usaron para ajustar el tramo norte del amarillo y la llegada/acceso a Paredes Naranjas; el resto del croquis se conserva. Estas rutas compartidas forman parte del mapa publicado; los GPX importados por cada visitante siguen siendo locales.
