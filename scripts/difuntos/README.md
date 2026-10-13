# Sierra de los Difuntos

App autónoma publicada desde `public/difuntos/`. Se abre desde el catálogo mediante `/tools/difuntos`; la ruta React redirige al documento autónomo para conservar GPS, instalación y service worker al usarla sin conexión.

`npm run build:difuntos` compila el motor Three.js y regenera el HTML, el manifiesto de integridad y el worker. Usa esbuild, provisto por Vite. `npm run build` ejecuta este paso antes del build del catálogo.

- `app.js`, `style.css`, `index.template.html`: interfaz y mapa móvil.
- `data.json`: elevaciones, puntos, senderos aproximados y catálogo de vías; fotos optimizadas se referencian por rutas locales.
- `sw.template.js`: caché acotada a `/ludario/difuntos/`, verificación SHA-256, progreso y recuperación de descargas.
- `vendor/`: Three.js 0.170.0 y OrbitControls (MIT, créditos conservados en los archivos).

El listado usa la guía oficial de Sierra de los Difuntos de junio de 2026. Las fotos, el croquis y los sectores son del sitio oficial https://www.sierradelosdifuntos.com/. Relieve: Mapzen/AWS Terrain Tiles, NASA/USGS SRTM. Imagen satelital: Esri World Imagery y proveedores indicados en la app. Los croquis georreferenciados son aproximados y no reemplazan tracks medidos ni señalización del lugar.

Las coordenadas GPS se usan solo en el navegador. La caché usa el prefijo `ludario-difuntos-` y no controla ni elimina archivos de otras páginas de Ludario o del dominio.

## Sectores y accesos

La búsqueda encuentra sectores, nombres de vías y puntos de interés. Cada sector tiene listado, fotos y acceso desde un estacionamiento del plano oficial. Los detalles y datos de visita se despliegan a pedido. No se publican caminatas personales ni se importan recorridos; GPS muestra únicamente posición actual y precisión.

El plano de escalada está georreferenciado a la textura satelital con 88 coincidencias visuales. Unos 1,9 km de corredores GPS corrigen el pie de sierra y el acceso a Naranjas, sin publicar actividades como capas. El ingreso usa el tramo OSM coincidente y el camino visible en satélite. Los colores conservan el croquis, con ajuste local cerca de dos anclajes GPS y aproximaciones donde faltan registros. Cada trazo tiene fuente y confianza; las líneas continuas son GPS/OSM y las discontinuas interpretaciones. Ver `GEOGRAPHY.md` para método y límites.

`node scripts/difuntos/prepare-geography.mjs` reconstruye los ajustes desde `geographic-inputs.json`, sin consultas externas. `geography.js` impide ajustar corredores a sendas lejanas; las geometrías originales se conservan para reproducir el resultado.

`register-guide.py` reproduce el registro de imágenes (OpenCV/numpy opcionales para mantenimiento). Las pruebas geográficas validan que los 13 sectores tengan guía, fotos y aproximación sin publicar actividades. `tracks.js` conserva utilidades geográficas y de formato independientes; la interfaz ya no lo utiliza para importar ni guardar registros.
