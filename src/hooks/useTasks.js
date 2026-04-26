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

      // Filter out expired one-time tasks (created/due before this week)
      const activeTaskData = (taskData || []).filter(task => {
        if (!task.is_one_time) return true
        // Prefer explicit due_date; fall back to local interpretation of created_at
        const expiryStr = task.due_date ?? toDateStr(new Date(task.created_at))
        return expiryStr >= weekStartStr
      })
      setTasks(activeTaskData)

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

  function isTaskDone(task, dateStr = toDateStr(new Date())) {
    if (task.recurrence === 'daily') {
      return completions.some(c =>
        c.task_id === task.id &&
        typeof c.completed_at === 'string' &&
        c.completed_at.slice(0, 10) === dateStr
      )
    }
    return isCompletedThisWeek(completions, task.id, task.weekly_target, weekStartStr)
  }

  function getCompletionCount(task, dateStr = toDateStr(new Date())) {
    if (task.recurrence === 'daily') {
      return completions.some(c =>
        c.task_id === task.id &&
        typeof c.completed_at === 'string' &&
        c.completed_at.slice(0, 10) === dateStr
      ) ? 1 : 0
    }
    return getWeeklyCompletionCount(completions, task.id, weekStartStr)
  }

  async function completeTask(task, dateStr = toDateStr(new Date())) {
    if (!userId) throw new Error('No authenticated user')
    const todayStr = toDateStr(new Date())
    const isRetroactive = dateStr !== todayStr
    const effectivePriority = task.priority_override ?? task.priority
    const xp = isRetroactive ? 0 : getXpForPriority(effectivePriority)
    const completedAt = isRetroactive ? dateStr + 'T12:00:00Z' : new Date(toDateStr(new Date()) + 'T12:00:00').toISOString()

    // Optimistic update
    const optimisticCompletion = {
      id: `temp-${Date.now()}`,
      task_id: task.id,
      completed_at: completedAt,
      xp_earned: xp,
      week_start_date: weekStartStr,
    }
    setCompletions(prev => [...prev, optimisticCompletion])

    const { data, error: insertErr } = await supabase
      .from('task_completions')
      .insert({
        user_id: userId,
        task_id: task.id,
        xp_earned: xp,
        week_start_date: weekStartStr,
        completed_at: completedAt,
      })
      .select()
      .single()

    if (insertErr) {
      setCompletions(prev => prev.filter(c => c.id !== optimisticCompletion.id))
      throw insertErr
    }

    setCompletions(prev => prev.map(c => c.id === optimisticCompletion.id ? data : c))
    window.dispatchEvent(new CustomEvent('peak-task-changed'))
    return xp
  }

  async function uncompleteTask(taskId, dateStr) {
    if (!userId) throw new Error('No authenticated user')
    const match = completions.find(c =>
      c.task_id === taskId &&
      typeof c.completed_at === 'string' &&
      c.completed_at.slice(0, 10) === dateStr
    )
    if (!match) return

    // Optimistic remove
    setCompletions(prev => prev.filter(c => c.id !== match.id))

    const { error } = await supabase
      .from('task_completions')
      .delete()
      .eq('id', match.id)
      .eq('user_id', userId)

    if (error) {
      await fetchData()
      throw error
    }

    window.dispatchEvent(new CustomEvent('peak-task-changed'))
  }

  async function addMiscTask(arenaId, title, priority, options = {}) {
    if (!userId) throw new Error('No authenticated user')
    const {
      task_type = 'misc',
      recurrence = 'none',
      weekly_target = 1,
      is_one_time = false,
    } = options
    const { data, error: insertErr } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        arena_id: arenaId,
        title,
        task_type,
        recurrence,
        priority,
        weekly_target,
        is_one_time,
      })
      .select('*, arenas(id, name, emoji, slug, default_priority)')
      .single()

    if (insertErr) throw insertErr
    setTasks(prev => [...prev, data])
    return data
  }

  async function updateTask(taskId, { title, priority_override, is_one_time, recurrence, weekly_target, task_type }) {
    if (!userId) throw new Error('No authenticated user')
    const updates = {}
    if (title !== undefined) updates.title = title
    if (priority_override !== undefined) updates.priority_override = priority_override
    if (is_one_time !== undefined) updates.is_one_time = is_one_time
    if (recurrence !== undefined) updates.recurrence = recurrence
    if (weekly_target !== undefined) updates.weekly_target = weekly_target
    if (task_type !== undefined) updates.task_type = task_type

    if (Object.keys(updates).length === 0) return

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ))

    const { data, error: updateErr } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId)
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
      .eq('user_id', userId)

    if (compErr) {
      await fetchData()
      throw compErr
    }

    const { error: taskErr } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (taskErr) {
      await fetchData()
      throw taskErr
    }
  }

  // Daily completion stats for a specific date (arena-scoped when hook called with arenaSlug)
  function getDailyStatsForDate(dateStr) {
    const dailyTasks = tasks.filter(t => t.recurrence === 'daily' && t.task_type === 'recurring')
    const total = dailyTasks.length
    const completed = dailyTasks.filter(t =>
      completions.some(c =>
        c.task_id === t.id &&
        typeof c.completed_at === 'string' &&
        c.completed_at.slice(0, 10) === dateStr
      )
    ).length
    return { completed, total }
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
    const dayOfWeek = today.getDay() // local: 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (isWeekend) {
      // Weekends: skip daily recurring (weekday-only), show weekly + misc that aren't done
      return tasks.filter(t => {
        const effectivePriority = t.priority_override ?? t.priority
        if (effectivePriority !== 'high') return false
        if (isTaskDone(t)) return false
        return t.recurrence === 'weekly' || t.task_type === 'misc'
      }).slice(0, 3)
    }

    // Weekdays: all high-priority undone tasks, daily first
    const highTasks = tasks.filter(t => {
      const effectivePriority = t.priority_override ?? t.priority
      if (effectivePriority !== 'high') return false
      if (isTaskDone(t)) return false
      return true
    })

    const daily = highTasks.filter(t => t.recurrence === 'daily')
    const weekly = highTasks.filter(t => t.recurrence !== 'daily')
    return [...daily, ...weekly].slice(0, 3)
  }

  function getWeekXp() {
    return completions.reduce((sum, c) => sum + c.xp_earned, 0)
  }

  // Count completions for today only (not the full week)
  function getTodayCompletionCount() {
    const todayStr = toDateStr(new Date())
    const dayOfWeek = new Date().getDay() // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (isWeekend) {
      // Weekends: count this week's completions against weekly + misc tasks only
      const weekendTasks = tasks.filter(t => t.recurrence === 'weekly' || t.task_type === 'misc')
      const completedWeekend = completions.filter(c => {
        if (!c.completed_at) return false
        return weekendTasks.some(t => t.id === c.task_id)
      }).length
      return { completedToday: completedWeekend, totalDailyToday: weekendTasks.length, isWeekend: true }
    }

    const completedToday = completions.filter(c => {
      if (!c.completed_at) return false
      return c.completed_at.slice(0, 10) === todayStr
    }).length

    const totalDailyToday = tasks.length

    return { completedToday, totalDailyToday, isWeekend: false }
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
    uncompleteTask,
    addMiscTask,
    updateTask,
    deleteTask,
    getArenaStats,
    getDailyStatsForDate,
    getTodaysFocusTasks,
    getWeekXp,
    getTodayCompletionCount,
    weekStartStr,
    refetch: fetchData,
  }
}
