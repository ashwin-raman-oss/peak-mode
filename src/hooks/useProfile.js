import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getLevel } from '../lib/xp'
import { isBig3Complete, BIG3_STREAK_START } from '../lib/streak'
import { toDateStr } from '../lib/dates'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAndEvaluateStreak = useCallback(async () => {
    if (!userId) return
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileErr) throw profileErr

      const today = toDateStr(new Date())

      if (profileData.last_active_date !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = toDateStr(yesterday)

        let streakUpdate
        if (today < BIG3_STREAK_START) {
          // Pre-launch: don't evaluate streak at all, leave unchanged
          streakUpdate = {
            current_streak: profileData.current_streak,
            longest_streak: profileData.longest_streak,
          }
        } else {
          // Post-launch: fetch both today's and yesterday's Big 3 rows
          const [{ data: todayRow }, { data: yesterdayRow }] = await Promise.all([
            supabase
              .from('daily_big3')
              .select('task_1, task_2, task_3, task_1_done, task_2_done, task_3_done')
              .eq('user_id', userId)
              .eq('date', today)
              .maybeSingle(),
            supabase
              .from('daily_big3')
              .select('task_1, task_2, task_3, task_1_done, task_2_done, task_3_done')
              .eq('user_id', userId)
              .eq('date', yesterdayStr)
              .maybeSingle(),
          ])

          if (isBig3Complete(todayRow)) {
            // Today's Big 3 is fully done — increment streak
            const newStreak = profileData.current_streak + 1
            streakUpdate = {
              current_streak: newStreak,
              longest_streak: Math.max(profileData.longest_streak, newStreak),
            }
          } else if (isBig3Complete(yesterdayRow) && profileData.last_active_date === yesterdayStr) {
            // Yesterday was done and already counted — keep streak, just refresh last_active_date
            streakUpdate = {
              current_streak: profileData.current_streak,
              longest_streak: profileData.longest_streak,
            }
          } else {
            // Neither today nor a valid yesterday continuation — reset
            streakUpdate = {
              current_streak: 0,
              longest_streak: profileData.longest_streak,
            }
          }

          console.log('[streak]', {
            today,
            yesterdayStr,
            todayRow,
            yesterdayRow,
            lastActiveDate: profileData.last_active_date,
            streakResult: streakUpdate,
          })
        }

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

    const { data, error: xpErr } = await supabase
      .from('profiles')
      .update({
        total_xp: newTotalXp,
        level: newLevel,
        last_active_date: toDateStr(new Date()),
      })
      .eq('user_id', profile.user_id)
      .select()
      .single()

    if (xpErr) throw xpErr
    setProfile(data)
    return { leveledUp: newLevel > prevLevel, newLevel }
  }

  return { profile, loading, error, addXp, refetch: fetchAndEvaluateStreak }
}
