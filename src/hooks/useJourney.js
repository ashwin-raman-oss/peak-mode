import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const CHAPTER_1_DAYS = 30

export function useJourney(userId, todayBig3, tasksCompletedToday, journalDoneToday) {
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchJourney = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    const { data, error } = await supabase
      .from('journey')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) console.error('[useJourney] fetch error:', error)
    setJourney(data ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchJourney() }, [fetchJourney])

  async function updateJourneyProgress() {
    if (!userId) return
    const todayStr = new Date().toLocaleDateString('en-CA')

    let current = journey
    if (!current) {
      const { data, error } = await supabase
        .from('journey')
        .insert({ user_id: userId, chapter: 1, chapter_name: 'The Basecamp', scene_day: 0, last_active_date: null, deterioration_level: 0, total_days_completed: 0 })
        .select().single()
      if (error) { console.error('[useJourney] create error:', error); return }
      current = data
    }

    if (current.last_active_date === todayStr) return

    let daysMissed = 0
    if (current.last_active_date) {
      const last = new Date(current.last_active_date + 'T12:00:00')
      const today = new Date(todayStr + 'T12:00:00')
      daysMissed = Math.round((today - last) / (1000 * 60 * 60 * 24)) - 1
    }

    let newSceneDay = current.scene_day
    let newDeteriorationLevel = 0

    if (daysMissed >= 10) {
      newSceneDay = Math.max(0, newSceneDay - 20)
      newDeteriorationLevel = 3
    } else if (daysMissed >= 5) {
      newSceneDay = Math.max(0, newSceneDay - 10)
      newDeteriorationLevel = 2
    } else if (daysMissed >= 2) {
      newSceneDay = Math.max(0, newSceneDay - 3)
      newDeteriorationLevel = 1
    } else {
      newDeteriorationLevel = 0
    }

    const big3Complete = todayBig3 &&
      (!todayBig3.task_1 || todayBig3.task_1_done) &&
      (!todayBig3.task_2 || todayBig3.task_2_done) &&
      (!todayBig3.task_3 || todayBig3.task_3_done) &&
      (todayBig3.task_1 || todayBig3.task_2 || todayBig3.task_3)

    let todayGain = 0
    if (big3Complete && journalDoneToday) todayGain += 1
    else if (big3Complete || journalDoneToday) todayGain += 0.5

    const careerDone = tasksCompletedToday?.career ?? 0
    const healthDone = tasksCompletedToday?.health ?? 0
    const otherDone = tasksCompletedToday?.other ?? 0

    if (careerDone > 0) todayGain += 0.5
    if (healthDone > 0) todayGain += 0.5
    if (otherDone > 0) todayGain += Math.min(0.5, otherDone * 0.1)

    newSceneDay = Math.min(CHAPTER_1_DAYS, Math.round(newSceneDay + todayGain))

    const { data: updated, error: updateErr } = await supabase
      .from('journey')
      .update({
        scene_day: newSceneDay,
        last_active_date: todayStr,
        deterioration_level: newDeteriorationLevel,
        total_days_completed: current.total_days_completed + 1,
      })
      .eq('user_id', userId)
      .select().single()

    if (updateErr) { console.error('[useJourney] update error:', updateErr); return }
    setJourney(updated)
  }

  return { journey, loading, updateJourneyProgress, refresh: fetchJourney }
}
