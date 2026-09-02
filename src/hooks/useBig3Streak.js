import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function getLocalDateStr(date = new Date()) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getYesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getLocalDateStr(d)
}

function isBig3RowComplete(row) {
  if (!row) return false
  // At least one task must be set
  const hasAnyTask = row.task_1 || row.task_2 || row.task_3
  if (!hasAnyTask) return false
  // Every SET task must be done
  if (row.task_1 && !row.task_1_done) return false
  if (row.task_2 && !row.task_2_done) return false
  if (row.task_3 && !row.task_3_done) return false
  return true
}

export function useBig3Streak(userId) {
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function computeStreak() {
      setLoading(true)

      // Fetch all Big 3 rows for the last 60 days, ordered newest first
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      const startStr = getLocalDateStr(sixtyDaysAgo)
      const todayStr = getLocalDateStr()

      const { data: rows, error } = await supabase
        .from('daily_big3')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startStr)
        .lte('date', todayStr)
        .order('date', { ascending: false })

      if (error) {
        console.error('[useBig3Streak] fetch error:', error)
        setLoading(false)
        return
      }

      // Build a date → row map for O(1) lookup
      const dateMap = {}
      for (const row of (rows || [])) {
        dateMap[row.date] = row
      }

      let currentStreak = 0
      const checkDate = new Date()

      // If today is complete, count it and start walking from yesterday
      const todayRow = dateMap[todayStr]
      if (isBig3RowComplete(todayRow)) {
        currentStreak = 1
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        // Today not complete yet — start walking from yesterday
        checkDate.setDate(checkDate.getDate() - 1)
      }

      // Walk backwards: count consecutive complete days
      for (let i = 0; i < 60; i++) {
        const dateStr = getLocalDateStr(checkDate)
        const row = dateMap[dateStr]

        if (isBig3RowComplete(row)) {
          currentStreak++
        } else {
          // Incomplete row or no row — streak breaks
          break
        }

        checkDate.setDate(checkDate.getDate() - 1)
      }

      setStreak(currentStreak)
      setLoading(false)
    }

    computeStreak()
  }, [userId, refreshKey])

  return { streak, loading, refresh }
}
