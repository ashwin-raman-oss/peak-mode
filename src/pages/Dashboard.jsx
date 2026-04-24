// src/pages/Dashboard.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { useBig3, BIG3_START_DATE } from '../hooks/useBig3'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import XPToast from '../components/XPToast'
import { getXpInLevel, XP_PER_LEVEL } from '../lib/xp'

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

function Big3Card({ todayBig3, todayStr, onSave }) {
  const [editing, setEditing] = useState(!todayBig3)
  const [items, setItems] = useState([
    todayBig3?.item_1 ?? '',
    todayBig3?.item_2 ?? '',
    todayBig3?.item_3 ?? '',
  ])
  const [saving, setSaving] = useState(false)

  // Sync when todayBig3 loads
  if (todayBig3 && editing === false && items.every(i => i === '')) {
    setItems([todayBig3.item_1 ?? '', todayBig3.item_2 ?? '', todayBig3.item_3 ?? ''])
  }

  async function handleSave() {
    if (!items.some(i => i.trim())) return
    setSaving(true)
    try {
      await onSave(todayStr, { item_1: items[0].trim(), item_2: items[1].trim(), item_3: items[2].trim() })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const set = todayBig3 && !editing

  return (
    <div className="mt-5 bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-peak-border flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-peak-text">Today's Big 3</span>
          <span className="ml-2 text-[10px] text-peak-muted">Your 3 priorities for today</span>
        </div>
        {set && (
          <button onClick={() => setEditing(true)} className="text-xs text-peak-accent hover:underline">Edit</button>
        )}
      </div>

      <div className="px-5 py-4">
        {set ? (
          <div className="space-y-2">
            {[todayBig3.item_1, todayBig3.item_2, todayBig3.item_3].filter(Boolean).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-peak-accent-light text-peak-accent text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-peak-text">{item}</span>
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
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !items.some(i => i.trim())}
                className="text-xs font-semibold bg-peak-accent text-white px-4 py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Big 3'}
              </button>
              {todayBig3 && (
                <button onClick={() => setEditing(false)} className="text-xs text-peak-muted hover:text-peak-text">Cancel</button>
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
  const { user } = useAuth()
  const { profile, addXp } = useProfile(user?.id)
  const {
    tasks, arenas,
    getTodaysFocusTasks, getArenaStats, getWeekXp, isTaskDone, completeTask,
  } = useTasks(user?.id)
  const todayStr = localTodayStr()
  const showBig3 = todayStr >= BIG3_START_DATE
  const { big3ByDate, saveBig3 } = useBig3(showBig3 ? user?.id : null)
  const todayBig3 = big3ByDate[todayStr] ?? null
  const [toast, setToast] = useState(null)
  const [completing, setCompleting] = useState(null)

  const focusTasks = getTodaysFocusTasks()
  const weekXp = getWeekXp()
  const doneTasks = focusTasks.filter(t => isTaskDone(t)).length

  const xpPct = profile
    ? Math.min(100, Math.round((getXpInLevel(profile.total_xp) / XP_PER_LEVEL) * 100))
    : 0

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
          <StatCard
            label="Streak"
            value={profile?.current_streak ?? 0}
            sub="days"
            borderColor="border-peak-accent"
            valueColor="text-peak-text"
          />
          <StatCard
            label="Today"
            value={`${doneTasks}/${focusTasks.length}`}
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
          <StatCard
            label="Level"
            value={profile?.level ?? 1}
            sub={`${xpPct}% to next`}
            borderColor="border-peak-text"
            valueColor="text-peak-text"
          />
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
                  <div key={slug}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-semibold text-peak-text">{meta.label}</span>
                      <span className="text-xs text-peak-muted">{stats.completed}/{stats.total}</span>
                    </div>
                    <div className="h-1.5 bg-peak-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Big 3 card — only shown from April 24 onwards */}
        {showBig3 && (
          <Big3Card todayBig3={todayBig3} todayStr={todayStr} onSave={saveBig3} />
        )}
      </main>
    </div>
  )
}
