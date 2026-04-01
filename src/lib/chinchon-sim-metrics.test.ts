import { describe, expect, it } from 'vitest'

import {
  getChinchonWinRate,
  getNextStableStreak,
  getTruncatedWinRates,
  getWinRates,
  truncateRate,
} from './chinchon-sim-metrics'

describe('getWinRates', () => {
  it('returns complementary win percentages', () => {
    expect(getWinRates(3, 1)).toEqual([75, 25])
  })

  it('returns zeroes when there are no wins yet', () => {
    expect(getWinRates(0, 0)).toEqual([0, 0])
  })
})

describe('truncateRate', () => {
  it('truncates instead of rounding', () => {
    expect(truncateRate(12.9876, 2)).toBe(12.98)
  })

  it('supports zero decimals', () => {
    expect(truncateRate(49.99, 0)).toBe(49)
  })
})

describe('getTruncatedWinRates', () => {
  it('truncates both bot winrates with the requested precision', () => {
    expect(getTruncatedWinRates(5, 3, 1)).toEqual([62.5, 37.5])
  })
})

describe('getNextStableStreak', () => {
  it('starts the streak at one when there is no previous sample', () => {
    expect(getNextStableStreak(null, [50, 50], 0)).toBe(1)
  })

  it('increments the streak while truncated rates stay equal', () => {
    expect(getNextStableStreak([50.1, 49.8], [50.1, 49.8], 3)).toBe(4)
  })

  it('resets the streak when truncated rates change', () => {
    expect(getNextStableStreak([50.1, 49.8], [50.2, 49.7], 3)).toBe(1)
  })
})

describe('getChinchonWinRate', () => {
  it('measures chinchones over that bot wins', () => {
    expect(getChinchonWinRate(4, 10)).toBe(40)
  })

  it('returns zero when the bot still has no wins', () => {
    expect(getChinchonWinRate(2, 0)).toBe(0)
  })
})
