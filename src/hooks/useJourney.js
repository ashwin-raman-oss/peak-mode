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
    if (error) { console.error('[useJourney] fetch error:', error); setLoading(false); return }

    if (!data) {
      // Auto-create on first load so updateJourneyProgress always has a row to update
      const { data: created, error: createErr } = await supabase
        .from('journey')
        .insert({
          user_id: userId,
          chapter: 1,
          chapter_name: 'The Basecamp',
          scene_day: 0,
          deterioration_level: 0,
          total_days_completed: 0,
        })
        .select().single()
      if (createErr) console.error('[useJourney] auto-create error:', createErr)
      setJourney(created ?? null)
    } else {
      setJourney(data)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchJourney() }, [fetchJourney])

  // tasksToday is passed explicitly from the caller so it's always fresh
  async function updateJourneyProgress(tasksToday = { career: 0, health: 0, other: 0 }) {
    if (!userId || !journey) return
    const todayStr = new Date().toLocaleDateString('en-CA')

    const current = journey

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
    }

    const big3Complete = todayBig3 &&
      (todayBig3.task_1 || todayBig3.task_2 || todayBig3.task_3) &&
      (!todayBig3.task_1 || todayBig3.task_1_done) &&
      (!todayBig3.task_2 || todayBig3.task_2_done) &&
      (!todayBig3.task_3 || todayBig3.task_3_done)

    let todayGain = 0
    if (big3Complete && journalDoneToday) todayGain += 1
    else if (big3Complete || journalDoneToday) todayGain += 0.5

    const careerDone = tasksToday?.career ?? 0
    const healthDone = tasksToday?.health ?? 0
    const otherDone  = tasksToday?.other  ?? 0

    if (careerDone > 0) todayGain += 0.5
    if (healthDone > 0) todayGain += 0.5
    if (otherDone  > 0) todayGain += Math.min(0.5, otherDone * 0.1)

    // Don't write if there's nothing to credit yet and no deterioration to record.
    // This prevents an early-morning page load (before any work is done) from
    // locking last_active_date=today with gain=0, which would block the real update.
    if (todayGain === 0 && newDeteriorationLevel === 0) return

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

  // Debug utility: force-advance one scene day (used by ?debug=true UI only)
  async function debugAdvanceDay() {
    if (!userId || !journey) return
    const { data, error } = await supabase
      .from('journey')
      .update({
        scene_day: Math.min(CHAPTER_1_DAYS, journey.scene_day + 1),
        last_active_date: null,
        total_days_completed: journey.total_days_completed + 1,
      })
      .eq('user_id', userId)
      .select().single()
    if (error) { console.error('[useJourney] debugAdvanceDay error:', error); return }
    setJourney(data)
  }

  return { journey, loading, updateJourneyProgress, debugAdvanceDay, refresh: fetchJourney }
}
