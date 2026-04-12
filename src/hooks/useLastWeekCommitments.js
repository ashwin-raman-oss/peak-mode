import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getWeekStart, toDateStr } from '../lib/dates'

export function useLastWeekCommitments(userId) {
  const [commitments, setCommitments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function fetchCommitments() {
      const thisWeekStart = getWeekStart(new Date())
      const prevWeekStart = new Date(thisWeekStart)
      prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7)
      const prevWeekStr = toDateStr(prevWeekStart)

      const { data } = await supabase
        .from('weekly_reports')
        .select('next_week_commitments')
        .eq('user_id', userId)
        .eq('week_start_date', prevWeekStr)
        .single()

      setCommitments(data?.next_week_commitments ?? [])
      setLoading(false)
    }

    fetchCommitments()
  }, [userId])

  return { commitments, loading }
}
