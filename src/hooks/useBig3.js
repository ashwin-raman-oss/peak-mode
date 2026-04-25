import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const BIG3_START_DATE = '2026-04-24'

function getTodayStr() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function useBig3(userId) {
  const [todayBig3, setTodayBig3] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchToday = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    const todayStr = getTodayStr()
    setLoading(true)
    const { data, error } = await supabase
      .from('daily_big3')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayStr)
      .maybeSingle()

    if (error) {
      console.error('[useBig3] fetchToday error:', error)
    } else {
      console.log('[useBig3] fetched:', data)
      setTodayBig3(data ?? null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  async function saveBig3(task1, task2, task3) {
    if (!userId) return
    const todayStr = getTodayStr()
    const payload = {
      user_id: userId,
      date: todayStr,
      task_1: task1 || null,
      task_2: task2 || null,
      task_3: task3 || null,
    }
    console.log('[useBig3] saving payload:', payload)
    const { data, error } = await supabase
      .from('daily_big3')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) {
      console.error('[useBig3] save error:', JSON.stringify(error))
      throw error
    }
    console.log('[useBig3] saved row:', data)
    setTodayBig3(data)
    return data
  }

  async function markItemDone(itemNum, done) {
    if (!userId || !todayBig3) return
    const field = `task_${itemNum}_done`
    const fieldAt = `task_${itemNum}_done_at`
    const optimistic = { ...todayBig3, [field]: done, [fieldAt]: done ? new Date().toISOString() : null }
    setTodayBig3(optimistic)

    const { data, error } = await supabase
      .from('daily_big3')
      .update({ [field]: done, [fieldAt]: done ? new Date().toISOString() : null })
      .eq('id', todayBig3.id)
      .select()
      .single()

    if (error) {
      console.error('[useBig3] markItemDone error:', JSON.stringify(error))
      setTodayBig3(todayBig3) // rollback
    } else {
      setTodayBig3(data)
    }
  }

  async function getWeekBig3(weekStartStr) {
    if (!userId) return []
    // Parse as local noon to avoid timezone-driven day shift
    const weekEnd = new Date(weekStartStr + 'T12:00:00')
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth()+1).padStart(2,'0')}-${String(weekEnd.getDate()).padStart(2,'0')}`
    const { data, error } = await supabase
      .from('daily_big3')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .order('date')
    if (error) console.error('[useBig3] getWeekBig3 error:', error)
    return data ?? []
  }

  return { todayBig3, loading, saveBig3, markItemDone, getWeekBig3, refresh: fetchToday }
}
