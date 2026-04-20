import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import { supabase } from '../lib/supabase'
import { toDateStr, getWeekStart } from '../lib/dates'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function DayDetailModal({ date, userId, onClose }) {
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [{ data: tasksData }, { data: completionsData }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, arenas(id, name, slug, emoji)')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at'),
        supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', userId)
          .gte('completed_at', date + 'T00:00:00Z')
          .lt('completed_at', date + 'T23:59:59Z'),
      ])
      setTasks(tasksData || [])
      setCompletions(completionsData || [])
      setLoading(false)
    }
    fetchData()
  }, [date, userId])

  const today = toDateStr(new Date())
  const isFuture = date > today

  const dateObj = new Date(date + 'T12:00:00Z')
  const dow = dateObj.getUTCDay() // 0=Sun
  const isWeekday = dow !== 0 && dow !== 6 // eslint-disable-line no-unused-vars

  const completedIds = new Set(completions.map(c => c.task_id))

  const byArena = {}
  tasks.forEach(task => {
    const name = task.arenas?.name ?? 'Misc'
    if (!byArena[name]) byArena[name] = { arena: task.arenas, tasks: [] }
    byArena[name].tasks.push(task)
  })

  const dailyTasks = tasks.filter(t => t.recurrence === 'daily')
  const dailyDone = dailyTasks.filter(t => completedIds.has(t.id)).length

  async function toggleTask(task) {
    if (isFuture) return
    if (task.recurrence === 'weekly') return

    const isCompleted = completedIds.has(task.id)

    if (isCompleted) {
      await supabase
        .from('task_completions')
        .delete()
        .eq('user_id', userId)
        .eq('task_id', task.id)
        .gte('completed_at', date + 'T00:00:00Z')
        .lt('completed_at', date + 'T23:59:59Z')
      setCompletions(prev => prev.filter(c => c.task_id !== task.id))
    } else {
      const weekStart = toDateStr(getWeekStart(new Date(date + 'T12:00:00Z')))
      const { data: newComp } = await supabase
        .from('task_completions')
        .insert({
          user_id: userId,
          task_id: task.id,
          completed_at: date + 'T12:00:00Z',
          xp_earned: 0,
          week_start_date: weekStart,
        })
        .select()
        .single()
      if (newComp) setCompletions(prev => [...prev, newComp])
    }
  }

  return (
    <Modal title={formatDate(date)} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {isFuture && (
            <p className="text-xs text-peak-muted bg-peak-elevated rounded-lg px-3 py-2 mb-4">
              Future date — view only
            </p>
          )}

          <p className="text-xs text-peak-muted mb-4">
            {dailyDone} of {dailyTasks.length} daily tasks completed
          </p>

          {Object.entries(byArena).map(([arenaName, { arena, tasks: arenaTasks }]) => (
            <div key={arenaName} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{arena?.emoji ?? '•'}</span>
                <span className="text-xs font-bold tracking-widest uppercase text-peak-muted">{arenaName}</span>
              </div>
              <div className="space-y-1.5">
                {arenaTasks.map(task => {
                  const isCompleted = completedIds.has(task.id)
                  const isWeeklyTask = task.recurrence === 'weekly'
                  const isToggleable = !isFuture && !isWeeklyTask

                  return (
                    <div
                      key={task.id}
                      onClick={() => isToggleable && toggleTask(task)}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isToggleable ? 'cursor-pointer hover:bg-peak-elevated' : 'cursor-default'
                      }`}
                    >
                      {!isWeeklyTask ? (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-peak-accent border-peak-accent'
                            : 'border-peak-border'
                        }`}>
                          {isCompleted && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-peak-border shrink-0" />
                      )}

                      <span className={`text-sm flex-1 ${isCompleted ? 'line-through text-peak-muted' : 'text-peak-primary'}`}>
                        {task.title}
                      </span>

                      {isWeeklyTask && (
                        <span className="text-[10px] text-peak-muted shrink-0">weekly</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <p className="text-peak-muted text-sm text-center py-4">No tasks found.</p>
          )}
        </>
      )}
    </Modal>
  )
}
