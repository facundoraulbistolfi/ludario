# Revisión geográfica · 12 de octubre de 2026

El terreno y la textura satelital tienen coordenadas geográficas; eso no valida los senderos digitalizados del croquis. La transformación del croquis usa tres controles: Totanka, Naranjas y una posición supuesta del bosque cercano a Paredes Rojas. El ajuste exacto en esos tres controles no mide el error fuera de ellos. El residuo de 40,9 m de la guía de escalada pertenece a otro ajuste y tampoco valida los senderos.

Se compararon los seis trazados con Esri World Imagery y la cartografía OSM obtenida mediante `https://api.openstreetmap.org/api/0.6/map?bbox=-57.87,-37.911,-57.837,-37.883`.

- Rojo y naranja: sectores sobre cultivos; el naranja no sigue consistentemente el filo descrito en https://www.sierradelosdifuntos.com/senderos. No es posible corregirlos con un desplazamiento uniforme.
- Amarillo: relación general con el pie de sierra, sin coincidencia suficiente para confirmar todo el recorrido.
- Verde, celeste y azul: sin una referencia independiente que confirme su geometría completa.
- OSM contiene dos sendas sin nombre/color, ways 370514761 y 370515082, del lado este de la zona. Son referencias independientes y parciales, no reemplazos de los seis senderos oficiales. La imagen satelital no permite confirmar todos sus metros, especialmente entre vegetación y rocas.

## Cambios

Los trazos del croquis y sus lugares se ocultan inicialmente (preferencias v2) y se dibujan discontinuos al activarlos. La geometría original se preserva identificada como no validada; no se desplazan puntos para simular una precisión inexistente. Se agregan las dos sendas OSM como capa independiente, con créditos y enlaces a cada way. El mapa oficial original permanece accesible sin conexión.

GPX locales conservan coordenadas, separan segmentos originales, saltos >250 m y salidas del área. No se ajustan al croquis ni se asigna un color oficial automáticamente. Solo se guardan nombre y coordenadas regionales, sin tiempos, salud ni identidad. La importación funciona offline; los datos se conservan en localStorage, no en GitHub. La exportación GPX permite respaldo y la copia HTML incluye los recorridos locales.

El enlace Strava entregado lleva al flyover de la actividad 20553887856 y redirigió a registro sin sesión. No se obtuvo ni se incorporó una geometría de esa actividad. Para incorporarla hace falta el GPX exportado por el usuario desde Strava.

## Validación pendiente

No hubo comprobación física en el predio ni medición GNSS de los seis recorridos. Para corregir el croquis hacen falta tracks identificados por color y/o hitos inequívocos confirmados por el parque. Un recorrido GPS tampoco demuestra autorización de paso ni precisión absoluta.

## Actualización con GPS públicos y preferencia del usuario

Después de hacerse públicas, las vistas `/activities/20553887856/flyover` y `/activities/20556370640/flyover` expusieron sus coordenadas en `flyoverData.streams.location`. Se incorporaron únicamente coordenadas regionales y nombres descriptivos (sin perfil, horarios, velocidades ni datos de salud). Ambas quedan incluidas offline, con fuente individual y exportación GPX.

El usuario pidió explícitamente conservar visibles los seis senderos imperfectos. Se restauró ese comportamiento, con los lugares y miradores visibles, y se migraron las preferencias a v3 para que la configuración anterior no los mantenga ocultos.

El tramo norte del amarillo al pie de la sierra se ajustó al registro 20553887856, puntos originales 1039 → 130. La identificación como ese tramo es una inferencia por el recorrido al pie de la sierra y su relación con Totanka, no una confirmación del color de la señalización. Los enlaces cortos con el croquis y la continuación desde su vértice 10 siguen siendo aproximaciones. Se conservó la geometría anterior en `originalCoordinatesParts`; los otros cinco senderos no se desplazaron.

El recorrido 20556370640 fue identificado explícitamente por el usuario como estacionamiento → Paredes Naranjas. Su llegada reemplaza la referencia anterior de ese sector (preservada en `previousCoordinates`) y su geometría reemplaza la aproximación de acceso correspondiente en la guía. No se considera una medición de cada pie de vía ni una validación de todos los senderos.
