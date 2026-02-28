import { Level } from '../types/gamification'

export const LEVELS: Level[] = [
  { level: 1, title: 'Intern', xp_required: 0 },
  { level: 2, title: 'Junior Broker', xp_required: 100 },
  { level: 3, title: 'Broker', xp_required: 300 },
  { level: 4, title: 'Senior Broker', xp_required: 750 },
  { level: 5, title: 'Associate VP', xp_required: 1500 },
  { level: 6, title: 'Vice President', xp_required: 3000 },
  { level: 7, title: 'Senior VP', xp_required: 5000 },
  { level: 8, title: 'Managing Director', xp_required: 8000 },
  { level: 9, title: 'Partner', xp_required: 12000 },
  { level: 10, title: 'Wolf of Wall Street', xp_required: 20000 }
]

export function getLevelForXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp_required) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(currentLevel: number): Level | null {
  const idx = LEVELS.findIndex((l) => l.level === currentLevel)
  if (idx < LEVELS.length - 1) return LEVELS[idx + 1]
  return null
}

export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = getLevelForXP(xp)
  const next = getNextLevel(level.level)
  if (!next) return { current: xp - level.xp_required, needed: 0, percent: 100 }
  const current = xp - level.xp_required
  const needed = next.xp_required - level.xp_required
  return { current, needed, percent: Math.min(100, (current / needed) * 100) }
}
