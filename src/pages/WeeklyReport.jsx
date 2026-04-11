import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { useWeeklyReport } from '../hooks/useWeeklyReport'
import Header from '../components/Header'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import { formatWeekRange, getWeekStart, toDateStr } from '../lib/dates'

const ARENA_SLUGS = ['career', 'health', 'learning', 'misc']
const ARENA_LABELS = { career: 'Career', health: 'Health', learning: 'Learning', misc: 'Misc' }

export default function WeeklyReport() {
  const { weekDate } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const { arenas, getArenaStats, getWeekXp, loading: tasksLoading } = useTasks(user?.id)
  const { report, allReports, loading, generating, generateReport } = useWeeklyReport(user?.id, weekDate ?? null)

  const weekStartStr = weekDate ?? toDateStr(getWeekStart(new Date()))
  const weekRange = formatWeekRange(new Date(weekStartStr + 'T00:00:00Z'))
  const isCurrentWeek = weekStartStr === toDateStr(getWeekStart(new Date()))

  const currentIdx = allReports.findIndex(r => r.week_start_date === weekStartStr)
  const prevReport = currentIdx === -1 ? null : (currentIdx < allReports.length - 1 ? allReports[currentIdx + 1] : null)
  const nextReport = currentIdx > 0 ? allReports[currentIdx - 1] : null

  const [generateError, setGenerateError] = useState(null)

  async function handleGenerate() {
    setGenerateError(null)
    const breakdown = {}
    ARENA_SLUGS.forEach(slug => {
      const stats = getArenaStats(slug)
      breakdown[ARENA_LABELS[slug]] = { completed: stats.completed, total: stats.total, xp: stats.xpEarned }
    })
    try {
      await generateReport({
        tasksCompleted: Object.values(breakdown).reduce((s, a) => s + a.completed, 0),
        tasksTotal:     Object.values(breakdown).reduce((s, a) => s + a.total, 0),
        xpEarned:       getWeekXp(),
        streakHeld:     (profile?.current_streak ?? 0) > 0,
        arenaBreakdown: breakdown,
      })
    } catch (err) {
      console.error('Failed to generate report:', err)
      setGenerateError('Could not generate report. Try again.')
    }
  }

  if (loading || profileLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-peak-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-peak-bg">
      <Header profile={profile} />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => prevReport && navigate(`/report/${prevReport.week_start_date}`)}
            disabled={!prevReport}
            className="text-xs text-peak-muted hover:text-peak-primary disabled:opacity-30 transition-colors"
          >
            ← Prev
          </button>
          <div className="text-center">
            <p className="text-xs font-black tracking-widest uppercase text-peak-accent">Weekly Report</p>
            <p className="text-sm font-bold text-peak-primary">{weekRange}</p>
          </div>
          <button
            onClick={() => nextReport ? navigate(`/report/${nextReport.week_start_date}`) : navigate('/report')}
            disabled={!nextReport && isCurrentWeek}
            className="text-xs text-peak-muted hover:text-peak-primary disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>

        {generateError && (
          <p role="alert" className="text-[#DC2626] text-xs font-medium bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-3 py-2">
            {generateError}
          </p>
        )}

        {/* No report yet */}
        {!report && isCurrentWeek && (
          <div className="bg-peak-surface border border-peak-border rounded-xl p-6 text-center space-y-3">
            <p className="text-peak-muted text-sm">No report generated yet for this week.</p>
            <Button onClick={handleGenerate} size="lg" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        )}

        {!report && !isCurrentWeek && (
          <div className="bg-peak-surface border border-peak-border rounded-xl p-6 text-center">
            <p className="text-peak-muted text-sm">No report for this week.</p>
          </div>
        )}

        {/* Report content */}
        {report && (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-peak-surface border border-peak-border rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-peak-primary">{report.tasks_completed}<span className="text-peak-muted text-base">/{report.tasks_total}</span></p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mt-1">Tasks</p>
              </div>
              <div className="bg-peak-surface border border-peak-border rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-peak-xp">{report.xp_earned}</p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mt-1">XP</p>
              </div>
              <div className="bg-peak-surface border border-peak-border rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-peak-primary">{report.streak_held ? '✓' : '✗'}</p>
                <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mt-1">Streak</p>
              </div>
            </div>

            {/* Arena breakdown */}
            <div className="bg-peak-surface border border-peak-border rounded-xl p-4">
              <p className="text-[10px] font-black tracking-widest uppercase text-peak-muted mb-3">Arena Breakdown</p>
              <div className="space-y-3">
                {Object.entries(report.arena_breakdown || {}).map(([name, stats]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-peak-primary">{name}</span>
                      <span className="text-xs text-peak-accent font-bold">{stats.xp} XP · {stats.completed}/{stats.total}</span>
                    </div>
                    <ProgressBar value={stats.completed} max={Math.max(stats.total, 1)} />
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            {report.ai_summary && (
              <div className="bg-peak-accent-light border border-peak-accent/30 rounded-xl p-5">
                <p className="text-[10px] font-black tracking-widest uppercase text-peak-accent mb-2">AI Coach</p>
                <p className="text-sm text-peak-primary leading-relaxed">{report.ai_summary}</p>
              </div>
            )}

            {/* Regenerate */}
            {isCurrentWeek && (
              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
