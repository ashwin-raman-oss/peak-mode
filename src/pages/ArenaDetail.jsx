import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { toDateStr, getWeekStart } from '../lib/dates'
import TopBar from '../components/TopBar'
import TaskRow from '../components/TaskRow'
import XPToast from '../components/XPToast'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function StatusDot({ status }) {
  if (status === 'future')  return <span className="text-[8px] text-peak-muted leading-none">✕</span>
  if (status === 'full')    return <span className="w-1.5 h-1.5 rounded-full bg-[#059669] block" />
  if (status === 'partial') return <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] block" />
  if (status === 'missed')  return <span className="w-1.5 h-1.5 rounded-full border border-gray-300 block" />
  return <span className="w-1.5 h-1.5 block" />
}

export default function ArenaDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading, addXp } = useProfile(user?.id)
  const {
    tasks, arenas, loading, isTaskDone, getCompletionCount, completeTask, uncompleteTask,
    addMiscTask, updateTask, deleteTask, getArenaStats, getDailyStatsForDate,
  } = useTasks(user?.id, slug)

  const todayStr = toDateStr(new Date())
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const [toast, setToast] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [addingTask, setAddingTask] = useState(false)
  const [levelUpMsg, setLevelUpMsg] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!levelUpMsg) return
    const t = setTimeout(() => setLevelUpMsg(null), 3000)
    return () => clearTimeout(t)
  }, [levelUpMsg])

  // Build Mon–Sun tabs for the current week
  const weekDays = useMemo(() => {
    const weekStart = getWeekStart(new Date())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setUTCDate(d.getUTCDate() + i)
      const dateStr = toDateStr(d)
      return {
        dateStr,
        label: DAY_LABELS[i],
        num: d.getUTCDate(),
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        isWeekend: i >= 5,
      }
    })
  }, [todayStr])

  function getDotStatus(day) {
    if (day.isFuture) return 'future'
    if (day.isWeekend) return 'neutral'
    const { completed, total } = getDailyStatsForDate(day.dateStr)
    if (total === 0) return 'neutral'
    if (completed === total) return 'full'
    if (completed > 0) return 'partial'
    return 'missed'
  }

  const arena = arenas.find(a => a.slug === slug)

  if (loading || profileLoading) {
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

  const stats = getArenaStats(slug)
  const isRetroactiveMode = selectedDate !== todayStr
  const selectedDay = weekDays.find(d => d.dateStr === selectedDate)
  const isSelectedWeekend = selectedDay?.isWeekend ?? false

  const recurringTasks = tasks.filter(t => t.task_type === 'recurring')
  const miscTasks = tasks.filter(t => t.task_type === 'misc')

  // On weekend tabs, hide daily recurring
  const visibleRecurring = isSelectedWeekend
    ? recurringTasks.filter(t => t.recurrence !== 'daily')
    : recurringTasks

  // Editing label for retroactive banner
  const editingLabel = (() => {
    if (!isRetroactiveMode) return null
    const d = new Date(selectedDate + 'T00:00:00Z')
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    return `${dayName}, ${monthDay}`
  })()

  async function handleComplete(task) {
    if (isRetroactiveMode) {
      // Silent retroactive — no XP, no hype, no toast
      setCompleting(task.id)
      try {
        await completeTask(task, selectedDate)
      } catch (err) {
        console.error('Failed to complete task:', err)
        setActionError('Could not save completion. Try again.')
      } finally {
        setCompleting(null)
      }
      return
    }

    // Today — full behavior: XP, hype, toast
    setCompleting(task.id)
    try {
      const xp = await completeTask(task, todayStr)
      if (xp == null) return
      const { leveledUp, newLevel } = await addXp(xp)
      if (leveledUp) setLevelUpMsg(`LEVEL ${newLevel}`)

      let hypeMessage = null
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/hype', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ taskTitle: task.title, arenaName: arena.name }),
        })
        if (res.ok) {
          const data = await res.json()
          hypeMessage = data.message
        }
      } catch { /* hype is optional */ }

      setToast({ xp, hypeMessage })
    } catch (err) {
      console.error('Failed to complete task:', err)
      setActionError('Could not save completion. Try again.')
    } finally {
      setCompleting(null)
    }
  }

  async function handleUncomplete(task) {
    setCompleting(task.id)
    try {
      await uncompleteTask(task.id, selectedDate)
    } catch (err) {
      console.error('Failed to uncomplete task:', err)
      setActionError('Could not undo completion. Try again.')
    } finally {
      setCompleting(null)
    }
  }

  function handleToggle(task) {
    if (isTaskDone(task, selectedDate)) {
      handleUncomplete(task)
    } else {
      handleComplete(task)
    }
  }

  async function handleAddTask(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setAddingTask(true)
    try {
      await addMiscTask(arena.id, newTitle.trim(), newPriority)
      setNewTitle('')
      setNewPriority('medium')
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to add task:', err)
      setActionError('Could not add task. Try again.')
    } finally {
      setAddingTask(false)
    }
  }

  function handleEditOpen(task) {
    setTaskToEdit(task)
    setEditTitle(task.title)
    setEditPriority(task.priority_override ?? task.priority)
  }

  async function handleEditSave(e) {
    e.preventDefault()
    if (!editTitle.trim()) return
    setSaving(true)
    try {
      await updateTask(taskToEdit.id, { title: editTitle.trim(), priority_override: editPriority })
      setTaskToEdit(null)
    } catch (err) {
      console.error('Failed to update task:', err)
      setActionError('Could not update task. Try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteOpen(task) {
    setTaskToDelete(task)
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    try {
      await deleteTask(taskToDelete.id)
      setTaskToDelete(null)
    } catch (err) {
      console.error('Failed to delete task:', err)
      setActionError('Could not delete task. Try again.')
    } finally {
      setDeleting(false)
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

  async function handleAddTask({ title, priority }) {
    try {
      await addMiscTask(arena.id, title, priority)
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
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
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
              <div className="grid grid-cols-[1fr_80px_60px_40px] gap-3 px-5 py-2.5 border-b border-peak-border">
                <span className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider">Task</span>
                <span className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider">Priority</span>
                <span className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider">XP</span>
                <span />
              </div>
              {tasks.map(task => (
                <div key={task.id} className="grid grid-cols-[1fr_80px_60px_40px] gap-3 items-center px-5 py-3 border-b border-peak-border last:border-0 hover:bg-peak-bg transition-colors">
                  <span className="text-sm text-peak-text">{task.title}</span>
                  <Badge priority={task.priority_override ?? task.priority} />
                  <span className="text-xs text-peak-muted font-medium">{task.xp_value ?? 10} XP</span>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-peak-muted hover:text-red-500 text-xs transition-colors"
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </div>
              ))}

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

function AddTaskForm({ onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), priority })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
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
    </form>
  )
}
