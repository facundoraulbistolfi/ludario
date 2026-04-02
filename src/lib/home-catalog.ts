export const FILTER_TAGS = [
  'Anotador',
  'Herramienta',
  'Registro',
  'Cartas',
  'Scoreboard',
  'Juego',
  'Libros',
  'Selector',
  'Externo',
  'PacMan',
  'Windows 98',
] as const

export type FilterTag = (typeof FILTER_TAGS)[number]

type CatalogItemBase = {
  id: string
  icon: string
  tags: FilterTag[]
  chips: string[]
  title: string
  description: string
}

export type InternalCatalogItem = CatalogItemBase & {
  kind: 'internal'
  to: string
}

export type ExternalCatalogItem = CatalogItemBase & {
  kind: 'external'
  href: string
}

export type CatalogItem = InternalCatalogItem | ExternalCatalogItem

export type FilterMeta = {
  eyebrow: string
  title: string
  description: string
}

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: '/tools/sudoku-killer',
    kind: 'internal',
    to: '/tools/sudoku-killer',
    icon: '🔢',
    tags: ['Herramienta'],
    chips: ['Solver', 'Lógica'],
    title: 'Sudoku Killer',
    description: 'Solver de cages con filtros de dígitos, restricciones entre pares y acceso rápido a PDFs de KrazyDad.',
  },
  {
    id: 'external:dosto',
    kind: 'external',
    href: 'https://facundoraulbistolfi.github.io/dosto/',
    icon: '🪓',
    tags: ['Libros', 'Externo'],
    chips: ['Lectura', 'GitHub Pages'],
    title: 'Dosto',
    description: 'Biblioteca personal interactiva de Dostoievski, con portadas ilustradas, progreso de lectura y filtros temáticos.',
  },
  {
    id: '/tools/chinchon',
    kind: 'internal',
    to: '/tools/chinchon',
    icon: '🃏',
    tags: ['Anotador', 'Registro', 'Cartas', 'Scoreboard'],
    chips: ['Persistencia'],
    title: 'Anotador de Chinchón',
    description: 'Configura jugadores, suma rondas, marca chinchón o -10, y guarda/carga el estado de la partida.',
  },
  {
    id: '/tools/truco',
    kind: 'internal',
    to: '/tools/truco',
    icon: '🧉',
    tags: ['Anotador', 'Cartas', 'Scoreboard'],
    chips: ['Buenas/Malas'],
    title: 'Anotador de Truco',
    description: 'Marcador de truco en palitos con buenas y malas, pensado para partidas rápidas entre nosotros y ellos.',
  },
  {
    id: '/tools/chinchon-lab',
    kind: 'internal',
    to: '/tools/chinchon-lab',
    icon: '🎯',
    tags: ['Herramienta', 'Registro', 'Cartas'],
    chips: ['Arena', 'Bots'],
    title: 'Chinchón Lab',
    description: 'Arena de bots y modo de juego para practicar cortes, chinchón y estrategia de descarte.',
  },
  {
    id: '/tools/pacman-memory',
    kind: 'internal',
    to: '/tools/pacman-memory',
    icon: '👻',
    tags: ['Juego', 'PacMan'],
    chips: ['Memoria', 'Multijugador'],
    title: 'Pac-Memory',
    description: 'Juego de memoria con sprites retro de Pac-Man, Space Invaders, Tetris y más. Para 2-3 jugadores.',
  },
  {
    id: '/tools/point-counter',
    kind: 'internal',
    to: '/tools/point-counter',
    icon: '➕',
    tags: ['Anotador', 'Registro', 'Scoreboard'],
    chips: ['Tap', 'Multijugador'],
    title: 'Contador de Puntos',
    description: 'Marcador genérico por jugador con botones de color, suma rápida por toque y suma avanzada con long press.',
  },
  {
    id: '/tools/pacman-ludo',
    kind: 'internal',
    to: '/tools/pacman-ludo',
    icon: '🕹️',
    tags: ['Juego', 'PacMan'],
    chips: ['Tablero', 'Multijugador'],
    title: 'Pac-Ludo',
    description: 'Ludo temático de Pac-Man: movés fantasmas por el tablero, capturás rivales y llegás al centro.',
  },
  {
    id: 'external:win98maze',
    kind: 'external',
    href: 'https://facundoraulbistolfi.github.io/win98maze/',
    icon: '🖥️',
    tags: ['Juego', 'Windows 98', 'Externo'],
    chips: ['Laberinto'],
    title: 'Win98 Maze',
    description: 'Laberinto 3D en primera persona con estética Windows 98, minimapa configurable y atmósfera retro.',
  },
  {
    id: 'external:win98-battleship',
    kind: 'external',
    href: 'https://facundoraulbistolfi.github.io/win98_battleship/',
    icon: '🚢',
    tags: ['Juego', 'Windows 98', 'Externo'],
    chips: ['Batalla Naval'],
    title: 'Batalla Naval 98',
    description: 'Batalla Naval con look Windows 98, power-ups, sonido retro y modos contra la compu o para dos jugadores.',
  },
  {
    id: 'external:toca-toca',
    kind: 'external',
    href: 'https://facundoraulbistolfi.github.io/toca-toca/',
    icon: '🎡',
    tags: ['Selector', 'Externo'],
    chips: ['Ruleta', 'Casino'],
    title: 'Toca Toca',
    description: 'Ruleta web configurable para decidir a quién le toca, con estadísticas persistentes y tono de casino.',
  },
]

