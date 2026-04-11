import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import TaskRow from '../components/TaskRow'
import XPToast from '../components/XPToast'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'

export default function ArenaDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading, addXp } = useProfile(user?.id)
  const {
    tasks, arenas, loading, isTaskDone, getCompletionCount, completeTask, addMiscTask,
    updateTask, deleteTask, getArenaStats,
  } = useTasks(user?.id, slug)

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

  // Fallback: clear level-up overlay if animationend never fires
  useEffect(() => {
    if (!levelUpMsg) return
    const t = setTimeout(() => setLevelUpMsg(null), 3000)
    return () => clearTimeout(t)
  }, [levelUpMsg])

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
  const recurringTasks = tasks.filter(t => t.task_type === 'recurring')
  const miscTasks = tasks.filter(t => t.task_type === 'misc')

  async function handleComplete(task) {
    setCompleting(task.id)
    try {
      const xp = await completeTask(task)
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

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Arena header */}
        <div className="mb-6">
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

        {actionError && (
          <p role="alert" className="text-[#DC2626] text-xs font-medium bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-3 py-2 mb-4">
            {actionError}
          </p>
        )}

        {/* Recurring tasks */}
        {recurringTasks.length > 0 && (
          <section className="bg-peak-surface border border-peak-border rounded-xl p-4 mb-4">
            <p className="text-[10px] font-black tracking-widest uppercase text-peak-muted mb-3">Recurring</p>
            {recurringTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                completionCount={getCompletionCount(task)}
                isDone={isTaskDone(task)}
                onComplete={handleComplete}
                completing={completing === task.id}
                onEdit={handleEditOpen}
                onDelete={handleDeleteOpen}
              />
            ))}
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
          {miscTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              completionCount={getCompletionCount(task)}
              isDone={isTaskDone(task)}
              onComplete={handleComplete}
              completing={completing === task.id}
              onEdit={handleEditOpen}
              onDelete={handleDeleteOpen}
            />
          ))}
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
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="optional">🟢 Optional</option>
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
            <p className="text-xs bg-[#1E1A10] border border-[#3A2E10] text-[#8A7040] rounded-lg px-3 py-2 mb-4">
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
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="optional">🟢 Optional</option>
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
