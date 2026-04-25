import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toDateStr } from '../lib/dates'

function getNinetyDaysAgoStr() {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return toDateStr(d)
}

export function useJournal(userId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('date', getNinetyDaysAgoStr())
      .order('date', { ascending: false })

    if (!error && data) setEntries(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  return { entries, loading, refresh: fetchEntries }
}
