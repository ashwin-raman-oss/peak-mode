import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useMonthlyData } from '../hooks/useMonthlyData'
import TopBar from '../components/TopBar'
import DayDetailModal from '../components/DayDetailModal'

export default function MonthlyTracker() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)

  const now = new Date()
  const [year, setYear] = useState(now.getUTCFullYear())
  const [month, setMonth] = useState(now.getUTCMonth() + 1)

  const [selectedDay, setSelectedDay] = useState(null)
  const { dailyStatus, loading, refresh } = useMonthlyData(user?.id, year, month)

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

  // Build flat calendarDays array (Sun-start grid)
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay() // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const calendarDays = []
  for (let i = 0; i < firstDow; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarDays.push({ dateStr, day: d })
  }

  const todayStr = now.toISOString().slice(0, 10)
  const currentMonth = new Date(Date.UTC(year, month - 1, 1))

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
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        <div className="bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-peak-border sticky top-0 bg-peak-surface z-10">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center py-2.5 text-[11px] font-semibold text-peak-muted uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} className="border-b border-r border-peak-border min-h-[60px] sm:min-h-[80px] bg-[#F9FAFB]" />

              const status = dailyStatus[day.dateStr]
              const statusType = status?.status ?? 'future'
              const isToday = day.dateStr === todayStr
              const isPast = day.dateStr < todayStr
              const isWeekend = statusType === 'weekend'
              const isFuture = statusType === 'future'
              const isClickable = isPast || isToday

              const barColor = { full: '#059669', partial: '#D97706', missed: '#DC2626' }[statusType]
              const showBar = barColor && !isWeekend && !isFuture
              const showFraction = !isWeekend && !isFuture && (status?.highTotal ?? 0) > 0

              return (
                <div
                  key={day.dateStr}
                  onClick={() => isClickable ? setSelectedDay(day.dateStr) : null}
                  className={`relative border-b border-r border-peak-border min-h-[60px] sm:min-h-[80px] p-1.5 flex flex-col transition-colors ${
                    isClickable ? 'cursor-pointer hover:bg-amber-50' : 'cursor-default'
                  } ${isToday ? 'ring-2 ring-inset ring-amber-400' : ''} ${isWeekend ? 'bg-[#F9FAFB]' : ''}`}
                  style={isToday ? { backgroundColor: '#FFFBEB' } : undefined}
                >
                  <span className={`text-xs font-semibold leading-none ${
                    isToday ? 'text-amber-600' : isWeekend || isFuture ? 'text-peak-muted' : 'text-peak-text'
                  }`}>
                    {day.day}
                  </span>
                  <div className="flex-1" />
                  {showFraction && (
                    <div className="flex justify-end mb-0.5">
                      <span className="text-[10px] text-peak-muted leading-none">
                        {status.completed}/{status.highTotal}
                      </span>
                    </div>
                  )}
                  {showBar && (
                    <div className="h-1 w-full rounded-full" style={{ backgroundColor: barColor }} />
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