export const FILTER_META: Record<FilterTag, FilterMeta> = {
  Anotador: {
    eyebrow: 'Mesa en curso',
    title: 'Anotadores al frente',
    description: 'Entradas pensadas para seguir una partida, anotar resultados y resolver la parte práctica sin frenar la mesa.',
  },
  Herramienta: {
    eyebrow: 'Utilidad central',
    title: 'Herramientas y laboratorios',
    description: 'Solvers, utilidades y espacios de práctica para cuando necesitás entender, probar o destrabar algo.',
  },
  Registro: {
    eyebrow: 'Memoria persistente',
    title: 'Entradas con registro',
    description: 'Herramientas que guardan historial, estado o progreso para volver más tarde sin empezar de cero.',
  },
  Cartas: {
    eyebrow: 'Baraja en mano',
    title: 'Universo de cartas',
    description: 'Todo lo conectado con mazos, partidas de cartas y pequeñas ayudas para seguirles el ritmo.',
  },
  Scoreboard: {
    eyebrow: 'Tanteador visible',
    title: 'Scoreboards y cuenta puntos',
    description: 'Marcadores rápidos para cuando la prioridad es tener el tanteo claro y accesible.',
  },
  Juego: {
    eyebrow: 'Desvío lúdico',
    title: 'Juegos y tableros',
    description: 'Experiencias jugables completas o pequeñas escapadas interactivas dentro del mismo compendio.',
  },
  Libros: {
    eyebrow: 'Estante editorial',
    title: 'Bibliotecas y lecturas',
    description: 'Entradas más contemplativas: catálogos, bibliotecas y proyectos pensados para recorrer con calma.',
  },
  Selector: {
    eyebrow: 'Decisión instantánea',
    title: 'Selectores y ruletas',
    description: 'Herramientas para decidir al azar, repartir turnos o resolver quién sigue sin vueltas.',
  },
  Externo: {
    eyebrow: 'Puertas vecinas',
    title: 'Portales externos',
    description: 'Proyectos que viven fuera de Ludario pero forman parte del mismo compendio curado.',
  },
  PacMan: {
    eyebrow: 'Retro arcade',
    title: 'Constelación PacMan',
    description: 'Entradas unidas por la misma vibra arcade y la iconografía de Pac-Man.',
  },
  'Windows 98': {
    eyebrow: 'Nostalgia de escritorio',
    title: 'Mundo Windows 98',
    description: 'Experiencias retro con estética de escritorio clásico, ventanas biseladas y sabor noventoso.',
  },
}

export const FAVORITES_STORAGE_KEY = 'ludario-favorites'
export const LEGACY_FAVORITES_STORAGE_KEY = 'tabletop-favorites'

export function normalizeSearchTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function catalogItemMatchesSearch(item: CatalogItem, query: string): boolean {
  if (!query) return true

  const haystack = normalizeSearchTerm([
    item.title,
    item.description,
    ...item.tags,
    ...item.chips,
  ].join(' '))

  return haystack.includes(query)
}

export function getVisibleCatalogItems(
  items: CatalogItem[],
  activeFilter: FilterTag | null,
  searchQuery: string,
): CatalogItem[] {
  const normalizedQuery = normalizeSearchTerm(searchQuery)

  return items.filter(item => {
    const matchesFilter = activeFilter === null || item.tags.includes(activeFilter)
    return matchesFilter && catalogItemMatchesSearch(item, normalizedQuery)
  })
}

export function getFavoriteCatalogItems(items: CatalogItem[], favorites: Set<string>): CatalogItem[] {
  return items.filter(item => favorites.has(item.id))
}

export function sortCatalogItemsByFavorites(items: CatalogItem[], favorites: Set<string>): CatalogItem[] {
  const favoriteItems = items.filter(item => favorites.has(item.id))
  const regularItems = items.filter(item => !favorites.has(item.id))

  return [...favoriteItems, ...regularItems]
}
