import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { toDateStr, getWeekStart } from '../lib/dates'
import Header from '../components/Header'
import TaskRow from '../components/TaskRow'
import XPToast from '../components/XPToast'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'

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

  return (
    <div className="min-h-screen bg-peak-bg">
      <Header profile={profile} />

      <main className="max-w-3xl mx-auto px-6 py-5">
        {/* Arena header */}
        <div className="mb-4">
          <button onClick={() => navigate('/')} className="text-peak-muted text-xs mb-3 hover:text-peak-text transition-colors">
            ← Dashboard
          </button>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{arena.emoji}</span>
            <div>
              <h1 className="text-xl font-black tracking-wide text-peak-primary">{arena.name}</h1>
              <p className="text-xs text-peak-muted">{stats.completed} / {stats.total} tasks · {stats.xpEarned} XP this week</p>
            </div>
          </div>
          <ProgressBar value={stats.completed} max={Math.max(stats.total, 1)} />
        </div>

        {/* Day tab bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {weekDays.map(day => {
            const isSelected = day.dateStr === selectedDate
            const dotStatus = getDotStatus(day)
            return (
              <button
                key={day.dateStr}
                onClick={() => !day.isFuture && setSelectedDate(day.dateStr)}
                disabled={day.isFuture}
                className={`flex flex-col items-center min-w-[52px] px-3 py-2 rounded-lg text-center transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed
                  ${isSelected
                    ? 'bg-peak-accent text-white'
                    : day.isToday
                      ? 'border border-peak-accent text-peak-accent bg-white'
                      : 'bg-peak-surface border border-peak-border text-peak-muted hover:border-peak-accent hover:text-peak-text'
                  }`}
              >
                <span className={`text-[10px] font-bold tracking-wide uppercase leading-none ${isSelected ? 'text-white/80' : ''}`}>
                  {day.label}
                </span>
                <span className={`text-sm font-black leading-tight mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                  {day.num}
                </span>
                <div className="mt-1 flex items-center justify-center h-2">
                  <StatusDot status={isSelected ? 'neutral' : dotStatus} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Retroactive editing banner */}
        {isRetroactiveMode && editingLabel && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2 mb-4">
            <p className="text-xs text-[#92400E] font-medium">
              Editing {editingLabel} — tap a daily task to toggle completion
            </p>
          </div>
        )}

        {actionError && (
          <p role="alert" className="text-[#DC2626] text-xs font-medium bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-3 py-2 mb-4">
            {actionError}
          </p>
        )}

        {/* Recurring tasks */}
        {visibleRecurring.length > 0 && (
          <section className="bg-peak-surface border border-peak-border rounded-xl p-4 mb-4">
            <p className="text-[10px] font-black tracking-widest uppercase text-peak-muted mb-3">Recurring</p>
            {visibleRecurring.map(task => {
              const done = isTaskDone(task, selectedDate)
              const isDaily = task.recurrence === 'daily'
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  completionCount={getCompletionCount(task, selectedDate)}
                  isDone={done}
                  onComplete={!isRetroactiveMode ? handleComplete : undefined}
                  onToggle={isRetroactiveMode && isDaily ? handleToggle : undefined}
                  readOnly={isRetroactiveMode && !isDaily}
                  completing={completing === task.id}
                  onEdit={handleEditOpen}
                  onDelete={handleDeleteOpen}
                />
              )
            })}
          </section>
        )}

        {/* Misc tasks */}
        <section className="bg-peak-surface border border-peak-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black tracking-widest uppercase text-peak-muted">This Week</p>
            <Button size="sm" onClick={() => setShowAddModal(true)}>+ Add Task</Button>
          </div>
          {miscTasks.length === 0 && (
            <p className="text-peak-muted text-xs py-2">No tasks added yet this week.</p>
          )}
          {miscTasks.map(task => {
            const done = isTaskDone(task, selectedDate)
            return (
              <TaskRow
                key={task.id}
                task={task}
                completionCount={getCompletionCount(task)}
                isDone={done}
                onComplete={!isRetroactiveMode ? handleComplete : undefined}
                readOnly={isRetroactiveMode}
                completing={completing === task.id}
                onEdit={handleEditOpen}
                onDelete={handleDeleteOpen}
              />
            )
          })}
        </section>
      </main>

      {/* Add task modal */}
      {showAddModal && (
        <Modal title="Add Task" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">Title</label>
              <input
                id="task-title"
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                autoFocus
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors"
                placeholder="Task title..."
              />
            </div>
            <div>
              <label htmlFor="task-priority" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">Priority</label>
              <select
                id="task-priority"
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="lg" className="flex-1" disabled={addingTask}>
                {addingTask ? 'Adding...' : 'Add Task'}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit task modal */}
      {taskToEdit && (
        <Modal title="Edit Task" onClose={() => setTaskToEdit(null)}>
          {taskToEdit.task_type === 'recurring' && (
            <p className="text-xs bg-peak-elevated border border-peak-border text-peak-muted rounded-lg px-3 py-2 mb-4">
              This is a recurring task — changes apply permanently
            </p>
          )}
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">Title</label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                required
                autoFocus
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors"
              />
            </div>
            <div>
              <label htmlFor="edit-priority" className="block text-xs font-bold tracking-widest text-peak-muted uppercase mb-1.5">Priority</label>
              <select
                id="edit-priority"
                value={editPriority}
                onChange={e => setEditPriority(e.target.value)}
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-peak-primary text-sm focus:outline-none focus:border-peak-accent transition-colors"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="lg" className="flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => setTaskToEdit(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {taskToDelete && (
        <Modal title="Delete Task" onClose={() => setTaskToDelete(null)}>
          <p className="text-sm text-peak-primary mb-1 font-medium">{taskToDelete.title}</p>
          <p className="text-xs text-peak-muted mb-5">Delete this task? This will also remove all completion history.</p>
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 !bg-[#FEF2F2] !border-[#FCA5A5] hover:!bg-[#FEE2E2] !text-[#DC2626]"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => setTaskToDelete(null)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}

      {/* XP toast */}
      {toast && (
        <XPToast xp={toast.xp} hypeMessage={toast.hypeMessage} onDone={() => setToast(null)} />
      )}

      {/* Level up overlay */}
      {levelUpMsg && (
        <div
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          onAnimationEnd={() => setLevelUpMsg(null)}
        >
          <div className="animate-level-up text-center">
            <p className="text-[10px] font-black tracking-widest text-peak-accent uppercase mb-1">Level Up</p>
            <p className="text-5xl font-black text-peak-primary tracking-widest">{levelUpMsg}</p>
          </div>
        </div>
      )}
    </div>
  )
}
