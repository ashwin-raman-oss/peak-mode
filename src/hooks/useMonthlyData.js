import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toDateStr, getWeekStart } from '../lib/dates'

export function useMonthlyData(userId, year, month) {
  const [dailyStatus, setDailyStatus] = useState({})
  const [dailyCompletions, setDailyCompletions] = useState({})
  const [monthStats, setMonthStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const firstDay = new Date(Date.UTC(year, month - 1, 1))
    const lastDay  = new Date(Date.UTC(year, month, 1))
    const firstDayStr = toDateStr(firstDay)
    const lastDayStr  = toDateStr(lastDay)

    // Local date range for Big3 (date column is local YYYY-MM-DD)
    const big3FirstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const big3NextYear  = month === 12 ? year + 1 : year
    const big3NextMonth = month === 12 ? 1 : month + 1
    const big3LastDay = `${big3NextYear}-${String(big3NextMonth).padStart(2, '0')}-01`

    const [{ data: completions }, { data: highTasks }, { data: big3Data }] = await Promise.all([
      supabase
        .from('task_completions')
        .select('id, task_id, completed_at, xp_earned, tasks(title, arenas(slug))')
        .eq('user_id', userId)
        .gte('completed_at', firstDayStr + 'T00:00:00Z')
        .lt('completed_at', lastDayStr + 'T00:00:00Z'),
      supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('recurrence', 'daily')
        .eq('priority', 'high'),
      supabase
        .from('daily_big3')
        .select('date, task_1, task_2, task_3, task_1_done, task_2_done, task_3_done')
        .eq('user_id', userId)
        .gte('date', big3FirstDay)
        .lt('date', big3LastDay),
    ])

    const highTaskIds = new Set((highTasks || []).map(t => t.id))
    const highCount   = highTaskIds.size

    // Group completions by date
    const byDate = {}
    const completionsByDate = {}
    for (const c of (completions || [])) {
      const d = c.completed_at.slice(0, 10)
      if (!byDate[d]) byDate[d] = { count: 0, xp: 0, highDone: 0 }
      byDate[d].count++
      byDate[d].xp += c.xp_earned
      if (highTaskIds.has(c.task_id)) byDate[d].highDone++

      if (!completionsByDate[d]) completionsByDate[d] = []
      completionsByDate[d].push({
        title: c.tasks?.title ?? 'Task',
        arenaSlug: c.tasks?.arenas?.slug ?? 'misc',
      })
    }

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const statusMap = {}

    for (let d = 1; d <= daysInMonth; d++) {
      const date    = new Date(Date.UTC(year, month - 1, d))
      const dateStr = toDateStr(date)
      const dow     = date.getUTCDay()
      const isWeekend = dow === 0 || dow === 6
      const isFuture  = dateStr > today
      const day       = byDate[dateStr]

      let status
      if (isFuture) {
        status = 'future'
      } else if (isWeekend) {
        status = 'weekend'
      } else if (highCount === 0) {
        status = day?.count ? 'full' : 'missed'
      } else if ((day?.highDone ?? 0) >= highCount) {
        status = 'full'
      } else if ((day?.highDone ?? 0) > 0) {
        status = 'partial'
      } else {
        status = 'missed'
      }

      statusMap[dateStr] = {
        status,
        completed: day?.count ?? 0,
        highTotal: isWeekend || isFuture ? 0 : highCount,
        xp: day?.xp ?? 0,
      }
    }

    // Prepend Big3 items at the front of each day's completions
    for (const b3 of (big3Data || [])) {
      const items = [
        { text: b3.task_1, done: !!b3.task_1_done },
        { text: b3.task_2, done: !!b3.task_2_done },
        { text: b3.task_3, done: !!b3.task_3_done },
      ].filter(item => item.text)
      if (items.length === 0) continue
      const big3Items = items.map(item => ({
        title: item.text,
        arenaSlug: 'big3',
        isDone: item.done,
      }))
      completionsByDate[b3.date] = [...big3Items, ...(completionsByDate[b3.date] ?? [])]
    }

    setDailyStatus(statusMap)
    setDailyCompletions(completionsByDate)

    const allComp = completions || []
    const totalXp    = allComp.reduce((s, c) => s + c.xp_earned, 0)
    const totalTasks = allComp.length

    const weekdayEntries = Object.values(statusMap).filter(s => s.status !== 'weekend' && s.status !== 'future')
    const fullDays = weekdayEntries.filter(s => s.status === 'full').length
    const completionRate = weekdayEntries.length > 0 ? Math.round((fullDays / weekdayEntries.length) * 100) : 0

    const weekMap = {}
    for (const [dateStr, data] of Object.entries(statusMap)) {
      const weekStart = toDateStr(getWeekStart(new Date(dateStr + 'T00:00:00Z')))
      if (!weekMap[weekStart]) weekMap[weekStart] = { weekStart, completed: 0, total: 0, xp: 0 }
      if (data.status !== 'future') {
        weekMap[weekStart].completed += data.completed
        weekMap[weekStart].xp += data.xp
        if (data.status !== 'weekend') weekMap[weekStart].total += highCount
      }
    }

    const weeksData = Object.values(weekMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    const nonEmpty  = weeksData.filter(w => w.total > 0)
    const bestWeek  = nonEmpty.length ? nonEmpty.reduce((b, w) => w.completed > b.completed ? w : b, nonEmpty[0]) : null
    const worstWeek = nonEmpty.length ? nonEmpty.reduce((b, w) => w.completed < b.completed ? w : b, nonEmpty[0]) : null

    setMonthStats({ totalTasks, totalXp, weeksData, completionRate, bestWeek, worstWeek })
    setLoading(false)
  }, [userId, year, month])

  useEffect(() => { fetchData() }, [fetchData])

  return { dailyStatus, dailyCompletions, monthStats, loading, refresh: fetchData }
}
