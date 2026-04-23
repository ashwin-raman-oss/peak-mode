import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { toDateStr } from '../lib/dates'
import TopBar from '../components/TopBar'
import Badge from '../components/ui/Badge'

export default function ArenaDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const {
    tasks, arenas, loading, deleteTask, addMiscTask,
  } = useTasks(user?.id, slug)

  const [showAddForm, setShowAddForm] = useState(false)
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
