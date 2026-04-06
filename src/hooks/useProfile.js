import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getLevel } from '../lib/xp'
import { getPreviousWeekday, computeNewStreak } from '../lib/streak'
import { toDateStr } from '../lib/dates'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAndEvaluateStreak = useCallback(async () => {
    if (!userId) return
    try {
      // Fetch profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileErr) throw profileErr

      const today = toDateStr(new Date())

      // Only evaluate streak if we haven't done it today
      if (profileData.last_active_date !== today) {
        const prevDay = getPreviousWeekday(new Date())
        const prevDayStr = toDateStr(prevDay)

        // Get high-priority daily task IDs
        const { data: highTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', userId)
          .eq('recurrence', 'daily')
          .eq('priority', 'high')
          .eq('is_active', true)

        const highTaskIds = (highTasks || []).map(t => t.id)

        // Get completions on previous weekday
        const { data: prevCompletions } = await supabase
          .from('task_completions')
          .select('task_id')
          .eq('user_id', userId)
          .gte('completed_at', prevDayStr + 'T00:00:00Z')
          .lt('completed_at', prevDayStr + 'T23:59:59Z')

        const prevTaskIds = (prevCompletions || []).map(c => c.task_id)

        const streakUpdate = computeNewStreak(profileData, highTaskIds, prevTaskIds)
        const newLevel = getLevel(profileData.total_xp)

        const updates = {
          ...streakUpdate,
          level: newLevel,
          last_active_date: today,
        }

        const { data: updated, error: updateErr } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single()

        if (!updateErr) {
          setProfile(updated)
          setLoading(false)
          return
        }
      }

      setProfile(profileData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchAndEvaluateStreak()
  }, [fetchAndEvaluateStreak])

  async function addXp(xpAmount) {
    if (!profile) return
    const newTotalXp = profile.total_xp + xpAmount
    const newLevel = getLevel(newTotalXp)
    const prevLevel = getLevel(profile.total_xp)

    const { data, error } = await supabase
      .from('profiles')
      .update({
        total_xp: newTotalXp,
        level: newLevel,
        last_active_date: toDateStr(new Date()),
      })
      .eq('user_id', profile.user_id)
      .select()
      .single()

    if (!error) setProfile(data)
    return { leveledUp: newLevel > prevLevel, newLevel }
  }

  return { profile, loading, error, addXp, refetch: fetchAndEvaluateStreak }
}
