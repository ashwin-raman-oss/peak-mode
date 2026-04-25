import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useMonthlyData } from '../hooks/useMonthlyData'
import TopBar from '../components/TopBar'
import DayDetailModal from '../components/DayDetailModal'

const APP_START = '2026-04-16'

const ARENA_COLORS = {
  career:   '#2D5BE3',
  health:   '#059669',
  learning: '#7C3AED',
  misc:     '#D97706',
}

export default function MonthlyTracker() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)

  // Use local time so timezone doesn't shift the displayed month
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [selectedDay, setSelectedDay] = useState(null)
  const { dailyStatus, dailyCompletions, loading, refresh } = useMonthlyData(user?.id, year, month)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
    if (isCurrentMonth) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // Build flat calendarDays array (Sun-start grid)
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const calendarDays = []
  for (let i = 0; i < firstDow; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarDays.push({ dateStr, day: d })
  }

  // Local today string (avoids UTC timezone mismatch)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentMonth = new Date(year, month - 1, 1)

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-peak-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        subtitle="Monthly view"
        action={
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="text-xs text-peak-muted hover:text-peak-text px-2 py-1 rounded-lg hover:bg-peak-bg transition-colors">← Prev</button>
            <button onClick={nextMonth} className="text-xs text-peak-muted hover:text-peak-text px-2 py-1 rounded-lg hover:bg-peak-bg transition-colors">Next →</button>
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg px-4 py-4 lg:px-6">
        <div className="bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-peak-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center py-2.5 text-[11px] font-semibold text-peak-muted uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} className="border-b border-r border-peak-border min-h-[80px] bg-[#F9FAFB]" />

              const status = dailyStatus[day.dateStr]
              const statusType = status?.status ?? 'future'
              const isToday = day.dateStr === todayStr
              const isWeekend = statusType === 'weekend'
              const isFuture = statusType === 'future'
              const isBeforeStart = day.dateStr < APP_START
              // Treat pre-launch days same as future: no data, no click
              const isActive = !isFuture && !isBeforeStart
              const isClickable = isActive

              const dayCompletions = isActive ? (dailyCompletions[day.dateStr] ?? []) : []
              const visible = dayCompletions.slice(0, 3)
              const extra = dayCompletions.length - 3

              return (
                <div
                  key={day.dateStr}
                  onClick={() => isClickable ? setSelectedDay(day.dateStr) : null}
                  className={`relative border-b border-r border-peak-border min-h-[80px] p-1.5 flex flex-col transition-colors ${
                    isClickable ? 'cursor-pointer hover:bg-amber-50' : 'cursor-default'
                  } ${isToday ? 'ring-2 ring-inset ring-amber-400' : ''} ${isWeekend || isBeforeStart ? 'bg-[#F9FAFB]' : ''}`}
                  style={isToday ? { backgroundColor: '#FFFBEB' } : undefined}
                >
                  <span className={`text-xs font-semibold leading-none ${
                    isToday ? 'text-amber-600' : isWeekend || isFuture || isBeforeStart ? 'text-peak-muted' : 'text-peak-text'
                  }`}>
                    {day.day}
                  </span>

                  {visible.length > 0 && (
                    <div className="mt-1 space-y-0.5 flex-1">
                      {visible.map((t, idx) => (
                        <p
                          key={idx}
                          className="text-[10px] leading-tight truncate font-medium"
                          style={{ color: ARENA_COLORS[t.arenaSlug] ?? ARENA_COLORS.misc }}
                        >
                          {t.title}
                        </p>
                      ))}
                      {extra > 0 && (
                        <p className="text-[10px] leading-tight text-peak-muted">+{extra} more</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          userId={user?.id}
          onClose={() => {
            setSelectedDay(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
