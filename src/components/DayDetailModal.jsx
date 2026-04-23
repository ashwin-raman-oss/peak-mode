import { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import { supabase } from '../lib/supabase'
import { toDateStr, getWeekStart } from '../lib/dates'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function DayDetailModal({ date, userId, onClose }) {
  const [activeTab, setActiveTab] = useState('tasks')

  // Tasks state
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)

  // Journal state
  const [journalEntries, setJournalEntries] = useState({ morning: null, evening: null })
  const [journalLoading, setJournalLoading] = useState(true)
  const [expandedForm, setExpandedForm] = useState(null) // null | 'morning' | 'evening'

  const today = toDateStr(new Date())
  const isFuture = date > today

  useEffect(() => {
    async function fetchTasks() {
      setTasksLoading(true)
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
      setTasksLoading(false)
    }
    fetchTasks()
  }, [date, userId])

  useEffect(() => {
    async function fetchJournal() {
      setJournalLoading(true)
      const { data } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
      const entries = { morning: null, evening: null }
      ;(data || []).forEach(e => { entries[e.type] = e })
      setJournalEntries(entries)
      setJournalLoading(false)
    }
    fetchJournal()
  }, [date, userId])

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
    if (isFuture || task.recurrence === 'weekly') return
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

  async function saveJournalEntry(type, data) {
    const { data: saved, error } = await supabase
      .from('daily_checkins')
      .upsert(
        { user_id: userId, date, type, ...data },
        { onConflict: 'user_id,date,type' }
      )
      .select()
      .single()
    if (!error && saved) {
      setJournalEntries(prev => ({ ...prev, [type]: saved }))
      setExpandedForm(null)
    }
  }

  return (
    <Modal title={formatDate(date)} onClose={onClose}>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-peak-border -mt-1 pb-0 sticky top-0 bg-peak-surface z-10">
        {['tasks', 'journal'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-semibold px-3 py-2 border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-peak-accent text-peak-accent'
                : 'border-transparent text-peak-muted hover:text-peak-text'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        tasksLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {isFuture && (
              <p className="text-xs text-peak-muted bg-peak-bg rounded-lg px-3 py-2 mb-4">
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
                          isToggleable ? 'cursor-pointer hover:bg-peak-bg' : 'cursor-default'
                        }`}
                      >
                        {!isWeeklyTask ? (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isCompleted ? 'bg-peak-accent border-peak-accent' : 'border-peak-border'
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
                        <span className={`text-sm flex-1 ${isCompleted ? 'line-through text-peak-muted' : 'text-peak-text'}`}>
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
        )
      )}

      {/* Journal tab */}
      {activeTab === 'journal' && (
        journalLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {['morning', 'evening'].map(type => {
              const entry = journalEntries[type]
              const isExpanded = expandedForm === type
              return (
                <div key={type} className="border border-peak-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-base ${entry ? 'text-peak-success' : 'text-peak-border'}`}>
                        {entry ? '✓' : '○'}
                      </span>
                      <span className="text-sm font-medium text-peak-text capitalize">{type}</span>
                    </div>
                    {!isFuture && (
                      <button
                        onClick={() => setExpandedForm(isExpanded ? null : type)}
                        className="text-xs font-semibold text-peak-accent hover:underline"
                      >
                        {isExpanded ? 'Cancel' : entry ? 'Edit' : 'Add'}
                      </button>
                    )}
                  </div>

                  {/* Entry preview */}
                  {entry && !isExpanded && (
                    <div className="px-4 pb-3 border-t border-peak-border">
                      {type === 'morning' && entry.intention && (
                        <p className="text-sm text-peak-text mt-2">{entry.intention}</p>
                      )}
                      {type === 'evening' && (
                        <div className="mt-2 space-y-1">
                          {entry.day_rating && (
                            <p className="text-xs text-peak-muted">Rating: {entry.day_rating}/5</p>
                          )}
                          {[entry.gratitude_1, entry.gratitude_2, entry.gratitude_3].filter(Boolean).map((g, i) => (
                            <p key={i} className="text-sm text-peak-text">· {g}</p>
                          ))}
                          {entry.reflection && (
                            <p className="text-sm text-peak-muted italic">{entry.reflection}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline form */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-peak-border">
                      {type === 'morning'
                        ? <InlineMorningForm existing={entry} onSave={data => saveJournalEntry('morning', data)} />
                        : <InlineEveningForm existing={entry} onSave={data => saveJournalEntry('evening', data)} />
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </Modal>
  )
}

function InlineMorningForm({ existing, onSave }) {
  const [intention, setIntention] = useState(existing?.intention ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!intention.trim()) return
    setSubmitting(true)
    try { await onSave({ intention: intention.trim() }) }
    finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        autoFocus
        value={intention}
        onChange={e => setIntention(e.target.value)}
        placeholder="My focus today was..."
        className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
      />
      <button
        type="submit"
        disabled={submitting || !intention.trim()}
        className="bg-peak-accent text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-500 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}

function InlineEveningForm({ existing, onSave }) {
  const [dayRating, setDayRating] = useState(existing?.day_rating ?? null)
  const [gratitude1, setGratitude1] = useState(existing?.gratitude_1 ?? '')
  const [gratitude2, setGratitude2] = useState(existing?.gratitude_2 ?? '')
  const [gratitude3, setGratitude3] = useState(existing?.gratitude_3 ?? '')
  const [reflection, setReflection] = useState(existing?.reflection ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!dayRating) return
    setSubmitting(true)
    try {
      await onSave({
        day_rating: dayRating,
        gratitude_1: gratitude1.trim() || null,
        gratitude_2: gratitude2.trim() || null,
        gratitude_3: gratitude3.trim() || null,
        reflection: reflection.trim() || null,
      })
    } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2 mb-1">
        {[1, 2, 3, 4, 5].map(n => (
          <div
            key={n}
            onClick={() => setDayRating(n)}
            className={`w-8 h-8 rounded-full border-2 text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors select-none ${
              dayRating === n
                ? 'bg-peak-accent border-peak-accent text-white'
                : 'border-peak-border text-peak-muted hover:border-peak-accent/50'
            }`}
          >
            {n}
          </div>
        ))}
      </div>
      <input type="text" value={gratitude1} onChange={e => setGratitude1(e.target.value)} placeholder="Grateful for... (1)" className="w-full text-sm border border-peak-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30" />
      <input type="text" value={gratitude2} onChange={e => setGratitude2(e.target.value)} placeholder="Grateful for... (2)" className="w-full text-sm border border-peak-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30" />
      <input type="text" value={gratitude3} onChange={e => setGratitude3(e.target.value)} placeholder="Grateful for... (3)" className="w-full text-sm border border-peak-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30" />
      <textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="One thing I learned..." className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-peak-accent/30" />
      <button
        type="submit"
        disabled={submitting || !dayRating}
        className="bg-peak-accent text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-500 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
