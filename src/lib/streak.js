export const BIG3_STREAK_START = '2026-04-24'

/**
 * Returns true if a daily_big3 row counts as "complete".
 * At least one task must be set, and all SET tasks must be marked done.
 * @param {object|null} row
 * @returns {boolean}
 */
export function isBig3Complete(row) {
  if (!row) return false
  // At least one task must be set
  if (!row.task_1 && !row.task_2 && !row.task_3) return false
  // All SET tasks must be done
  if (row.task_1 && !row.task_1_done) return false
  if (row.task_2 && !row.task_2_done) return false
  if (row.task_3 && !row.task_3_done) return false
  return true
}

/**
 * Computes updated streak values from a daily_big3 row.
 * Every day (Mon–Sun) is a streak day — weekends are NOT rest days.
 * Only applies on/after BIG3_STREAK_START; prior days never break the streak.
 *
 * @param {object} profile - current profile with current_streak, longest_streak
 * @param {object|null} big3Row - daily_big3 row for yesterday
 * @param {string} prevDayStr - YYYY-MM-DD of the day being evaluated
 * @returns {{ current_streak: number, longest_streak: number }}
 */
export function computeNewStreakFromBig3(profile, big3Row, prevDayStr) {
  // Pre-launch days never break streak
  if (prevDayStr < BIG3_STREAK_START) {
    return {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
    }
  }

  if (isBig3Complete(big3Row)) {
    const newStreak = profile.current_streak + 1
    return {
      current_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak, newStreak),
    }
  }

  // Missed or incomplete → reset
  return { current_streak: 0, longest_streak: profile.longest_streak }
}

/**
 * @deprecated Use simple yesterday (today - 1 day) instead.
 * Kept for reference only — no longer called.
 */
export function getPreviousWeekday(today = new Date()) {
  const d = new Date(today)
  const day = d.getDay()
  if (day === 1) {
    d.setDate(d.getDate() - 3) // Mon → Fri
  } else if (day === 0) {
    d.setDate(d.getDate() - 2) // Sun → Fri
  } else if (day === 6) {
    d.setDate(d.getDate() - 1) // Sat → Fri
  } else {
    d.setDate(d.getDate() - 1) // Tue-Fri → previous day
  }
  return d
}
