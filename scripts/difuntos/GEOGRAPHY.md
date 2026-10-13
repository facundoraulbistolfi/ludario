# Revisión geográfica · 13/10/2026

## Plano de escalada

La figura satelital de la página 4 de la guía oficial de junio de 2026 se registró contra la textura Esri incluida. SIFT produjo 96 coincidencias; RANSAC conservó 88. Error RMS de registro: 1,02 píxeles en la textura. Las coincidencias cubren aproximadamente x=390–961, y=780–1462 del plano. Los estacionamientos e ingreso del norte quedan fuera de esa cobertura; su transformación extrapola y tiene más incertidumbre.

La homografía y dimensiones de ambas imágenes están en `guide.registration`. La conversión utiliza longitud lineal y latitud Web Mercator, igual que la textura del motor. `register-guide.py` permite reproducir el ajuste con OpenCV y numpy. No se requieren esas dependencias para compilar o usar la app.

Se reemplazó el ajuste afín anterior por esta transformación para los símbolos de sectores y accesos de la guía. El ingreso mantiene la coordenada oficial previa. Los cuatro puntos de catálogo theCrag se conservan como referencias alternativas, no controles del nuevo ajuste; pueden representar lugares diferentes dentro de un sector. Los desplazamientos de símbolos frente a la versión anterior son aproximadamente 29–140 m.

El residuo mide coincidencia entre imágenes, **no precisión absoluta de sectores o senderos**. Los símbolos tienen extensión, la digitalización de líneas es manual, el relieve no resuelve paredes individuales y la imagen puede tener errores. No se hizo verificación en terreno.

## Accesos por sector

Los cinco símbolos E del plano son puntos de partida aproximados. Cada uno de los 13 sectores tiene una ficha de acceso, descripción y enlace al plano original. Se distinguen:

- `parts`: líneas digitalizadas del plano oficial, georreferenciadas al satélite.
- `orientationParts`: enlaces de orientación donde el plano no dibuja una senda continua; pueden unir estacionamientos y símbolos, sin afirmar que exista una senda recta.

Ambos se dibujan discontinuos por ser aproximados; los enlaces de orientación son más finos y anaranjados. Solo se destacan los del sector seleccionado. Para Tanqueta no existe una traza final publicada: la app lo dice y muestra únicamente orientación. Los sectores del sur tampoco disponen de geometría publicada para cada tramo final. No se calculan tiempos ni navegación giro a giro. Las instrucciones de Potolandia, Bosque, Escaloneta, Gemelos, Naranjas y Totanka provienen del texto de la guía; las restantes relaciones espaciales se atribuyen expresamente al plano.

## OSM y senderos de colores

Consulta OSM: `https://api.openstreetmap.org/api/0.6/map?bbox=-57.870,-37.911,-57.837,-37.883`, 13/10/2026. Se actualizan las sendas 370514761 y 370515082, al este. Los caminos privados de servicio de esa consulta corresponden a otra área y no se incorporan como accesos de escalada. OSM no cubre la red completa de este predio: no se ajustan los senderos a sendas lejanas ni se asignan colores sin evidencia.

Los seis recorridos del croquis se conservan visibles como referencias discontinuas. Se restauró el amarillo original para eliminar la geometría derivada de caminatas personales. El croquis sigue usando tres controles, uno supuesto: especialmente Rojo y Naranja presentan desajustes. La nueva transformación del plano de escalada **no valida** ese croquis separado. Sus puntos de interés también son aproximados; el baño del Bosque de Paredes Rojas se identifica como referencia de zona y no posición exacta.

## Privacidad y offline

No se publican actividades, geometrías personales, enlaces Strava ni controles para importar recorridos. Los registros de versiones anteriores del navegador no se leen ni exportan; no se borran respaldos locales del visitante. El GPS muestra solo posición actual y precisión, sin historial ni envío.

La guía incluye 336 vías y 64 fotos. GPS requiere permiso y contexto HTTPS; la app instalada puede abrir su caché sin datos móviles. El archivo HTML descargable incluye mapa, guía y fotos, pero GPS puede bloquearse en archivos locales. El service worker verifica recursos, admite descargas interrumpidas y limita su caché a esta subpágina.

Validación automatizada: catálogo/fotos completos, ausencia de actividades publicadas, referencias de estacionamientos para los 13 sectores, transformación y límites; integridad offline, modo avión simulado, reanudación, actualizaciones y cachés ajenas. Browser QA no disponible en este entorno; no se realizó prueba física de GPS.
