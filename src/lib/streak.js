export const BIG3_STREAK_START = '2026-04-24'

/**
 * Returns the most recent previous weekday (Mon–Fri), skipping weekends.
 * All date arithmetic is performed in UTC to avoid timezone-dependent results.
 * @param {Date} [today=new Date()] - reference date (injectable for testing)
 * @returns {Date}
 */
export function getPreviousWeekday(today = new Date()) {
  const d = new Date(today)
  const day = d.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  if (day === 1) {
    d.setUTCDate(d.getUTCDate() - 3) // Mon → Fri
  } else if (day === 0) {
    d.setUTCDate(d.getUTCDate() - 2) // Sun → Fri
  } else if (day === 6) {
    d.setUTCDate(d.getUTCDate() - 1) // Sat → Fri
  } else {
    d.setUTCDate(d.getUTCDate() - 1) // Tue-Fri → previous day
  }
  return d
}

/**
 * Computes streak from a daily_big3 row.
 * A streak day = Big 3 was set AND all set items are marked done.
 * Only applies on/after BIG3_STREAK_START; prior days never break the streak.
 *
 * @param {object} profile - current profile with current_streak, longest_streak
 * @param {object|null} big3Row - daily_big3 row for the previous weekday (null = not set)
 * @param {string} prevDayStr - YYYY-MM-DD of the previous weekday being evaluated
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

  // No Big 3 set → missed day → reset
  if (!big3Row) {
    return { current_streak: 0, longest_streak: profile.longest_streak }
  }

  const setItems = [
    { text: big3Row.item_1, done: big3Row.item_1_done },
    { text: big3Row.item_2, done: big3Row.item_2_done },
    { text: big3Row.item_3, done: big3Row.item_3_done },
  ].filter(i => i.text)

  // Big 3 row exists but nothing was filled in → treat as missed
  if (setItems.length === 0) {
    return { current_streak: 0, longest_streak: profile.longest_streak }
  }

  const allDone = setItems.every(i => i.done)

  if (allDone) {
    const newStreak = profile.current_streak + 1
    return {
      current_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak, newStreak),
    }
  }

  return { current_streak: 0, longest_streak: profile.longest_streak }
}
