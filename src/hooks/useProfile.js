import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getLevel } from '../lib/xp'
import { toDateStr } from '../lib/dates'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileErr) throw profileErr

      const today = toDateStr(new Date())

      // On first visit each day, sync level and last_active_date
      if (profileData.last_active_date !== today) {
        const newLevel = getLevel(profileData.total_xp)
        const { data: updated, error: updateErr } = await supabase
          .from('profiles')
          .update({ level: newLevel, last_active_date: today })
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
    fetchProfile()
  }, [fetchProfile])

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

  return { profile, loading, error, addXp, refetch: fetchProfile }
}
