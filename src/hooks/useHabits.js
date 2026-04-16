import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toDateStr } from '../lib/dates'

export function useHabits(userId) {
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)

  const getNinetyDaysAgoStr = () => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return toDateStr(d)
  }

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)

      const { data: habitData, error: habitErr } = await supabase
        .from('habits')
        .select('*, arenas(id, name, slug, emoji)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at')

      if (habitErr) throw habitErr
      setHabits(habitData || [])

      const ninetyDaysAgoStr = getNinetyDaysAgoStr()
      const { data: compData, error: compErr } = await supabase
        .from('habit_completions')
        .select('id, habit_id, completed_date')
        .eq('user_id', userId)
        .gte('completed_date', ninetyDaysAgoStr)

      if (compErr) throw compErr
      setCompletions(compData || [])
    } catch (err) {
      console.error('useHabits fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  function getHabitCompletions(habitId) {
    return completions
      .filter(c => c.habit_id === habitId)
      .map(c => c.completed_date)
  }

  function getFormationProgress(habitId) {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return { daysCompleted: 0, totalDays: 66, pct: 0, isGraduated: false }

    const startDate = habit.start_date
    const habitCompletions = getHabitCompletions(habitId)
    const daysCompleted = habitCompletions.filter(d => d >= startDate).length
    const capped = Math.min(daysCompleted, 66)
    const pct = (capped / 66) * 100
    const isGraduated = capped >= 66

    return { daysCompleted: capped, totalDays: 66, pct, isGraduated }
  }

  async function toggleHabitDay(habitId, dateStr) {
    if (!userId) return

    const existing = completions.find(
      c => c.habit_id === habitId && c.completed_date === dateStr
    )

    if (existing) {
      // Optimistic delete
      setCompletions(prev => prev.filter(c => c.id !== existing.id))

      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id)
        .eq('user_id', userId)

      if (error) {
        // Rollback
        setCompletions(prev => [...prev, existing])
        throw error
      }
    } else {
      // Optimistic insert
      const tempId = `temp-${Date.now()}`
      const optimistic = { id: tempId, habit_id: habitId, completed_date: dateStr }
      setCompletions(prev => [...prev, optimistic])

      const { data, error } = await supabase
        .from('habit_completions')
        .insert({ user_id: userId, habit_id: habitId, completed_date: dateStr })
        .select()
        .single()

      if (error) {
        // Rollback
        setCompletions(prev => prev.filter(c => c.id !== tempId))
        throw error
      }

      setCompletions(prev => prev.map(c => c.id === tempId ? data : c))
    }
  }

  async function addHabit(data) {
    if (!userId) return

    const { error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || null,
        arena_id: data.arena_id,
        target_days_per_week: data.target_days_per_week,
        start_date: data.start_date,
      })

    if (error) throw error
    await fetchData()
  }

  async function deleteHabit(habitId) {
    if (!userId) return

    // Optimistic remove
    setHabits(prev => prev.filter(h => h.id !== habitId))

    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', habitId)
      .eq('user_id', userId)

    if (error) {
      await fetchData()
      throw error
    }
  }

  return {
    habits,
    getHabitCompletions,
    getFormationProgress,
    toggleHabitDay,
    addHabit,
    deleteHabit,
    loading,
  }
}
