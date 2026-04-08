import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getXpForPriority } from '../lib/xp'
import { getWeekStart, toDateStr, isCompletedToday, isCompletedThisWeek, getWeeklyCompletionCount } from '../lib/dates'

export function useTasks(userId, arenaSlug = null) {
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState([])
  const [arenas, setArenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const weekStart = getWeekStart(new Date())
  const weekStartStr = toDateStr(weekStart)

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)

      // Fetch arenas
      const { data: arenaData } = await supabase
        .from('arenas')
        .select('*')
        .order('name')

      setArenas(arenaData || [])

      // Build task query
      let taskQuery = supabase
        .from('tasks')
        .select('*, arenas(id, name, emoji, slug, default_priority)')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (arenaSlug) {
        const arena = (arenaData || []).find(a => a.slug === arenaSlug)
        if (arena) taskQuery = taskQuery.eq('arena_id', arena.id)
      }

      const { data: taskData, error: taskErr } = await taskQuery.order('created_at')
      if (taskErr) throw taskErr

      setTasks(taskData || [])

      // Fetch this week's completions
      const { data: compData, error: compErr } = await supabase
        .from('task_completions')
        .select('id, task_id, completed_at, xp_earned, week_start_date')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartStr)

      if (compErr) throw compErr
      setCompletions(compData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, arenaSlug, weekStartStr])

  useEffect(() => { fetchData() }, [fetchData])

  function isTaskDone(task) {
    if (task.recurrence === 'daily') {
      return isCompletedToday(completions, task.id)
    }
    return isCompletedThisWeek(completions, task.id, task.weekly_target, weekStartStr)
  }

  function getCompletionCount(task) {
    if (task.recurrence === 'daily') {
      return isCompletedToday(completions, task.id) ? 1 : 0
    }
    return getWeeklyCompletionCount(completions, task.id, weekStartStr)
  }

  async function completeTask(task) {
    if (!userId) throw new Error('No authenticated user')
    const effectivePriority = task.priority_override ?? task.priority
    const xp = getXpForPriority(effectivePriority)

    // Optimistic update
    const optimisticCompletion = {
      id: `temp-${Date.now()}`,
      task_id: task.id,
      completed_at: new Date().toISOString(),
      xp_earned: xp,
      week_start_date: weekStartStr,
    }
    setCompletions(prev => [...prev, optimisticCompletion])

    // Persist to Supabase
    const { data, error: insertErr } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_id: task.id,
        xp_earned: xp,
        week_start_date: weekStartStr,
      })
      .select()
      .single()

    if (insertErr) {
      // Rollback optimistic update
      setCompletions(prev => prev.filter(c => c.id !== optimisticCompletion.id))
      throw insertErr
    }

    // Replace temp with real
    setCompletions(prev => prev.map(c => c.id === optimisticCompletion.id ? data : c))

    return xp
  }

  async function addMiscTask(arenaId, title, priority) {
    if (!userId) throw new Error('No authenticated user')
    const { data, error: insertErr } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        arena_id: arenaId,
        title,
        task_type: 'misc',
        recurrence: 'none',
        priority,
        weekly_target: 1,
      })
      .select('*, arenas(id, name, emoji, slug, default_priority)')
      .single()

    if (insertErr) throw insertErr
    setTasks(prev => [...prev, data])
    return data
  }

  async function updateTask(taskId, { title, priority_override }) {
    if (!userId) throw new Error('No authenticated user')
    const updates = {}
    if (title !== undefined) updates.title = title
    if (priority_override !== undefined) updates.priority_override = priority_override

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))

    const { data, error: updateErr } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select('*, arenas(id, name, emoji, slug, default_priority)')
      .single()

    if (updateErr) {
      await fetchData()
      throw updateErr
    }

    setTasks(prev => prev.map(t => t.id === taskId ? data : t))
    return data
  }

  async function deleteTask(taskId) {
    if (!userId) throw new Error('No authenticated user')

    // Optimistic remove
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setCompletions(prev => prev.filter(c => c.task_id !== taskId))

    const { error: compErr } = await supabase
      .from('task_completions')
      .delete()
      .eq('task_id', taskId)

    if (compErr) {
      await fetchData()
      throw compErr
    }

    const { error: taskErr } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (taskErr) {
      await fetchData()
      throw taskErr
    }
  }

  // Week-level stats per arena
  function getArenaStats(arenaSlugFilter) {
    const arenaTasks = tasks.filter(t => t.arenas?.slug === arenaSlugFilter)
    // For simplicity: total = unique tasks, completed = tasks where isTaskDone
    const completed = arenaTasks.filter(t => isTaskDone(t)).length
    const total = arenaTasks.length
    const xpEarned = completions
      .filter(c => arenaTasks.some(t => t.id === c.task_id))
      .reduce((sum, c) => sum + c.xp_earned, 0)
    return { completed, total, xpEarned }
  }

  function getTodaysFocusTasks() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return [] // weekend

    const highTasks = tasks.filter(t => {
      const effectivePriority = t.priority_override ?? t.priority
      if (effectivePriority !== 'high') return false
      if (isTaskDone(t)) return false
      return true
    })

    // Daily tasks first, then weekly
    const daily = highTasks.filter(t => t.recurrence === 'daily')
    const weekly = highTasks.filter(t => t.recurrence !== 'daily')
    return [...daily, ...weekly].slice(0, 3)
  }

  function getWeekXp() {
    return completions.reduce((sum, c) => sum + c.xp_earned, 0)
  }

  return {
    tasks,
    completions,
    arenas,
    loading,
    error,
    isTaskDone,
    getCompletionCount,
    completeTask,
    addMiscTask,
    updateTask,
    deleteTask,
    getArenaStats,
    getTodaysFocusTasks,
    getWeekXp,
    weekStartStr,
    refetch: fetchData,
  }
}
