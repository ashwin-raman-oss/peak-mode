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
 * Computes new streak values.
 * @param {object} profile - current profile with current_streak, longest_streak
 * @param {string[]} highDailyTaskIds - IDs of all active high-priority daily tasks
 * @param {string[]} yesterdayCompletedTaskIds - task IDs completed on prev weekday
 * @returns {{ current_streak: number, longest_streak: number }}
 */
export function computeNewStreak(profile, highDailyTaskIds, yesterdayCompletedTaskIds) {
  if (highDailyTaskIds.length === 0) {
    // No high tasks defined yet — treat as success, increment
    const newStreak = profile.current_streak + 1
    return {
      current_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak, newStreak),
    }
  }

  const allCompleted = highDailyTaskIds.every(id => yesterdayCompletedTaskIds.includes(id))

  if (allCompleted) {
    const newStreak = profile.current_streak + 1
    return {
      current_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak, newStreak),
    }
  }

  return {
    current_streak: 0,
    longest_streak: profile.longest_streak,
  }
}
