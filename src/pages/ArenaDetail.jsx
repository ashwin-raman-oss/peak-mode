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
    tasks, arenas, loading, isTaskDone, getCompletionCount, completeTask, addMiscTask, getArenaStats,
  } = useTasks(user?.id, slug)

  const [toast, setToast] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [addingTask, setAddingTask] = useState(false)
  const [levelUpMsg, setLevelUpMsg] = useState(null)
  const [actionError, setActionError] = useState(null)

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
        <p className="text-slate-500">Arena not found.</p>
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

  return (
    <div className="min-h-screen bg-peak-bg">
      <Header profile={profile} />

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Arena header */}
        <div className="mb-6">
          <button onClick={() => navigate('/')} className="text-slate-600 text-xs mb-3 hover:text-slate-400 transition-colors">
            ← Dashboard
          </button>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{arena.emoji}</span>
            <div>
              <h1 className="text-xl font-black tracking-wide text-white">{arena.name}</h1>
              <p className="text-xs text-slate-500">{stats.completed} / {stats.total} tasks · {stats.xpEarned} XP this week</p>
            </div>
          </div>
          <ProgressBar value={stats.completed} max={Math.max(stats.total, 1)} />
        </div>

        {actionError && (
          <p role="alert" className="text-red-400 text-xs font-medium bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2 mb-4">
            {actionError}
          </p>
        )}

        {/* Recurring tasks */}
        {recurringTasks.length > 0 && (
          <section className="bg-peak-surface border border-peak-border rounded-xl p-4 mb-4">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-3">Recurring</p>
            {recurringTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                completionCount={getCompletionCount(task)}
                isDone={isTaskDone(task)}
                onComplete={handleComplete}
                completing={completing === task.id}
              />
            ))}
          </section>
        )}

        {/* Misc tasks */}
        <section className="bg-peak-surface border border-peak-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">This Week</p>
            <Button size="sm" onClick={() => setShowAddModal(true)}>+ Add Task</Button>
          </div>
          {miscTasks.length === 0 && (
            <p className="text-slate-600 text-xs py-2">No tasks added yet this week.</p>
          )}
          {miscTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              completionCount={getCompletionCount(task)}
              isDone={isTaskDone(task)}
              onComplete={handleComplete}
              completing={completing === task.id}
            />
          ))}
        </section>
      </main>

      {/* Add task modal */}
      {showAddModal && (
        <Modal title="Add Task" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">Title</label>
              <input
                id="task-title"
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                autoFocus
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-peak-accent transition-colors"
                placeholder="Task title..."
              />
            </div>
            <div>
              <label htmlFor="task-priority" className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">Priority</label>
              <select
                id="task-priority"
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="w-full bg-peak-bg border border-peak-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-peak-accent transition-colors"
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
            <p className="text-5xl font-black text-white tracking-widest">{levelUpMsg}</p>
          </div>
        </div>
      )}
    </div>
  )
}
