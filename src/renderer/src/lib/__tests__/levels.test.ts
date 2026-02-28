import { describe, it, expect } from 'vitest'
import { LEVELS, getLevelForXP, getNextLevel, getXPProgress } from '../levels'

describe('levels', () => {
  it('has 10 levels', () => {
    expect(LEVELS.length).toBe(10)
  })

  it('starts at level 1 with 0 XP', () => {
    expect(LEVELS[0].level).toBe(1)
    expect(LEVELS[0].xp_required).toBe(0)
  })

  it('ends at level 10', () => {
    expect(LEVELS[LEVELS.length - 1].level).toBe(10)
  })

  it('has strictly ascending XP requirements', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xp_required).toBeGreaterThan(LEVELS[i - 1].xp_required)
    }
  })

  it('has unique titles', () => {
    const titles = LEVELS.map((l) => l.title)
    expect(new Set(titles).size).toBe(titles.length)
  })
})

describe('getLevelForXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelForXP(0).level).toBe(1)
  })

  it('returns level 1 for 99 XP', () => {
    expect(getLevelForXP(99).level).toBe(1)
  })

  it('returns level 2 for exactly 100 XP', () => {
    expect(getLevelForXP(100).level).toBe(2)
  })

  it('returns max level for very high XP', () => {
    expect(getLevelForXP(999999).level).toBe(10)
  })

  it('returns correct level at each threshold', () => {
    for (const level of LEVELS) {
      expect(getLevelForXP(level.xp_required).level).toBe(level.level)
    }
  })

  it('returns level 1 for negative XP', () => {
    expect(getLevelForXP(-50).level).toBe(1)
  })
})

describe('getNextLevel', () => {
  it('returns level 2 for current level 1', () => {
    expect(getNextLevel(1)?.level).toBe(2)
  })

  it('returns null for max level', () => {
    expect(getNextLevel(10)).toBeNull()
  })

  it('returns the subsequent level for each non-max level', () => {
    for (let i = 1; i < 10; i++) {
      expect(getNextLevel(i)?.level).toBe(i + 1)
    }
  })
})

describe('getXPProgress', () => {
  it('returns 0 progress at level start', () => {
    const progress = getXPProgress(0)
    expect(progress.current).toBe(0)
    expect(progress.needed).toBe(100) // next level is 100
    expect(progress.percent).toBe(0)
  })

  it('returns 50% progress midway through level', () => {
    const progress = getXPProgress(50) // halfway from 0 to 100
    expect(progress.current).toBe(50)
    expect(progress.needed).toBe(100)
    expect(progress.percent).toBe(50)
  })

  it('returns 100% at max level', () => {
    const progress = getXPProgress(20000)
    expect(progress.percent).toBe(100)
    expect(progress.needed).toBe(0)
  })

  it('caps percent at 100', () => {
    const progress = getXPProgress(999999)
    expect(progress.percent).toBe(100)
  })
})
