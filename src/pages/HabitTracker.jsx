import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useHabits } from '../hooks/useHabits'
import TopBar from '../components/TopBar'
import Modal from '../components/ui/Modal'
import { toDateStr } from '../lib/dates'
import { supabase } from '../lib/supabase'

function addDaysToDate(startDateStr, days) {
  const d = new Date(startDateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d
}

function HabitCard({ habit, getHabitCompletions, getFormationProgress, toggleHabitDay, deleteHabit, todayStr }) {
  const completions = getHabitCompletions(habit.id)
  const { daysCompleted, pct, isGraduated } = getFormationProgress(habit.id)
  const completedToday = completions.includes(todayStr)

  return (
    <div className="bg-white rounded-xl border border-peak-border p-5 mb-4">
      {/* Top row: name + arena badge + delete */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-peak-primary text-sm">{habit.title}</h3>
          {habit.arenas && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-peak-elevated text-peak-text mt-1">
              {habit.arenas.emoji} {habit.arenas.name}
            </span>
          )}
        </div>
        <button
          onClick={() => deleteHabit(habit.id)}
          className="text-peak-muted hover:text-red-500 text-xs"
          aria-label="Delete habit"
        >
          ✕
        </button>
      </div>

      {/* Formation progress */}
      {isGraduated ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-peak-success bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5 mb-3">
          Graduated ✓
        </span>
      ) : (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-peak-muted">Day {daysCompleted} of 66</span>
            <span className="text-[10px] font-semibold text-peak-accent">{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 bg-peak-border rounded-full overflow-hidden">
            <div
              className="h-full bg-peak-accent rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* 66-day grid */}
      <div className="flex flex-wrap gap-1 mb-4">
        {Array.from({ length: 66 }).map((_, i) => {
          const squareDate = addDaysToDate(habit.start_date, i)
          const dateStr = toDateStr(squareDate)
          const isCompleted = completions.includes(dateStr)
          const isToday = dateStr === todayStr
          return (
            <div
              key={i}
              className={`w-[10px] h-[10px] rounded-sm ${isCompleted ? 'bg-peak-accent' : 'bg-peak-border'} ${isToday ? 'ring-1 ring-peak-accent ring-offset-1' : ''}`}
            />
          )
        })}
      </div>

      {/* Today toggle */}
      <button
        onClick={() => toggleHabitDay(habit.id, todayStr)}
        className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-colors ${
          completedToday
            ? 'bg-peak-success text-white hover:opacity-90'
            : 'bg-peak-accent-light text-peak-accent hover:bg-peak-accent hover:text-white'
        }`}
      >
        {completedToday ? 'Completed today ✓' : 'Mark today complete'}
      </button>
    </div>
  )
}

function AddHabitModal({ onClose, addHabit, todayStr }) {
  const [arenas, setArenas] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [arenaId, setArenaId] = useState('')
  const [targetDays, setTargetDays] = useState(7)
  const [startDate, setStartDate] = useState(todayStr)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('arenas').select('id, name, emoji').order('name').then(({ data }) => {
      const arenaList = data || []
      setArenas(arenaList)
      if (arenaList.length > 0) setArenaId(arenaList[0].id)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !arenaId) return
    setSubmitting(true)
    try {
      await addHabit({
        title: title.trim(),
        description: description.trim(),
        arena_id: arenaId,
        target_days_per_week: Number(targetDays),
        start_date: startDate,
      })
      onClose()
    } catch (err) {
      console.error('Add habit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Add Habit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-peak-text mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="e.g. Morning workout"
            className="border border-peak-border rounded-md p-2 w-full text-sm focus:outline-none focus:border-peak-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-peak-text mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
            className="border border-peak-border rounded-md p-2 w-full text-sm focus:outline-none focus:border-peak-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-peak-text mb-1">Arena</label>
          <select
            value={arenaId}
            onChange={e => setArenaId(e.target.value)}
            className="border border-peak-border rounded-md p-2 w-full text-sm focus:outline-none focus:border-peak-accent"
          >
            {arenas.map(a => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-peak-text mb-2">Target</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="target"
                value={7}
                checked={Number(targetDays) === 7}
                onChange={() => setTargetDays(7)}
                className="accent-peak-accent"
              />
              Daily (7x/week)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="target"
                value={5}
                checked={Number(targetDays) === 5}
                onChange={() => setTargetDays(5)}
                className="accent-peak-accent"
              />
              Weekdays (5x/week)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-peak-text mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-peak-border rounded-md p-2 w-full text-sm focus:outline-none focus:border-peak-accent"
          />
        </div>

        <div className="flex items-center pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-peak-accent text-white text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Adding...' : 'Add Habit'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-peak-muted text-xs hover:text-peak-text ml-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function HabitTracker() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { habits, getHabitCompletions, getFormationProgress, toggleHabitDay, addHabit, deleteHabit, loading } = useHabits(user?.id)
  const [showAdd, setShowAdd] = useState(false)

  const todayStr = toDateStr(new Date())

  // Derive streak and grid data from the first habit
  const primaryHabit = habits[0] || null
  const primaryCompletions = primaryHabit ? getHabitCompletions(primaryHabit.id) : []

  // Build 66-day grid array
  const days = primaryHabit
    ? Array.from({ length: 66 }).map((_, i) => {
        const d = addDaysToDate(primaryHabit.start_date, i)
        const dateStr = toDateStr(d)
        const isFuture = dateStr > todayStr
        const completed = primaryCompletions.includes(dateStr)
        const label = dateStr
        return { isFuture, completed, label }
      })
    : []

  // Compute current streak (consecutive completed days ending today or yesterday)
  function computeCurrentStreak(completionDates) {
    if (!completionDates.length) return 0
    const sorted = [...completionDates].sort().reverse()
    let streak = 0
    let cursor = todayStr
    for (const d of sorted) {
      if (d === cursor) {
        streak++
        const prev = new Date(cursor + 'T00:00:00')
        prev.setDate(prev.getDate() - 1)
        cursor = toDateStr(prev)
      } else {
        break
      }
    }
    // If today isn't completed, try starting from yesterday
    if (streak === 0) {
      const yesterday = new Date(todayStr + 'T00:00:00')
      yesterday.setDate(yesterday.getDate() - 1)
      cursor = toDateStr(yesterday)
      for (const d of sorted) {
        if (d === cursor) {
          streak++
          const prev = new Date(cursor + 'T00:00:00')
          prev.setDate(prev.getDate() - 1)
          cursor = toDateStr(prev)
        } else {
          break
        }
      }
    }
    return streak
  }

  // Compute longest streak
  function computeLongestStreak(completionDates) {
    if (!completionDates.length) return 0
    const sorted = [...completionDates].sort()
    let longest = 1
    let current = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + 'T00:00:00')
      prev.setDate(prev.getDate() + 1)
      if (toDateStr(prev) === sorted[i]) {
        current++
        if (current > longest) longest = current
      } else {
        current = 1
      }
    }
    return longest
  }

  const currentStreak = computeCurrentStreak(primaryCompletions)
  const longestStreak = computeLongestStreak(primaryCompletions)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Habit Tracker" subtitle="66-day challenge" />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        {/* Streak stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
          <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-accent rounded-xl px-4 py-4">
            <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">Current Streak</p>
            <p className="text-2xl font-extrabold text-peak-text">{currentStreak}</p>
            <p className="text-[10px] text-peak-muted">days</p>
          </div>
          <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-text rounded-xl px-4 py-4">
            <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">Longest Streak</p>
            <p className="text-2xl font-extrabold text-peak-text">{longestStreak}</p>
            <p className="text-[10px] text-peak-muted">days</p>
          </div>
        </div>

        {/* 66-day grid */}
        <div className="bg-peak-surface border border-peak-border rounded-xl p-5">
          <p className="text-xs font-semibold text-peak-muted uppercase tracking-widest mb-4">66-Day Grid</p>
          <div className="grid grid-cols-11 gap-1.5">
            {days.map((day, i) => (
              <div
                key={i}
                title={day.label}
                className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-semibold transition-colors ${
                  day.isFuture
                    ? 'bg-[#F4F4F5] text-[#D4D4D8]'
                    : day.completed
                    ? 'bg-peak-accent text-white'
                    : 'bg-peak-border text-peak-muted'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Habits list */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-peak-muted uppercase tracking-widest">All Habits</p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-peak-accent text-white text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90"
            >
              Add Habit
            </button>
          </div>

          {habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              getHabitCompletions={getHabitCompletions}
              getFormationProgress={getFormationProgress}
              toggleHabitDay={toggleHabitDay}
              deleteHabit={deleteHabit}
              todayStr={todayStr}
            />
          ))}

          {!loading && habits.length === 0 && (
            <p className="text-peak-muted text-sm text-center mt-16">
              No habits yet. Add your first habit to start building streaks.
            </p>
          )}
        </div>

        {/* Add modal */}
        {showAdd && (
          <AddHabitModal
            onClose={() => setShowAdd(false)}
            addHabit={addHabit}
            todayStr={todayStr}
          />
        )}
      </main>
    </div>
  )
}
