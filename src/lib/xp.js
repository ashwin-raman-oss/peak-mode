const XP_PER_LEVEL = 1000

export function getLevel(totalXp) {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1
}

export function getXpInLevel(totalXp) {
  return totalXp % XP_PER_LEVEL
}

export function getXpToNextLevel(totalXp) {
  return XP_PER_LEVEL - getXpInLevel(totalXp)
}

export function getXpForPriority(priority) {
  const map = { high: 100, medium: 60, optional: 30 }
  return map[priority] ?? 30
}
