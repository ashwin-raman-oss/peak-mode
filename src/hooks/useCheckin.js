import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useCheckin(userId) {
  const [morningDone, setMorningDone] = useState(false)
  const [eveningDone, setEveningDone] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function fetchCheckins() {
      const today = getTodayDateString()
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('type')
        .eq('user_id', userId)
        .eq('date', today)

      if (error) {
        console.error('Failed to fetch checkins:', error)
        return
      }

      if (data) {
        setMorningDone(data.some(r => r.type === 'morning'))
        setEveningDone(data.some(r => r.type === 'evening'))
      }
    }

    fetchCheckins()
  }, [userId])

  async function saveCheckin(type, data) {
    if (!userId) return

    const today = getTodayDateString()
    const { error } = await supabase
      .from('daily_checkins')
      .upsert(
        { user_id: userId, date: today, type, ...data },
        { onConflict: 'user_id,date,type' }
      )

    if (error) {
      console.error('Failed to save checkin:', error)
      throw error
    }

    if (type === 'morning') setMorningDone(true)
    if (type === 'evening') setEveningDone(true)
  }

  return { morningDone, eveningDone, saveCheckin }
}
