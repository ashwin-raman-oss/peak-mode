import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getWeekStart, toDateStr } from '../lib/dates'

export function useWeeklyReport(userId, weekDateParam = null) {
  const [report, setReport] = useState(null)
  const [allReports, setAllReports] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const weekStartStr = useMemo(
    () => weekDateParam ?? toDateStr(getWeekStart(new Date())),
    [weekDateParam]
  )

  const fetchReports = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)

      const { data: all, error: allErr } = await supabase
        .from('weekly_reports')
        .select('week_start_date, tasks_completed, tasks_total, xp_earned, streak_held')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })

      if (allErr) throw allErr
      setAllReports(all || [])

      const { data: existing, error: reportErr } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartStr)
        .single()

      if (reportErr && reportErr.code !== 'PGRST116') throw reportErr
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
      let nextWeekCommitments = []

      if (res.ok) {
        const data = await res.json()
        // New format: { summary, focusAreas, nextWeekCommitments }
        aiSummary = data.summary ?? aiSummary
        nextWeekCommitments = Array.isArray(data.nextWeekCommitments) ? data.nextWeekCommitments : []
      }

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
          next_week_commitments: nextWeekCommitments,
        }, { onConflict: 'user_id,week_start_date' })
        .select()
        .single()

      if (saveErr) throw saveErr
      setReport(saved)
      return saved
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setGenerating(false)
    }
  }

  return { report, allReports, loading, generating, error, generateReport, refetch: fetchReports }
}
