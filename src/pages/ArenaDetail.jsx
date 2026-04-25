import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { getWeekStart, toDateStr } from '../lib/dates'
import { getXpForPriority } from '../lib/xp'
import TopBar from '../components/TopBar'
import Badge from '../components/ui/Badge'
import XPToast from '../components/XPToast'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDays() {
  const monday = getWeekStart(new Date()) // local Monday midnight
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i) // local date arithmetic
    return toDateStr(d)
  })
}

export default function ArenaDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { addXp } = useProfile(user?.id)
  const {
    tasks, arenas, loading,
    deleteTask, addMiscTask, updateTask,
    completeTask, uncompleteTask, isTaskDone, getCompletionCount,
  } = useTasks(user?.id, slug)

  const todayStr = toDateStr(new Date())
  const weekDays = getWeekDays()

  const [selectedDay, setSelectedDay] = useState(todayStr)
  const [showAddForm, setShowAddForm] = useState(false)
  const [completing, setCompleting] = useState(null)
  const [toast, setToast] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const arena = arenas.find(a => a.slug === slug)

  if (loading) {
    return (
      <div className="min-h-screen bg-peak-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!arena) {
    return (
      <div className="min-h-screen bg-peak-bg flex items-center justify-center">
        <p className="text-peak-muted">Arena not found.</p>
      </div>
    )
  }

  async function handleComplete(task) {
    if (completing === task.id) return
    const isWeeklyCount = (task.weekly_target ?? 1) > 1
    const done = isTaskDone(task, selectedDay)

    setCompleting(task.id)
    try {
      if (done && !isWeeklyCount) {
        // Daily/one-time toggle off
        await uncompleteTask(task.id, selectedDay)
      } else if (!done || isWeeklyCount) {
        const xp = await completeTask(task, selectedDay)
        if (xp > 0) await addXp(xp)

        let message = null
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const res = await fetch('/api/hype', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ taskTitle: task.title }),
          })
          if (res.ok) { const d = await res.json(); message = d.message }
        } catch { /* hype is optional */ }

        if (xp > 0) setToast({ xp, hypeMessage: message, id: Date.now() })
      }
    } catch (err) {
      console.error('Complete error:', err)
    } finally {
      setCompleting(null)
    }
  }

  async function handleDelete(taskId) {
    try {
      await deleteTask(taskId)
    } catch (err) {
      console.error('Failed to delete task:', err)
      setActionError('Could not delete task. Try again.')
    }
  }

  async function handleAddTask({ title, priority, is_one_time }) {
    try {
      await addMiscTask(arena.id, title, priority, is_one_time)
      setShowAddForm(false)
    } catch (err) {
      console.error('Failed to add task:', err)
      setActionError('Could not add task. Try again.')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={arena?.name ?? slug}
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg px-4 py-4 lg:px-6">
        {toast && (
          <XPToast key={toast.id} xp={toast.xp} hypeMessage={toast.hypeMessage} onDone={() => setToast(null)} />
        )}

        {/* Day tab bar */}
        <div className="flex gap-1 mb-4 bg-peak-surface border border-peak-border rounded-xl p-1.5">
          {weekDays.map((dateStr, i) => {
            const date = new Date(dateStr + 'T00:00:00Z')
            const isSelected = selectedDay === dateStr
            const isToday = dateStr === todayStr
            const isFuture = dateStr > todayStr
            return (
              <button
                key={dateStr}
                onClick={() => !isFuture && setSelectedDay(dateStr)}
                disabled={isFuture}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-peak-accent text-black'
                    : isFuture
                    ? 'text-peak-muted opacity-40 cursor-not-allowed'
                    : 'text-peak-muted hover:text-peak-text hover:bg-peak-bg'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{DAY_LABELS[i]}</span>
                <span className={`text-sm font-bold mt-0.5 ${isToday && !isSelected ? 'text-peak-accent' : ''}`}>
                  {date.getUTCDate()}
                </span>
              </button>
            )
          })}
        </div>

        {actionError && (
          <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {actionError}
          </div>
        )}

        <div className="bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
          {tasks.length === 0 && !showAddForm ? (
            <div className="text-center py-16">
              <p className="text-peak-muted text-sm mb-3">No tasks yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-xs font-semibold text-peak-accent hover:underline"
              >
                + Add your first task
              </button>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="grid grid-cols-[36px_1fr_80px_60px_56px] gap-3 px-5 py-2.5 border-b border-peak-border">
                <span />
                <span className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider">Task</span>
                <span className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider">Priority</span>
                <span className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider">XP</span>
                <span />
              </div>

              {tasks.map(task => {
                const isWeeklyCount = (task.weekly_target ?? 1) > 1
                const done = isTaskDone(task, selectedDay)
                const count = getCompletionCount(task, selectedDay)
                const target = task.weekly_target ?? 1
                const isEditing = editingId === task.id

                return (
                  <div
                    key={task.id}
                    className="group grid grid-cols-[36px_1fr_80px_60px_56px] gap-3 items-center px-5 py-3 border-b border-peak-border last:border-0 hover:bg-peak-bg transition-colors"
                  >
                    {/* Completion toggle */}
                    {isWeeklyCount ? (
                      <button
                        onClick={() => handleComplete(task)}
                        disabled={completing === task.id || done}
                        className={`text-[9px] font-bold w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          done
                            ? 'bg-green-500 border-green-500 text-white'
                            : completing === task.id
                            ? 'opacity-50 border-peak-border text-peak-muted'
                            : 'border-peak-border text-peak-muted hover:border-peak-accent hover:text-peak-accent'
                        }`}
                        title={`${count}/${target} done this week`}
                      >
                        {done ? '✓' : '+1'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleComplete(task)}
                        disabled={completing === task.id}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          done
                            ? 'bg-peak-text border-peak-text'
                            : completing === task.id
                            ? 'opacity-50 border-peak-border'
                            : 'border-peak-border hover:border-peak-accent'
                        }`}
                        aria-label={done ? 'Undo completion' : 'Complete task'}
                      >
                        {done && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )}

                    {/* Title / edit form */}
                    {isEditing ? (
                      <EditTaskForm
                        task={task}
                        onSave={async (updates) => {
                          await updateTask(task.id, updates)
                          setEditingId(null)
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="min-w-0">
                        <span className={`text-sm ${done ? 'line-through text-peak-muted' : 'text-peak-text'}`}>
                          {task.title}
                        </span>
                        {isWeeklyCount && (
                          <span className="ml-2 text-[10px] text-peak-muted">{count}/{target} this week</span>
                        )}
                      </div>
                    )}

                    <Badge priority={task.priority_override ?? task.priority} />
                    <span className="text-xs text-peak-muted font-medium">{getXpForPriority(task.priority_override ?? task.priority)} XP</span>

                    {/* Edit / delete — visible on row hover */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(isEditing ? null : task.id)}
                        className="text-peak-muted hover:text-peak-text text-xs transition-colors"
                        aria-label="Edit task"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-peak-muted hover:text-red-500 text-xs transition-colors"
                        aria-label="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}

              {showAddForm ? (
                <div className="px-5 py-3 border-t border-peak-border">
                  <AddTaskForm onSave={handleAddTask} onCancel={() => setShowAddForm(false)} />
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full text-left px-5 py-3 text-xs text-peak-muted hover:text-peak-accent hover:bg-peak-bg transition-colors border-t border-peak-border"
                >
                  + Add task
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function EditTaskForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState(task.priority_override ?? task.priority)
  const [isOneTime, setIsOneTime] = useState(task.is_one_time ?? false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({ title: title.trim(), priority_override: priority, is_one_time: isOneTime })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 col-span-1">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 text-sm border border-peak-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="text-xs border border-peak-border rounded-lg px-1.5 py-1 text-peak-text focus:outline-none"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="optional">Optional</option>
        </select>
        <button type="submit" disabled={saving} className="text-xs font-semibold text-peak-accent hover:underline disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-peak-muted hover:text-peak-text">Cancel</button>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isOneTime}
          onChange={e => setIsOneTime(e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-peak-accent"
        />
        <span className="text-[10px] text-peak-muted">One-time task</span>
        {isOneTime && (
          <span className="text-[10px] text-peak-muted italic">· disappears after this week</span>
        )}
      </label>
    </form>
  )
}

function AddTaskForm({ onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isOneTime, setIsOneTime] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), priority, is_one_time: isOneTime })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task name..."
          className="flex-1 text-sm border border-peak-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="text-xs border border-peak-border rounded-lg px-2 py-1.5 text-peak-text focus:outline-none"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="optional">Optional</option>
        </select>
        <button type="submit" className="text-xs font-semibold bg-peak-accent text-white px-3 py-1.5 rounded-lg hover:bg-amber-500">Save</button>
        <button type="button" onClick={onCancel} className="text-xs text-peak-muted hover:text-peak-text">Cancel</button>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isOneTime}
          onChange={e => setIsOneTime(e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-peak-accent"
        />
        <span className="text-xs text-peak-muted">One-time task</span>
        {isOneTime && (
          <span className="text-[10px] text-peak-muted italic">· will disappear after this week</span>
        )}
      </label>
    </form>
  )
}
