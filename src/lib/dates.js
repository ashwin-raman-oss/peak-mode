export function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

export function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day // adjust so Mon=0
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function isWeekday(date) {
  const day = new Date(date).getUTCDay()
  return day >= 1 && day <= 5
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatWeekRange(weekStart) {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setUTCDate(end.getUTCDate() + 4) // Mon + 4 = Fri
  const sm = MONTH_NAMES[start.getUTCMonth()]
  const em = MONTH_NAMES[end.getUTCMonth()]
  return `${sm} ${start.getUTCDate()} – ${em} ${end.getUTCDate()}`
}

export function isCompletedToday(completions, taskId) {
  const today = new Date().toISOString().slice(0, 10)
  return completions.some(
    c => c.task_id === taskId && c.completed_at.slice(0, 10) === today
  )
}

export function getWeeklyCompletionCount(completions, taskId, weekStartStr) {
  return completions.filter(
    c => c.task_id === taskId && c.week_start_date === weekStartStr
  ).length
}

export function isCompletedThisWeek(completions, taskId, weeklyTarget, weekStartStr) {
  return getWeeklyCompletionCount(completions, taskId, weekStartStr) >= weeklyTarget
}
