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

Consulta OSM ampliada: `https://api.openstreetmap.org/api/0.6/map?bbox=-57.875,-37.918,-57.830,-37.878`, 13/10/2026. Se conservan las sendas 370514761 y 370515082, al este. Del way 383375668 solo se incorpora el tramo de ingreso coincidente con el camino visible y el plano, hasta su conexión con el camino hacia Totanka. El resto de ese camino privado y las entradas a otras propiedades no se presentan como accesos del parque. OSM no cubre la red completa: no se ajustan los senderos a sendas lejanas ni se asignan colores a OSM sin evidencia.

Los seis recorridos del croquis se conservan visibles. El Amarillo utiliza el corredor GPS al pie de sierra (aproximadamente 1,1 km) y mantiene su continuación sin registro como aproximación. Su identificación como Amarillo es una inferencia por su relación con Totanka y la descripción del pie de sierra; no confirma la señalización. La guía de Naranjas utiliza unos 0,8 km del acceso GPS identificado explícitamente por el usuario.

Los otros colores reciben un ajuste **local de registro**, limitado a 500 m alrededor de dos controles GPS (base de Totanka y llegada a Naranjas). Es un campo de desplazamientos con caída cuadrática; fuera del radio no altera coordenadas. Corrige la ubicación del dibujo cerca de referencias conocidas, no mide el trazado de cada sendero. En especial Rojo y Naranja mantienen desajustes; no se obtuvieron tracks coincidentes para corregirlos íntegros. Los puntos de interés siguen siendo aproximados.

La red del plano integra GPS entre Totanka y Naranjas y en el pie de sierra. El ingreso combina el tramo OSM coincidente y una digitalización manual del camino visible al pie del cultivo hacia Totanka. El resto del plano mantiene su georreferenciación satelital y condición aproximada. La llegada GPS a Naranjas y el símbolo de pared de la guía son referencias distintas; el enlace final se mantiene orientativo.

`geographic-inputs.json` conserva únicamente corredores seleccionados, simplificados y reducidos a una grilla de 20 m, atribuciones y una lista de fuentes sin geometría obtenida. No contiene el recorrido completo del primer registro ni metadatos de actividades. `prepare-geography.mjs` reconstruye los ajustes de forma determinista desde esos corredores y las geometrías originales preservadas. `geography.js` calcula proyecciones, recortes y registro local; rechaza la confluencia de corredores lejanos o con cambios grandes de longitud.

Wikiloc requirió iniciar sesión para las descargas GPX/KML consultadas; no se obtuvo ni incorporó su geometría. AllTrails rechazó la lectura. Mar del Plata Trail Run publicó perfiles de altimetría, sin una traza utilizable. Estas fuentes no se presentan como respaldo geométrico del mapa.

## Privacidad y offline

No hay capas de actividades, nombres de caminatas ni importación de recorridos. Las coordenadas GPS se publican solo como geometrías derivadas de los caminos identificados, reducidas a una grilla de 20 m; las fuentes se atribuyen a la plataforma, sin enlaces identificables a actividades. No se conservan identidad, fechas de actividad, horarios, velocidades ni salud. Los registros de versiones anteriores del navegador no se leen ni exportan; no se borran respaldos locales del visitante. El GPS del dispositivo muestra solo posición actual y precisión, sin historial ni envío.

Cada trazo lleva fuente y confianza. La interfaz dibuja continuas las geometrías registradas por GPS o cartografiadas por OSM; esto no implica validación física ni precisión absoluta. Plano, satélite, croquis y enlaces de orientación se dibujan discontinuos. En «Fuentes del camino» se explican origen y límites, sin mostrar actividades como rutas separadas.

La guía incluye 336 vías y 64 fotos. GPS requiere permiso y contexto HTTPS; la app instalada puede abrir su caché sin datos móviles. El archivo HTML descargable incluye mapa, guía y fotos, pero GPS puede bloquearse en archivos locales. El service worker verifica recursos, admite descargas interrumpidas y limita su caché a esta subpágina.

Validación automatizada: catálogo/fotos completos, ausencia de actividades publicadas, referencias de estacionamientos para los 13 sectores, transformación y límites; integridad offline, modo avión simulado, reanudación, actualizaciones y cachés ajenas. Browser QA no disponible en este entorno; no se realizó prueba física de GPS.
