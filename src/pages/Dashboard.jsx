import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import TodaysFocus from '../components/TodaysFocus'
import FormDipBanner from '../components/FormDipBanner'
import ArenaCard from '../components/ArenaCard'
import XPToast from '../components/XPToast'
import { formatWeekRange, getWeekStart } from '../lib/dates'

const ARENA_SLUGS = ['career', 'health', 'learning', 'misc']

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, addXp } = useProfile(user?.id)
  const { tasks, arenas, loading: tasksLoading, getTodaysFocusTasks, getArenaStats, getWeekXp, isTaskDone, completeTask } = useTasks(user?.id)

  const [toast, setToast] = useState(null)
  const [completing, setCompleting] = useState(null)

  const weekStart = getWeekStart(new Date())
  const weekRange = formatWeekRange(weekStart)
  const focusTasks = getTodaysFocusTasks()
  const weekXp = getWeekXp()
  const highRemainingToday = tasks.filter(t =>
    (t.priority_override ?? t.priority) === 'high' &&
    t.recurrence === 'daily' &&
    !isTaskDone(t)
  ).length

  const totalStats = ARENA_SLUGS.reduce((acc, slug) => {
    const s = getArenaStats(slug)
    return { completed: acc.completed + s.completed, total: acc.total + s.total }
  }, { completed: 0, total: 0 })

  async function handleComplete(task) {
    setCompleting(task.id)
    try {
      const xp = await completeTask(task)
      await addXp(xp)

      let hypeMessage = null
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/hype', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            taskTitle: task.title,
            arenaName: task.arenas?.name ?? 'Unknown',
          }),
        })
        if (res.ok) {
          const data = await res.json()
          hypeMessage = data.message
        }
      } catch {
        // hype is optional
      }

      setToast({ xp, hypeMessage })
    } catch (err) {
      console.error('Failed to complete task:', err)
    } finally {
      setCompleting(null)
    }
  }

  if (profileLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-peak-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-peak-bg">
      <Header profile={profile} />

      <main className="max-w-3xl mx-auto px-6 py-5 space-y-5">
        {/* Week header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-peak-muted tracking-widest uppercase">
            Week of {weekRange}
          </p>
          <span className="text-2xl font-bold text-peak-xp tabular-nums leading-none">
            {weekXp} <span className="text-sm font-semibold">XP</span>
          </span>
        </div>

        {/* Stats bar */}
        {profile && (
          <div className="grid grid-cols-3 divide-x divide-peak-border bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 text-center">
              <p className="text-[9px] font-bold tracking-widest uppercase text-peak-muted mb-0.5">Tasks Done</p>
              <p className="text-lg font-bold text-peak-primary tabular-nums leading-tight">
                {totalStats.completed}<span className="text-peak-muted font-normal text-sm">/{totalStats.total}</span>
              </p>
            </div>
            <div className="px-5 py-3.5 text-center">
              <p className="text-[9px] font-bold tracking-widest uppercase text-peak-muted mb-0.5">Streak</p>
              <p className="text-lg font-bold text-peak-primary tabular-nums leading-tight">
                {profile.current_streak}<span className="text-peak-muted font-normal text-sm"> days</span>
              </p>
            </div>
            <div className="px-5 py-3.5 text-center">
              <p className="text-[9px] font-bold tracking-widest uppercase text-peak-muted mb-0.5">Level</p>
              <p className="text-lg font-bold text-peak-accent tabular-nums leading-tight">
                {profile.level}
              </p>
            </div>
          </div>
        )}

        {/* Form dip warning */}
        <FormDipBanner count={highRemainingToday} />

        {/* Today's Focus */}
        <TodaysFocus
          tasks={focusTasks}
          onComplete={handleComplete}
          completing={completing}
        />

        {/* Arena grid */}
        <div className="grid grid-cols-2 gap-3">
          {ARENA_SLUGS.map(slug => {
            const arena = arenas.find(a => a.slug === slug)
            if (!arena) return null
            return (
              <ArenaCard
                key={slug}
                arena={arena}
                stats={getArenaStats(slug)}
              />
            )
          })}
        </div>
      </main>

      {toast && (
        <XPToast
          xp={toast.xp}
          hypeMessage={toast.hypeMessage}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}
