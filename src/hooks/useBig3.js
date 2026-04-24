import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const BIG3_START_DATE = '2026-04-24'

export function useBig3(userId, weekStartStr = null) {
  const [big3ByDate, setBig3ByDate] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    let q = supabase
      .from('daily_big3')
      .select('*')
      .eq('user_id', userId)

    if (weekStartStr) {
      const end = new Date(weekStartStr + 'T00:00:00Z')
      end.setUTCDate(end.getUTCDate() + 7)
      const weekEndStr = end.toISOString().slice(0, 10)
      const rangeStart = weekStartStr < BIG3_START_DATE ? BIG3_START_DATE : weekStartStr
      q = q.gte('date', rangeStart).lt('date', weekEndStr)
    } else {
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      q = q.eq('date', today)
    }

    const { data, error } = await q
    if (error) {
      console.error('[useBig3] fetch error:', error)
    }
    const map = {}
    for (const r of (data || [])) map[r.date] = r
    setBig3ByDate(map)
    setLoading(false)
  }, [userId, weekStartStr])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveBig3(date, { task_1, task_2, task_3 }) {
    const payload = {
      user_id: userId,
      date,
      task_1: task_1 || null,
      task_2: task_2 || null,
      task_3: task_3 || null,
    }
    console.log('[useBig3] saveBig3 payload:', payload)

    const { data, error } = await supabase
      .from('daily_big3')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) {
      console.error('[useBig3] saveBig3 error:', error)
      console.error('[useBig3] saveBig3 error detail:', JSON.stringify(error))
      throw error
    }

    console.log('[useBig3] saveBig3 saved row:', data)
    // Update state with the row returned from Supabase, not the input
    setBig3ByDate(prev => ({ ...prev, [date]: data }))
  }

  async function markItemDone(date, itemNum, done) {
    const field = `task_${itemNum}_done`

    // Optimistic update so UI reflects change immediately
    setBig3ByDate(prev => ({
      ...prev,
      [date]: prev[date] ? { ...prev[date], [field]: done } : prev[date],
    }))

    const { data, error } = await supabase
      .from('daily_big3')
      .update({ [field]: done })
      .eq('user_id', userId)
      .eq('date', date)
      .select()
      .single()

    if (error) {
      console.error('[useBig3] markItemDone error:', error)
      // Revert optimistic update on failure
      setBig3ByDate(prev => ({
        ...prev,
        [date]: prev[date] ? { ...prev[date], [field]: !done } : prev[date],
      }))
      throw error
    }

    setBig3ByDate(prev => ({ ...prev, [date]: data }))
  }

  return { big3ByDate, loading, saveBig3, markItemDone, refresh: fetchData }
}
