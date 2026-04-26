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

function getFrequencyLabel(targetDays) {
  if (targetDays >= 7) return 'Daily habit'
  if (targetDays === 5) return 'Weekdays only'
  return `${targetDays}× per week`
}

function HabitCard({ habit, getHabitCompletions, getFormationProgress, getHabitStreak, toggleHabitDay, onDeleteRequest, todayStr }) {
  const completions = getHabitCompletions(habit.id)
  const { daysCompleted } = getFormationProgress(habit.id)
  const { currentStreak, longestStreak } = getHabitStreak(habit.id)
  const completedToday = completions.includes(todayStr)

  // Scale progress to target frequency (non-daily habits have a shorter effective goal)
  const targetDays = habit.target_days_per_week ?? 7
  const effectiveDays = targetDays >= 7 ? 66 : Math.round(66 * targetDays / 7)
  const adjustedPct = effectiveDays > 0 ? Math.min(100, (daysCompleted / effectiveDays) * 100) : 0
  const isGraduated = daysCompleted >= effectiveDays

  return (
    <div className="bg-peak-surface rounded-xl border border-peak-border p-5 mb-4">
      {/* Top row: name + arena badge + delete */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-peak-text text-sm">{habit.title}</h3>
          {habit.arenas && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-peak-bg text-peak-text mt-1">
              {habit.arenas.emoji} {habit.arenas.name}
            </span>
          )}
          {/* Frequency label */}
          <span className="block text-[10px] text-peak-muted mt-0.5">
            {getFrequencyLabel(targetDays)}
          </span>
        </div>
        <button
          onClick={() => onDeleteRequest(habit)}
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
            <span className="text-[10px] text-peak-muted">Day {daysCompleted} of {effectiveDays}</span>
            <span className="text-[10px] font-semibold text-peak-accent">{Math.round(adjustedPct)}%</span>
          </div>
          <div className="h-1.5 bg-peak-border rounded-full overflow-hidden">
            <div
              className="h-full bg-peak-accent rounded-full transition-all"
              style={{ width: `${adjustedPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-habit streak stats */}
      <div className="flex items-center gap-4 mb-3">
        <div>
          <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest">Streak</p>
          {currentStreak > 0 ? (
            <p className="text-sm font-bold text-peak-text">🔥 {currentStreak} day{currentStreak !== 1 ? 's' : ''}</p>
          ) : (
            <p className="text-[10px] text-peak-muted mt-0.5">Start your streak today</p>
          )}
        </div>
        {longestStreak > 0 && (
          <div>
            <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest">Best</p>
            <p className="text-sm font-bold text-peak-text">{longestStreak} day{longestStreak !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* 66-day grid */}
      <div className="flex flex-wrap gap-1 mb-2">
        {Array.from({ length: 66 }).map((_, i) => {
          const squareDate = addDaysToDate(habit.start_date, i)
          const dateStr = toDateStr(squareDate)
          const isCompleted = completions.includes(dateStr)
          const isToday = dateStr === todayStr
          // For non-daily habits, shade weekend squares lighter
          const dow = squareDate.getDay()
          const isWeekendSquare = targetDays < 7 && (dow === 0 || dow === 6)
          return (
            <div
              key={i}
              className={`w-[10px] h-[10px] rounded-sm ${
                isCompleted ? 'bg-peak-accent' :
                isWeekendSquare ? 'bg-[#F3F4F6]' :
                'bg-peak-border'
              } ${isToday ? 'ring-1 ring-peak-accent ring-offset-1' : ''}`}
            />
          )
        })}
      </div>

      {/* Target summary */}
      <p className="text-[10px] text-peak-muted mb-4">
        Target: {targetDays}×/week · {daysCompleted} days done · {Math.round(adjustedPct)}% complete
      </p>

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

      {/* Retroactive 7-day pill row */}
      <div className="mt-3">
        <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1.5">Log past days</p>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            const dateStr = toDateStr(d)
            const dayLabel = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] + ' ' + d.getDate()
            const isToday = dateStr === todayStr
            const isDone = completions.includes(dateStr)
            const isBefore = dateStr < habit.start_date
            const isFuture = dateStr > todayStr

            if (isFuture) return null

            let pillClass = 'px-2 py-1 rounded-md text-[10px] font-semibold transition-colors '
            if (isBefore) {
              pillClass += 'opacity-40 cursor-not-allowed border border-peak-border text-peak-muted'
            } else if (isToday && isDone) {
              pillClass += 'bg-amber-600 text-white ring-2 ring-amber-300 ring-offset-1'
            } else if (isToday && !isDone) {
              pillClass += 'border-2 border-amber-400 text-amber-600 cursor-pointer hover:bg-amber-50'
            } else if (isDone) {
              pillClass += 'bg-amber-500 text-white cursor-pointer hover:opacity-90'
            } else {
              pillClass += 'border border-peak-border text-peak-muted cursor-pointer hover:border-amber-400'
            }

            return (
              <button
                key={dateStr}
                disabled={isBefore}
                onClick={() => !isBefore && toggleHabitDay(habit.id, dateStr)}
                className={pillClass}
                title={isDone ? `Unmark ${dayLabel}` : `Mark ${dayLabel} complete`}
              >
                {dayLabel}
                {isDone && ' ✓'}
              </button>
            )
          })}
        </div>
      </div>
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
  const { habits, getHabitCompletions, getFormationProgress, getHabitStreak, toggleHabitDay, addHabit, deleteHabit, loading } = useHabits(user?.id)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, title }

  const todayStr = toDateStr(new Date())

  async function handleConfirmedDelete(habitId) {
    try {
      await deleteHabit(habitId)
    } catch (err) {
      console.error('Failed to delete habit:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <TopBar title="Habit Tracker" subtitle="66-day challenge" />
        <div className="flex-1 flex items-center justify-center bg-peak-bg">
          <div className="w-8 h-8 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Habit Tracker" subtitle="66-day challenge" />
      <main className="flex-1 overflow-y-auto bg-peak-bg px-4 py-4 lg:px-6">
        {/* Habits list */}
        <div>
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
              getHabitStreak={getHabitStreak}
              toggleHabitDay={toggleHabitDay}
              onDeleteRequest={(h) => setConfirmDelete({ id: h.id, title: h.title })}
              todayStr={todayStr}
            />
          ))}

          {habits.length === 0 && (
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

        {/* Delete confirmation */}
        {confirmDelete && (
          <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
            <p className="text-sm text-peak-text mb-1">
              Are you sure you want to delete <span className="font-semibold">"{confirmDelete.title}"</span>?
            </p>
            <p className="text-xs text-peak-muted mb-5">This will remove the habit and all its history. This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { handleConfirmedDelete(confirmDelete.id); setConfirmDelete(null) }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-peak-bg hover:bg-peak-border text-peak-text text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  )
}
