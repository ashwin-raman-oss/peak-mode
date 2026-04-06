import { describe, it, expect } from 'vitest'
import {
  getWeekStart,
  isWeekday,
  formatWeekRange,
  toDateStr,
  isCompletedToday,
  getWeeklyCompletionCount,
  isCompletedThisWeek,
} from '../lib/dates'

describe('getWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    const wed = new Date('2026-04-08') // Wednesday
    expect(toDateStr(getWeekStart(wed))).toBe('2026-04-06')
  })
  it('returns self when given Monday', () => {
    const mon = new Date('2026-04-06')
    expect(toDateStr(getWeekStart(mon))).toBe('2026-04-06')
  })
  it('returns Monday for Sunday', () => {
    const sun = new Date('2026-04-12') // Sunday
    expect(toDateStr(getWeekStart(sun))).toBe('2026-04-06')
  })
})

describe('isWeekday', () => {
  it('Monday is a weekday', () => expect(isWeekday(new Date('2026-04-06'))).toBe(true))
  it('Friday is a weekday', () => expect(isWeekday(new Date('2026-04-10'))).toBe(true))
  it('Saturday is not a weekday', () => expect(isWeekday(new Date('2026-04-11'))).toBe(false))
  it('Sunday is not a weekday', () => expect(isWeekday(new Date('2026-04-12'))).toBe(false))
})

describe('formatWeekRange', () => {
  it('formats week range from Monday', () => {
    expect(formatWeekRange(new Date('2026-04-06'))).toBe('Apr 6 – Apr 10')
  })
})

describe('isCompletedToday', () => {
  it('returns true when task has completion today', () => {
    const today = new Date().toISOString().slice(0, 10)
    const completions = [{ task_id: 'abc', completed_at: today + 'T10:00:00Z' }]
    expect(isCompletedToday(completions, 'abc')).toBe(true)
  })
  it('returns false when no completion today', () => {
    const completions = [{ task_id: 'abc', completed_at: '2020-01-01T10:00:00Z' }]
    expect(isCompletedToday(completions, 'abc')).toBe(false)
  })
  it('returns false for different task_id', () => {
    const today = new Date().toISOString().slice(0, 10)
    const completions = [{ task_id: 'xyz', completed_at: today + 'T10:00:00Z' }]
    expect(isCompletedToday(completions, 'abc')).toBe(false)
  })
})

describe('getWeeklyCompletionCount', () => {
  it('counts completions with matching week_start_date', () => {
    const completions = [
      { task_id: 'str', week_start_date: '2026-04-06' },
      { task_id: 'str', week_start_date: '2026-04-06' },
      { task_id: 'str', week_start_date: '2026-03-30' },
    ]
    expect(getWeeklyCompletionCount(completions, 'str', '2026-04-06')).toBe(2)
  })
})

describe('isCompletedThisWeek', () => {
  it('true when count meets target', () => {
    const completions = [
      { task_id: 't1', week_start_date: '2026-04-06' },
      { task_id: 't1', week_start_date: '2026-04-06' },
    ]
    expect(isCompletedThisWeek(completions, 't1', 2, '2026-04-06')).toBe(true)
  })
  it('false when count below target', () => {
    const completions = [{ task_id: 't1', week_start_date: '2026-04-06' }]
    expect(isCompletedThisWeek(completions, 't1', 2, '2026-04-06')).toBe(false)
  })
})
