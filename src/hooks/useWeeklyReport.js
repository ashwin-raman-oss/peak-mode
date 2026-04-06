import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getWeekStart, toDateStr } from '../lib/dates'

export function useWeeklyReport(userId, weekDateParam = null) {
  const [report, setReport] = useState(null)
  const [allReports, setAllReports] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const weekStartStr = weekDateParam ?? toDateStr(getWeekStart(new Date()))

  const fetchReports = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)

      // Fetch all reports for browsing
      const { data: all } = await supabase
        .from('weekly_reports')
        .select('week_start_date, tasks_completed, tasks_total, xp_earned, streak_held')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })

      setAllReports(all || [])

      // Fetch specific week's report
      const { data: existing } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartStr)
        .single()

      setReport(existing ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, weekStartStr])

  useEffect(() => { fetchReports() }, [fetchReports])

  async function generateReport(weekStats) {
    setGenerating(true)
    try {
      // Get AI summary
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ weekStats }),
      })

      let aiSummary = 'Great effort this week. Keep showing up.'
      if (res.ok) {
        const data = await res.json()
        aiSummary = data.summary
      }

      // Upsert report
      const { data: saved, error: saveErr } = await supabase
        .from('weekly_reports')
        .upsert({
          user_id: userId,
          week_start_date: weekStartStr,
          tasks_completed: weekStats.tasksCompleted,
          tasks_total: weekStats.tasksTotal,
          xp_earned: weekStats.xpEarned,
          streak_held: weekStats.streakHeld,
          arena_breakdown: weekStats.arenaBreakdown,
          ai_summary: aiSummary,
        }, { onConflict: 'user_id,week_start_date' })
        .select()
        .single()

      if (saveErr) throw saveErr
      setReport(saved)
      return saved
    } finally {
      setGenerating(false)
    }
  }

  return { report, allReports, loading, generating, error, generateReport, refetch: fetchReports }
}
