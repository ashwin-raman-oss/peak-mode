import { describe, it, expect } from 'vitest'
import { getLevel, getXpInLevel, getXpToNextLevel, getXpForPriority } from '../lib/xp'

describe('getLevel', () => {
  it('returns 1 at 0 XP', () => expect(getLevel(0)).toBe(1))
  it('returns 1 at 999 XP', () => expect(getLevel(999)).toBe(1))
  it('returns 2 at 1000 XP', () => expect(getLevel(1000)).toBe(2))
  it('returns 2 at 1999 XP', () => expect(getLevel(1999)).toBe(2))
  it('returns 3 at 2000 XP', () => expect(getLevel(2000)).toBe(3))
  it('returns 11 at 10000 XP', () => expect(getLevel(10000)).toBe(11))
})

describe('getXpInLevel', () => {
  it('returns 0 at 0 XP', () => expect(getXpInLevel(0)).toBe(0))
  it('returns 500 at 1500 XP', () => expect(getXpInLevel(1500)).toBe(500))
  it('returns 0 at exact level boundary', () => expect(getXpInLevel(2000)).toBe(0))
  it('returns 999 just before level up', () => expect(getXpInLevel(1999)).toBe(999))
})

describe('getXpToNextLevel', () => {
  it('returns 1000 at 0 XP', () => expect(getXpToNextLevel(0)).toBe(1000))
  it('returns 500 at 1500 XP', () => expect(getXpToNextLevel(1500)).toBe(500))
  it('returns 1000 at exact level boundary', () => expect(getXpToNextLevel(2000)).toBe(1000))
})

describe('getXpForPriority', () => {
  it('high = 100', () => expect(getXpForPriority('high')).toBe(100))
  it('medium = 60', () => expect(getXpForPriority('medium')).toBe(60))
  it('optional = 30', () => expect(getXpForPriority('optional')).toBe(30))
  it('falls back to 30 for unknown', () => expect(getXpForPriority('unknown')).toBe(30))
})
