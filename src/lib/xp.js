export const XP_PER_LEVEL = 1000

export function getLevel(totalXp) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1
}

export function getXpInLevel(totalXp) {
  return totalXp % XP_PER_LEVEL
}

// At an exact level boundary (e.g., 2000 XP total), this returns 1000 —
// the player just entered the new level with 0 progress in it, so 1000 remains.
export function getXpToNextLevel(totalXp) {
  return XP_PER_LEVEL - getXpInLevel(totalXp)
}

// XP awarded per completion: high=100, medium=60, optional=30
// Unknown or null priority falls back to 30 (optional tier)
export function getXpForPriority(priority) {
  const map = { high: 100, medium: 60, optional: 30 }
  return map[priority] ?? 30
}
