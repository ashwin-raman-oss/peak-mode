import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { useRecentActivity } from '../hooks/useRecentActivity'
import { useLastWeekCommitments } from '../hooks/useLastWeekCommitments'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import TodaysFocus from '../components/TodaysFocus'
import FormDipBanner from '../components/FormDipBanner'
import ArenaCard from '../components/ArenaCard'
import XPToast from '../components/XPToast'
import { formatWeekRange, getWeekStart } from '../lib/dates'

const ARENA_SLUGS = ['career', 'health', 'learning', 'misc']

const ARENA_COLOR = {
  career:   '#2D5BE3',
  health:   '#059669',
  learning: '#7C3AED',
  misc:     '#D97706',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, loading: profileLoading, addXp } = useProfile(user?.id)
  const {
    tasks, arenas, loading: tasksLoading,
    getTodaysFocusTasks, getArenaStats, getWeekXp, isTaskDone, completeTask,
  } = useTasks(user?.id)
  const { activity } = useRecentActivity(user?.id)
  const { commitments } = useLastWeekCommitments(user?.id)

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

  const bestArena = ARENA_SLUGS.reduce((best, slug) => {
    const arena = arenas.find(a => a.slug === slug)
    if (!arena) return best
    const s = getArenaStats(slug)
    const pct = s.total > 0 ? s.completed / s.total : 0
    return pct > best.pct ? { name: arena.name, pct } : best
  }, { name: '—', pct: 0 })

  const weekSummary = profile ? {
    completed: totalStats.completed,
    total: totalStats.total,
    weekXp,
    bestArena: bestArena.name,
  } : null

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

      <main className="max-w-3xl mx-auto px-6 pt-4 pb-8 space-y-4">
        {/* Week hero row */}
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold text-peak-muted tracking-widest uppercase">
            Week of {weekRange}
          </p>
          <span className="tabular-nums leading-none">
            <span className="text-4xl font-extrabold text-peak-xp">{weekXp}</span>
            <span className="text-sm font-medium text-peak-muted ml-1">XP</span>
          </span>
        </div>

        {/* Stats bar */}
        {profile && (
          <div className="flex bg-white rounded-xl shadow-sm overflow-hidden">
            {[
              { label: 'Tasks Done', value: <>{totalStats.completed}<span className="text-peak-muted font-normal text-xl">/{totalStats.total}</span></>, color: 'text-peak-primary' },
              { label: 'Streak',     value: <>{profile.current_streak}<span className="text-peak-muted font-normal text-xl"> d</span></>,           color: 'text-peak-primary' },
              { label: 'Level',      value: profile.level,                                                                                            color: 'text-peak-accent' },
            ].map((stat, i) => (
              <div key={stat.label} className={`flex-1 px-5 py-4 text-center ${i > 0 ? 'border-l border-peak-border' : ''}`}>
                <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mb-1">{stat.label}</p>
                <p className={`text-3xl font-extrabold tabular-nums leading-none ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Form dip warning */}
        <FormDipBanner count={highRemainingToday} />

        {/* Last week's commitments */}
        {commitments.length > 0 && (
          <div className="bg-peak-accent-light border border-peak-accent/20 rounded-xl p-4">
            <p className="text-[10px] font-black tracking-widest uppercase text-peak-accent mb-2">This Week's Commitments</p>
            <ol className="space-y-1.5">
              {commitments.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-4 h-4 rounded border border-peak-accent/40 mt-0.5" />
                  <span className="text-sm text-peak-primary leading-snug">{c.replace(/^\d+\.\s*/, '')}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Today's Focus */}
        <TodaysFocus
          tasks={focusTasks}
          onComplete={handleComplete}
          completing={completing}
          weekSummary={weekSummary}
        />

        {/* Arena grid */}
        <div className="grid grid-cols-2 gap-3">
          {ARENA_SLUGS.map(slug => {
            const arena = arenas.find(a => a.slug === slug)
            if (!arena) return null
            const arenaTasks = tasks.filter(t => t.arenas?.slug === slug)
            return (
              <ArenaCard
                key={slug}
                arena={arena}
                stats={getArenaStats(slug)}
                tasks={arenaTasks}
                isTaskDone={isTaskDone}
              />
            )
          })}
        </div>

        {/* Recent activity */}
        {activity.length > 0 && (
          <section className="bg-peak-surface border border-peak-border rounded-xl p-5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mb-3">This Week's Activity</p>
            <div className="space-y-0">
              {activity.map((item, i) => (
                <div key={item.id} className={`flex items-center gap-3 py-2.5 ${i < activity.length - 1 ? 'border-b border-peak-border/50' : ''}`}>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ARENA_COLOR[item.arenaSlug] ?? '#9CA3AF' }}
                  />
                  <span className="text-sm text-peak-primary font-medium flex-1 truncate">{item.taskTitle}</span>
                  <span className="text-xs text-peak-muted shrink-0 tabular-nums">{item.timeAgo}</span>
                </div>
              ))}
            </div>
          </section>
        )}
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
