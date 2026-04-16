import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useJournal(userId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchEntries() {
      setLoading(true)
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (!error && data) {
        setEntries(data)
      }
      setLoading(false)
    }

    fetchEntries()
  }, [userId])

  return { entries, loading }
}
