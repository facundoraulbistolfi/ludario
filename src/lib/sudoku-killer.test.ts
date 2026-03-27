import { describe, it, expect } from 'vitest'
import { minSum, maxSum, pairKey, computeCombinations } from './sudoku-killer'

describe('minSum', () => {
  it('2 celdas → 1+2 = 3', () => expect(minSum(2)).toBe(3))
  it('3 celdas → 1+2+3 = 6', () => expect(minSum(3)).toBe(6))
  it('9 celdas → 1..9 = 45', () => expect(minSum(9)).toBe(45))
})

describe('maxSum', () => {
  it('2 celdas → 8+9 = 17', () => expect(maxSum(2)).toBe(17))
  it('3 celdas → 7+8+9 = 24', () => expect(maxSum(3)).toBe(24))
  it('9 celdas → 1..9 = 45', () => expect(maxSum(9)).toBe(45))
})

describe('pairKey', () => {
  it('siempre ordena de menor a mayor', () => {
    expect(pairKey(3, 7)).toBe('3-7')
    expect(pairKey(7, 3)).toBe('3-7')
    expect(pairKey(1, 1)).toBe('1-1')
  })
})

describe('computeCombinations', () => {
  const none = new Set<number>()

  it('cage de 2 celdas suma 3 → solo [1,2]', () => {
    const result = computeCombinations(3, 2, none, none)
    expect(result).toEqual([[1, 2]])
  })

  it('cage de 2 celdas suma 17 → solo [8,9]', () => {
    const result = computeCombinations(17, 2, none, none)
    expect(result).toEqual([[8, 9]])
  })

  it('cage de 3 celdas suma 6 → solo [1,2,3]', () => {
    const result = computeCombinations(6, 3, none, none)
    expect(result).toEqual([[1, 2, 3]])
  })

  it('excluir un dígito lo elimina de todos los resultados', () => {
    const result = computeCombinations(10, 2, new Set([1]), none)
    result.forEach(combo => expect(combo).not.toContain(1))
  })

  it('requerir un dígito lo fuerza en todos los resultados', () => {
    const result = computeCombinations(10, 2, none, new Set([3]))
    expect(result.length).toBeGreaterThan(0)
    result.forEach(combo => expect(combo).toContain(3))
  })

  it('suma imposible para el tamaño de cage → []', () => {
    expect(computeCombinations(2, 2, none, none)).toEqual([])
    expect(computeCombinations(18, 2, none, none)).toEqual([])
  })

  it('los dígitos dentro de cada combo no se repiten', () => {
    const result = computeCombinations(15, 3, none, none)
    result.forEach(combo => {
      const unique = new Set(combo)
      expect(unique.size).toBe(combo.length)
    })
  })

  it('todos los combos suman exactamente el target', () => {
    const result = computeCombinations(20, 4, none, none)
    result.forEach(combo => {
      expect(combo.reduce((a, b) => a + b, 0)).toBe(20)
    })
  })
})
