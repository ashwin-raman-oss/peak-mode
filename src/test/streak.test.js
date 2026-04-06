import { describe, it, expect } from 'vitest'
import { getPreviousWeekday, computeNewStreak } from '../lib/streak'

describe('getPreviousWeekday', () => {
  it('Tuesday → Monday', () => {
    const result = getPreviousWeekday(new Date('2026-04-07')) // Tuesday
    expect(result.toISOString().slice(0, 10)).toBe('2026-04-06')
  })
  it('Monday → Friday', () => {
    const result = getPreviousWeekday(new Date('2026-04-06')) // Monday
    expect(result.toISOString().slice(0, 10)).toBe('2026-04-03')
  })
  it('Saturday → Friday', () => {
    const result = getPreviousWeekday(new Date('2026-04-11')) // Saturday
    expect(result.toISOString().slice(0, 10)).toBe('2026-04-10')
  })
  it('Sunday → Friday', () => {
    const result = getPreviousWeekday(new Date('2026-04-12')) // Sunday
    expect(result.toISOString().slice(0, 10)).toBe('2026-04-10')
  })
})

describe('computeNewStreak', () => {
  const profile = { current_streak: 5, longest_streak: 10 }

  it('increments streak when all high tasks completed', () => {
    const result = computeNewStreak(profile, ['t1', 't2'], ['t1', 't2'])
    expect(result.current_streak).toBe(6)
    expect(result.longest_streak).toBe(10)
  })

  it('updates longest_streak when streak exceeds it', () => {
    const big = { current_streak: 10, longest_streak: 10 }
    const result = computeNewStreak(big, ['t1'], ['t1'])
    expect(result.current_streak).toBe(11)
    expect(result.longest_streak).toBe(11)
  })

  it('resets streak when a high task was missed', () => {
    const result = computeNewStreak(profile, ['t1', 't2'], ['t1'])
    expect(result.current_streak).toBe(0)
    expect(result.longest_streak).toBe(10)
  })

  it('resets streak when no completions at all', () => {
    const result = computeNewStreak(profile, ['t1'], [])
    expect(result.current_streak).toBe(0)
  })

  it('does not increment if there are no high tasks (no-op)', () => {
    const result = computeNewStreak(profile, [], [])
    expect(result.current_streak).toBe(6)
  })
})
