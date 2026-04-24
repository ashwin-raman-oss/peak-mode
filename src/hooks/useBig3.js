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
      .gte('date', BIG3_START_DATE)

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

    const { data } = await q
    const map = {}
    for (const r of (data || [])) map[r.date] = r
    setBig3ByDate(map)
    setLoading(false)
  }, [userId, weekStartStr])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveBig3(date, { item_1, item_2, item_3 }) {
    const { data, error } = await supabase
      .from('daily_big3')
      .upsert(
        { user_id: userId, date, item_1: item_1 || null, item_2: item_2 || null, item_3: item_3 || null },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()
    if (error) throw error
    setBig3ByDate(prev => ({ ...prev, [date]: data }))
  }

  return { big3ByDate, loading, saveBig3, refresh: fetchData }
}
