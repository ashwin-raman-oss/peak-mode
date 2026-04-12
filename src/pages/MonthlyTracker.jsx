import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useMonthlyData } from '../hooks/useMonthlyData'
import Header from '../components/Header'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const STATUS_COLOR = {
  full:    'bg-peak-accent text-white',
  partial: 'bg-[#D97706] text-white',
  missed:  'bg-[#FEE2E2] text-[#DC2626]',
  weekend: 'bg-peak-elevated text-peak-muted',
  future:  'bg-transparent text-peak-muted/40',
}

function CalendarGrid({ year, month, dailyStatus }) {
  // month is 1-indexed
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  // Offset: 0=Mon, 1=Tue, ... 6=Sun
  const firstDow = firstDay.getUTCDay() // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1

  const cells = []
  // empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(h => (
          <div key={h} className="text-center text-[10px] font-bold tracking-widest uppercase text-peak-muted py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const info = dailyStatus[dateStr]
          const status = info?.status ?? 'future'
          const colorClass = STATUS_COLOR[status] ?? STATUS_COLOR.future

          return (
            <div key={dateStr} className="aspect-square flex items-center justify-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${colorClass}`}
                title={status === 'full' ? `${info.completed} tasks · ${info.xp} XP` : status}
              >
                {day}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MonthlyTracker() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)

  const now = new Date()
  const [year, setYear] = useState(now.getUTCFullYear())
  const [month, setMonth] = useState(now.getUTCMonth() + 1)

  const { dailyStatus, monthStats, loading } = useMonthlyData(user?.id, year, month)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const isCurrentMonth = year === now.getUTCFullYear() && month === now.getUTCMonth() + 1
    if (isCurrentMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getUTCFullYear() && month === now.getUTCMonth() + 1

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-peak-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-peak-bg">
      <Header profile={profile} />

      <main className="max-w-3xl mx-auto px-6 py-5 space-y-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="text-xs text-peak-muted hover:text-peak-primary transition-colors"
          >
            ← Prev
          </button>
          <div className="text-center">
            <p className="text-xs font-black tracking-widest uppercase text-peak-accent">Monthly Tracker</p>
            <p className="text-sm font-bold text-peak-primary">{MONTH_NAMES[month - 1]} {year}</p>
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="text-xs text-peak-muted hover:text-peak-primary disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Stats bar */}
        {monthStats && (
          <div className="flex bg-white rounded-xl shadow-sm overflow-hidden">
            {[
              { label: 'Completion',  value: `${monthStats.completionRate}%`,     color: 'text-peak-accent' },
              { label: 'Tasks Done',  value: monthStats.totalTasks,               color: 'text-peak-primary' },
              { label: 'XP Earned',   value: monthStats.totalXp,                  color: 'text-peak-xp' },
            ].map((stat, i) => (
              <div key={stat.label} className={`flex-1 px-4 py-4 text-center ${i > 0 ? 'border-l border-peak-border' : ''}`}>
                <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mb-1">{stat.label}</p>
                <p className={`text-2xl font-extrabold tabular-nums leading-none ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Calendar */}
        <div className="bg-peak-surface border border-peak-border rounded-xl p-5">
          <CalendarGrid year={year} month={month} dailyStatus={dailyStatus} />

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {[
              { status: 'full',    label: 'Full day' },
              { status: 'partial', label: 'Partial' },
              { status: 'missed',  label: 'Missed' },
              { status: 'weekend', label: 'Weekend' },
            ].map(({ status, label }) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded-full ${STATUS_COLOR[status]}`} />
                <span className="text-[10px] text-peak-muted font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly breakdown */}
        {monthStats?.weeksData?.length > 0 && (
          <div className="bg-peak-surface border border-peak-border rounded-xl p-4">
            <p className="text-[10px] font-black tracking-widest uppercase text-peak-muted mb-3">Weekly Breakdown</p>
            <div className="space-y-0">
              {monthStats.weeksData.map((week, i) => {
                const pct = week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0
                const isBest  = monthStats.bestWeek?.weekStart === week.weekStart
                const isWorst = monthStats.worstWeek?.weekStart === week.weekStart && monthStats.worstWeek !== monthStats.bestWeek
                const weekLabel = new Date(week.weekStart + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
                return (
                  <div
                    key={week.weekStart}
                    className={`flex items-center gap-3 py-2.5 ${i < monthStats.weeksData.length - 1 ? 'border-b border-peak-border/50' : ''}`}
                  >
                    <span className="text-xs text-peak-text w-16 shrink-0 font-medium">{weekLabel}</span>
                    <div className="flex-1 h-[3px] bg-peak-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-peak-accent rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-peak-muted w-14 text-right shrink-0">
                      {week.completed}/{week.total}
                    </span>
                    <span className="text-xs tabular-nums text-peak-xp w-14 text-right shrink-0 font-medium">
                      {week.xp} XP
                    </span>
                    {isBest && (
                      <span className="text-[9px] font-bold text-peak-accent uppercase tracking-wide shrink-0">Best</span>
                    )}
                    {isWorst && week.total > 0 && (
                      <span className="text-[9px] font-bold text-[#DC2626] uppercase tracking-wide shrink-0">Worst</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* View report link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/report')}
            className="text-xs text-peak-accent hover:text-peak-primary font-medium transition-colors"
          >
            View Weekly Report →
          </button>
        </div>
      </main>
    </div>
  )
}
