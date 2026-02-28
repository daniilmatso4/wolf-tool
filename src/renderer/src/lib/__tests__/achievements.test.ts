import { describe, it, expect } from 'vitest'
import { ACHIEVEMENT_DEFS } from '../achievements'

describe('achievements', () => {
  it('has unique ids', () => {
    const ids = ACHIEVEMENT_DEFS.map((a) => a.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('has unique names', () => {
    const names = ACHIEVEMENT_DEFS.map((a) => a.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('all have positive requirements', () => {
    for (const a of ACHIEVEMENT_DEFS) {
      expect(a.requirement).toBeGreaterThan(0)
    }
  })

  it('all reference valid stat fields', () => {
    const validFields = ['total_calls', 'total_emails', 'total_meetings', 'total_deals', 'total_leads', 'streak_days']
    for (const a of ACHIEVEMENT_DEFS) {
      expect(validFields).toContain(a.field)
    }
  })

  it('all have valid categories', () => {
    const validCategories = ['calls', 'emails', 'deals', 'streak', 'leads', 'meetings', 'misc']
    for (const a of ACHIEVEMENT_DEFS) {
      expect(validCategories).toContain(a.category)
    }
  })

  it('has achievements across different categories', () => {
    const categories = new Set(ACHIEVEMENT_DEFS.map((a) => a.category))
    expect(categories.size).toBeGreaterThanOrEqual(5)
  })

  it('all have non-empty icon', () => {
    for (const a of ACHIEVEMENT_DEFS) {
      expect(a.icon.length).toBeGreaterThan(0)
    }
  })

  it('all have description', () => {
    for (const a of ACHIEVEMENT_DEFS) {
      expect(a.description.length).toBeGreaterThan(0)
    }
  })

  it('achievements within same category have ascending requirements', () => {
    const byCategory = new Map<string, typeof ACHIEVEMENT_DEFS>()
    for (const a of ACHIEVEMENT_DEFS) {
      if (!byCategory.has(a.category)) byCategory.set(a.category, [])
      byCategory.get(a.category)!.push(a)
    }
    for (const [, achievements] of byCategory) {
      if (achievements.length < 2) continue
      const sorted = [...achievements].sort((a, b) => a.requirement - b.requirement)
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].requirement).toBeGreaterThan(sorted[i - 1].requirement)
      }
    }
  })
})
