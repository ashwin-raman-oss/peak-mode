// All date helpers use LOCAL time (device clock), not UTC.
// Stored date strings (YYYY-MM-DD) always reflect the user's local day.

export function toDateStr(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Explicit alias for clarity at call sites
export function getLocalDateStr(date = new Date()) {
  return toDateStr(date)
}

// Returns the Monday of the week containing `date`, using local time.
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() // local: 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day // shift so Mon = day 0
  d.setDate(d.getDate() + diff)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()) // local midnight
}

// Explicit alias for clarity
export function getLocalWeekStart(date = new Date()) {
  return getWeekStart(date)
}

export function isWeekday(date) {
  const day = new Date(date).getDay() // local
  return day >= 1 && day <= 5
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatWeekRange(weekStart) {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const sm = MONTH_NAMES[start.getMonth()]
  const em = MONTH_NAMES[end.getMonth()]
  return `${sm} ${start.getDate()} – ${em} ${end.getDate()}`
}

// `today` is injectable for deterministic testing; defaults to current local date
export function isCompletedToday(completions, taskId, today = new Date()) {
  const todayStr = toDateStr(today)
  return completions.some(
    c => c.task_id === taskId &&
         typeof c.completed_at === 'string' &&
         c.completed_at.slice(0, 10) === todayStr
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
