import { describe, expect, it } from 'vitest'
import {
  CATALOG_ITEMS,
  FILTER_TAGS,
  getFavoriteCatalogItems,
  getVisibleCatalogItems,
  normalizeSearchTerm,
  sortCatalogItemsByFavorites,
} from './home-catalog'

describe('home-catalog helpers', () => {
  it('normalizes accents and casing for search', () => {
    expect(normalizeSearchTerm('Chinchón LAB')).toBe('chinchon lab')
  })

  it('filters visible catalog items by feature tag and search text', () => {
    const visible = getVisibleCatalogItems(CATALOG_ITEMS, 'Cartas', 'bots')

    expect(visible).toHaveLength(1)
    expect(visible[0]?.id).toBe('/tools/chinchon-lab')
  })

  it('finds external portals through the same search normalizer', () => {
    const visible = getVisibleCatalogItems(CATALOG_ITEMS, null, 'dosto')

    expect(visible).toHaveLength(1)
    expect(visible[0]?.id).toBe('external:dosto')
  })

  it('maps external portals into the same feature filters', () => {
    const visible = getVisibleCatalogItems(CATALOG_ITEMS, 'Windows 98', '')

    expect(visible.some(item => item.id === 'external:win98maze')).toBe(true)
    expect(visible.some(item => item.id === 'external:win98-battleship')).toBe(true)
    expect(visible.some(item => item.id === 'external:toca-toca')).toBe(false)
  })

  it('keeps favorites first without losing catalog order', () => {
    const favorites = new Set(['/tools/chinchon-lab', 'external:toca-toca'])
    const ordered = sortCatalogItemsByFavorites(CATALOG_ITEMS, favorites)
    const favoriteItems = getFavoriteCatalogItems(ordered, favorites)

    expect(favoriteItems.map(item => item.id)).toEqual([
      '/tools/chinchon-lab',
      'external:toca-toca',
    ])
    expect(FILTER_TAGS).toEqual([
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
    ])
  })

  it('keeps internal ids equal to their route for favorites compatibility', () => {
    const internalItem = CATALOG_ITEMS.find(item => item.id === '/tools/chinchon')

    expect(internalItem?.kind).toBe('internal')
  })
})
