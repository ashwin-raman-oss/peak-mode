// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { useBig3, BIG3_START_DATE } from '../hooks/useBig3'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import XPToast from '../components/XPToast'
import { getXpInLevel, getXpToNextLevel, XP_PER_LEVEL } from '../lib/xp'

const ARENA_SLUGS = ['career', 'health', 'learning', 'misc']

const ARENA_META = {
  career:   { label: 'Career',   color: '#2563EB', bg: '#EFF6FF' },
  health:   { label: 'Health',   color: '#22C55E', bg: '#F0FDF4' },
  learning: { label: 'Learning', color: '#F97316', bg: '#FFF7ED' },
  misc:     { label: 'Misc',     color: '#A1A1AA', bg: '#F4F4F5' },
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function getLevelTitle(level) {
  if (level >= 10) return 'Peak Mode'
  if (level >= 7) return 'Elite'
  if (level >= 5) return 'Performer'
  if (level >= 3) return 'Contender'
  return 'Rookie'
}

function Big3Card({ todayBig3, onSave, onMarkDone }) {
  const [editing, setEditing] = useState(false)
  const [items, setItems] = useState(['', '', ''])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [markError, setMarkError] = useState(null)

  // When todayBig3 loads async from Supabase, switch to saved view and sync text.
  // If null (nothing saved yet), stay in edit mode.
  useEffect(() => {
    if (todayBig3?.task_1) {
      setEditing(false)
      setItems([todayBig3.task_1 ?? '', todayBig3.task_2 ?? '', todayBig3.task_3 ?? ''])
    } else if (todayBig3 === null) {
      setEditing(true)
    }
  }, [todayBig3])

  async function handleSave() {
    if (!items.some(i => i.trim())) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(items[0].trim(), items[1].trim(), items[2].trim())
      setEditing(false)
    } catch (err) {
      console.error('Big 3 save failed:', err)
      setSaveError('Failed to save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleMark(num, done) {
    setMarkError(null)
    try {
      await onMarkDone(num, done)
    } catch (err) {
      console.error('Big 3 mark failed:', err)
      setMarkError('Could not save. Try again.')
    }
  }

  const set = todayBig3 && !editing
  // Use task_N_done — matches the DB column name
  const itemEntries = [
    { num: 1, text: todayBig3?.task_1, done: !!todayBig3?.task_1_done },
    { num: 2, text: todayBig3?.task_2, done: !!todayBig3?.task_2_done },
    { num: 3, text: todayBig3?.task_3, done: !!todayBig3?.task_3_done },
  ].filter(e => e.text)

  const allDone = itemEntries.length > 0 && itemEntries.every(e => e.done)

  return (
    <div className="mt-5 bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-peak-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-peak-text">Today's Big 3</span>
          {set && allDone && (
            <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
              ✓ All done!
            </span>
          )}
          {set && !allDone && (
            <span className="text-[10px] text-peak-muted">Check off as you complete them</span>
          )}
        </div>
        {set && (
          <button onClick={() => setEditing(true)} className="text-xs text-peak-accent hover:underline">Edit</button>
        )}
      </div>

      <div className="px-5 py-4">
        {set ? (
          <div className="space-y-2">
            {markError && (
              <p className="text-xs text-red-500 mb-1">{markError}</p>
            )}
            {itemEntries.map(({ num, text, done }) => (
              <div key={num} className="flex items-start gap-3">
                <button
                  onClick={() => handleMark(num, !done)}
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    done ? 'bg-peak-text border-peak-text' : 'border-peak-border hover:border-peak-accent'
                  }`}
                  aria-label={done ? 'Unmark done' : 'Mark done'}
                >
                  {done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`text-sm ${done ? 'line-through text-peak-muted' : 'text-peak-text'}`}>{text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-peak-accent-light text-peak-accent text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <input
                  value={items[i]}
                  onChange={e => setItems(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                  placeholder={`Priority ${i + 1}…`}
                  className="flex-1 text-sm border border-peak-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
                />
              </div>
            ))}
            {saveError && (
              <p className="text-xs text-red-500 pt-1">{saveError}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !items.some(i => i.trim())}
                className="text-xs font-semibold bg-peak-accent text-white px-4 py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Big 3'}
              </button>
              {todayBig3 && (
                <button onClick={() => { setEditing(false); setSaveError(null) }} className="text-xs text-peak-muted hover:text-peak-text">Cancel</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, borderColor, valueColor }) {
  return (
    <div className={`bg-peak-surface border border-peak-border border-l-[3px] ${borderColor} rounded-xl px-4 py-4`}>
      <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-extrabold tracking-tight ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-peak-muted mt-0.5">{sub}</p>
    </div>
  )
}

function localTodayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, addXp } = useProfile(user?.id)
  const {
    tasks, arenas,
    getTodaysFocusTasks, getArenaStats, getWeekXp, isTaskDone, completeTask,
  } = useTasks(user?.id)
  const todayStr = localTodayStr()
  const showBig3 = todayStr >= BIG3_START_DATE
  const { todayBig3, saveBig3, markItemDone } = useBig3(showBig3 ? user?.id : null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    console.log('[Dashboard] todayBig3:', todayBig3)
  }, [todayBig3])
  const [completing, setCompleting] = useState(null)

  const focusTasks = getTodaysFocusTasks()
  const weekXp = getWeekXp()
  const doneTasks = focusTasks.filter(t => isTaskDone(t)).length

  // All-arena task totals for today
  const allTaskStats = ARENA_SLUGS.reduce(
    (acc, slug) => { const s = getArenaStats(slug); return { done: acc.done + s.completed, total: acc.total + s.total } },
    { done: 0, total: 0 }
  )

  // Level display
  const level = profile?.level ?? 1
  const xpToNext = profile ? getXpToNextLevel(profile.total_xp) : XP_PER_LEVEL
  const levelTitle = getLevelTitle(level)

  // Streak sub-label
  const streak = profile?.current_streak ?? 0
  const streakSub = streak > 0 ? '🔥 Keep it going' : showBig3 ? 'Start today — set your Big 3' : 'Starts Apr 24'

  async function handleComplete(task) {
    if (isTaskDone(task) || completing === task.id) return
    setCompleting(task.id)
    try {
      const xp = await completeTask(task)
      await addXp(xp)
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
      setToast({ xp, hypeMessage: message, id: Date.now() })
    } finally {
      setCompleting(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Dashboard"
        subtitle={todayLabel()}
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        {toast && (
          <XPToast key={toast.id} xp={toast.xp} hypeMessage={toast.hypeMessage} onDone={() => setToast(null)} />
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* FIX 1: Streak card — tied to Big 3 */}
          <StatCard
            label="Big 3 Streak"
            value={streak}
            sub={streakSub}
            borderColor="border-peak-accent"
            valueColor="text-peak-text"
          />

          {/* FIX 2: Today count — all tasks across all arenas */}
          <StatCard
            label="Today's Tasks"
            value={`${allTaskStats.done}/${allTaskStats.total}`}
            sub="tasks done"
            borderColor="border-peak-success"
            valueColor="text-peak-text"
          />

          <StatCard
            label="XP This Week"
            value={`+${weekXp}`}
            sub="earned"
            borderColor="border-peak-accent"
            valueColor="text-peak-accent"
          />

          {/* FIX 3: Level card — with title and XP to next */}
          <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-accent rounded-xl px-4 py-4">
            <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">Level</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold tracking-tight text-peak-text">{level}</p>
              <p className="text-xs font-bold text-peak-accent">{levelTitle}</p>
            </div>
            <p className="text-[10px] text-peak-muted mt-0.5">{xpToNext} XP to Level {level + 1}</p>
          </div>
        </div>

        {/* Two-column */}
        <div className="flex gap-5">
          {/* Today's Focus */}
          <div className="flex-1 bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-peak-border flex items-center justify-between">
              <span className="text-sm font-bold text-peak-text">Today's Focus</span>
              <span className="text-xs text-peak-muted">{doneTasks} of {focusTasks.length} complete</span>
            </div>
            <div>
              {focusTasks.length === 0 && (
                <p className="text-peak-muted text-sm text-center py-8">No tasks for today.</p>
              )}
              {focusTasks.map(task => {
                const done = isTaskDone(task)
                const arena = arenas.find(a => a.id === task.arena_id)
                const meta = ARENA_META[arena?.slug] ?? ARENA_META.misc
                return (
                  <div
                    key={task.id}
                    onClick={() => !done && handleComplete(task)}
                    className={`flex items-center gap-3 px-5 py-3 border-b border-peak-border last:border-0 transition-colors ${
                      !done ? 'cursor-pointer hover:bg-peak-bg' : 'opacity-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      done ? 'bg-peak-text border-peak-text' : 'border-peak-border'
                    }`}>
                      {done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm flex-1 ${done ? 'line-through text-peak-muted' : 'text-peak-text'}`}>
                      {task.title}
                    </span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Arena Progress */}
          <div className="w-[320px] shrink-0 bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-peak-border">
              <span className="text-sm font-bold text-peak-text">Arena Progress</span>
            </div>
            <div className="px-5 py-4 space-y-4">
              {ARENA_SLUGS.map(slug => {
                const stats = getArenaStats(slug)
                const meta = ARENA_META[slug]
                const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                return (
                  <button
                    key={slug}
                    onClick={() => navigate(`/arena/${slug}`)}
                    className="w-full text-left group"
                  >
                    <div className="flex justify-between mb-1.5 items-center">
                      <span className="text-xs font-semibold text-peak-text group-hover:text-peak-accent transition-colors">
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-peak-muted">{stats.completed}/{stats.total}</span>
                        <span className="text-peak-muted opacity-0 group-hover:opacity-100 transition-opacity text-xs">→</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-peak-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Big 3 card — only shown from April 24 onwards */}
        {showBig3 && (
          <Big3Card
            todayBig3={todayBig3}
            onSave={saveBig3}
            onMarkDone={markItemDone}
          />
        )}
      </main>
    </div>
  )
}
