# Peak Mode UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Peak Mode from a top-nav SPA to a structured dashboard with a dark sidebar, Plus Jakarta Sans font, amber accent system, and past-day journaling from two entry points.

**Architecture:** Token-first approach — update Tailwind color tokens and font, then build the Sidebar/TopBar shell in App.jsx, then sweep each page. Each page imports a shared `TopBar` component and passes its own title/subtitle/action props. The `Sidebar` fetches the profile itself via `useProfile`. The activity feed is removed from the dashboard.

**Tech Stack:** React 19, Vite, Tailwind CSS 3, React Router DOM 7, Supabase, Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `tailwind.config.js` | Modify | New `peak-*` color tokens |
| `src/index.css` | Modify | Plus Jakarta Sans font |
| `src/components/ui/Button.jsx` | Modify | Amber primary, new token classes |
| `src/components/ui/Badge.jsx` | Modify | Updated token classes |
| `src/components/ui/Modal.jsx` | Modify | Updated token classes |
| `src/components/ui/ProgressBar.jsx` | Modify | Amber fill token |
| `src/components/Sidebar.jsx` | Create | Dark sidebar with nav + XP footer |
| `src/components/TopBar.jsx` | Create | White page header bar (title + action slot) |
| `src/App.jsx` | Modify | Fixed sidebar layout, remove Header |
| `src/components/Header.jsx` | Delete | Replaced by Sidebar + TopBar |
| `src/pages/Dashboard.jsx` | Modify | Stats row + two-column layout, no activity feed |
| `src/pages/ArenaDetail.jsx` | Modify | Table-style task list, inline add |
| `src/pages/HabitTracker.jsx` | Modify | Stat card + restyled grid |
| `src/pages/Journal.jsx` | Modify | Restyled timeline + Log Past Entry button |
| `src/pages/MonthlyTracker.jsx` | Modify | Restyled calendar + amber dots |
| `src/pages/WeeklyReport.jsx` | Modify | Typography + nav in TopBar |
| `src/components/DayDetailModal.jsx` | Modify | Add Journal tab with inline add/edit |
| `src/components/PastEntryModal.jsx` | Create | Date picker + morning/evening form |

---

## Task 1: Design Tokens + Font

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Update tailwind.config.js color tokens**

Replace the entire `colors.peak` block:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        peak: {
          sidebar:          '#18181B',
          'sidebar-hover':  '#27272A',
          'sidebar-active': '#27272A',
          'sidebar-text':   '#71717A',
          'sidebar-border': '#27272A',
          bg:               '#F8F9FA',
          surface:          '#FFFFFF',
          border:           '#E4E4E7',
          text:             '#09090B',
          muted:            '#71717A',
          accent:           '#F59E0B',
          'accent-light':   '#FEF3C7',
          success:          '#22C55E',
          'success-light':  '#F0FDF4',
        },
      },
      animation: {
        'xp-float': 'xpFloat 1.4s ease-out forwards',
        'fade-in':  'fadeIn 0.15s ease-out',
        'level-up': 'levelUp 2.2s ease-out forwards',
        'form-dip': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        xpFloat: {
          '0%':   { opacity: '1', transform: 'translateY(0px)' },
          '100%': { opacity: '0', transform: 'translateY(-56px)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        levelUp: {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '20%':  { opacity: '1', transform: 'scale(1.15)' },
          '70%':  { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Update src/index.css font**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

* {
  box-sizing: border-box;
}

body {
  background-color: #F8F9FA;
  color: #09090B;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js src/index.css
git commit -m "style: design tokens — dark sidebar palette, amber accent, Plus Jakarta Sans"
```

---

## Task 2: Reskin Shared UI Components

**Files:**
- Modify: `src/components/ui/Button.jsx`
- Modify: `src/components/ui/Badge.jsx`
- Modify: `src/components/ui/Modal.jsx`
- Modify: `src/components/ui/ProgressBar.jsx`

- [ ] **Step 1: Update Button.jsx**

```jsx
// src/components/ui/Button.jsx
export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'
  const variants = {
    primary: 'bg-peak-accent text-white hover:bg-amber-500',
    ghost:   'bg-white text-peak-text border border-peak-border hover:bg-peak-bg',
    danger:  'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEE2E2]',
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-xs px-4 py-2.5',
    lg: 'text-sm px-6 py-3.5',
  }
  return (
    <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Update Badge.jsx**

```jsx
// src/components/ui/Badge.jsx
export default function Badge({ priority }) {
  const config = {
    high:     { label: 'HIGH', className: 'bg-peak-accent text-white' },
    medium:   { label: 'MED',  className: 'bg-[#2563EB] text-white' },
    optional: { label: 'OPT',  className: 'bg-[#6B7280] text-white' },
  }
  const { label, className } = config[priority] ?? config.optional
  return (
    <span className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 3: Update Modal.jsx**

```jsx
// src/components/ui/Modal.jsx
import { useEffect } from 'react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className="relative w-full max-w-md bg-peak-surface border border-peak-border rounded-2xl p-6 shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 id="modal-title" className="text-sm font-bold text-peak-text">{title}</h2>
          <button onClick={onClose} aria-label="Close"
            className="text-peak-muted hover:text-peak-text text-lg leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update ProgressBar.jsx**

```jsx
// src/components/ui/ProgressBar.jsx
export default function ProgressBar({ value, max, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-[4px] bg-peak-border rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-peak-accent rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "style: reskin shared UI components to new token system"
```

---

## Task 3: Build Sidebar.jsx

**Files:**
- Create: `src/components/Sidebar.jsx`

- [ ] **Step 1: Create Sidebar.jsx**

```jsx
// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { getXpInLevel } from '../lib/xp'
import { supabase } from '../lib/supabase'

const NAV_ITEMS = [
  { to: '/',        label: 'Dashboard',     icon: '⊞' },
  { to: '/arena/career', label: 'Arena',    icon: '◈' },
  { to: '/habits',  label: 'Habits',        icon: '◷' },
  { to: '/journal', label: 'Journal',       icon: '✎' },
  { to: '/month',   label: 'Monthly',       icon: '▦' },
  { to: '/report',  label: 'Weekly Report', icon: '⚡' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const navigate = useNavigate()

  const xpInLevel = profile ? getXpInLevel(profile.total_xp) : 0
  const xpPct = Math.min(100, Math.round((xpInLevel / 1000) * 100))
  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-peak-sidebar flex flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-peak-sidebar-border flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-peak-accent rounded-md flex items-center justify-center shrink-0">
          <span className="text-black font-extrabold text-xs">P</span>
        </div>
        <span className="text-white font-bold text-sm tracking-tight">Peak Mode</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <p className="text-[9px] font-semibold text-peak-sidebar-text uppercase tracking-widest px-2 mb-2">Main</p>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-peak-sidebar-active text-white'
                  : 'text-peak-sidebar-text hover:text-white hover:bg-peak-sidebar-hover'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User / XP footer */}
      <div className="px-4 py-4 border-t border-peak-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#3F3F46] flex items-center justify-center shrink-0">
            <span className="text-[#A1A1AA] text-xs font-bold">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.email?.split('@')[0] ?? 'User'}
            </p>
            <p className="text-peak-sidebar-text text-[10px]">Level {profile?.level ?? 1}</p>
          </div>
          {profile?.current_streak > 0 && (
            <span className="bg-peak-sidebar-active text-peak-accent text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
              🔥 {profile.current_streak}
            </span>
          )}
        </div>
        <div className="bg-peak-sidebar-border rounded-full h-[3px] mb-1">
          <div
            className="bg-peak-accent h-[3px] rounded-full transition-all duration-700"
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[9px] text-peak-sidebar-text">{profile?.total_xp ?? 0} XP</span>
          <button
            onClick={handleLogout}
            className="text-[9px] text-peak-sidebar-text hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.jsx
git commit -m "feat: Sidebar component — dark nav, XP footer, amber accent"
```

---

## Task 4: Build TopBar.jsx + Update App.jsx Layout

**Files:**
- Create: `src/components/TopBar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create TopBar.jsx**

```jsx
// src/components/TopBar.jsx
export default function TopBar({ title, subtitle, action }) {
  return (
    <div className="h-14 bg-white border-b border-peak-border flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-sm font-bold text-peak-text leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-peak-muted">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Update App.jsx with sidebar layout**

```jsx
// src/App.jsx
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ArenaDetail from './pages/ArenaDetail'
import WeeklyReport from './pages/WeeklyReport'
import MonthlyTracker from './pages/MonthlyTracker'
import HabitTracker from './pages/HabitTracker'
import Journal from './pages/Journal'

function WeeklyReportRoute() {
  const { weekDate } = useParams()
  return (
    <ProtectedRoute>
      <WeeklyReport key={weekDate ?? 'current'} />
    </ProtectedRoute>
  )
}

function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline  = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        {isOffline && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-peak-sidebar text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
            You're offline — showing cached data
          </div>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/arena/:slug" element={<ProtectedRoute><AppLayout><ArenaDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/report" element={<AppLayout><WeeklyReportRoute /></AppLayout>} />
          <Route path="/report/:weekDate" element={<AppLayout><WeeklyReportRoute /></AppLayout>} />
          <Route path="/month" element={<ProtectedRoute><AppLayout><MonthlyTracker /></AppLayout></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><AppLayout><HabitTracker /></AppLayout></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><AppLayout><Journal /></AppLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Delete Header.jsx**

```bash
rm src/components/Header.jsx
```

- [ ] **Step 4: Commit**

```bash
git add src/components/TopBar.jsx src/App.jsx
git rm src/components/Header.jsx
git commit -m "feat: AppLayout with fixed sidebar, TopBar component, retire Header"
```

---

## Task 5: Redesign Dashboard.jsx

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Replace Dashboard.jsx**

The new dashboard removes the activity feed, adds a 4-stat row, and uses a two-column layout for tasks + arena progress. Remove imports for `Header`, `FormDipBanner`, `ArenaCard`, `CheckinCard`, `useRecentActivity`, `useLastWeekCommitments`.

```jsx
// src/pages/Dashboard.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useTasks } from '../hooks/useTasks'
import { useCheckin } from '../hooks/useCheckin'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'
import XPToast from '../components/XPToast'
import { getWeekStart } from '../lib/dates'
import { getXpInLevel } from '../lib/xp'

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

export default function Dashboard() {
  const { user } = useAuth()
  const { profile, addXp } = useProfile(user?.id)
  const {
    tasks, arenas,
    getTodaysFocusTasks, getArenaStats, getWeekXp, isTaskDone, completeTask,
  } = useTasks(user?.id)
  const { morningDone, eveningDone } = useCheckin(user?.id)

  const [toast, setToast] = useState(null)
  const [completing, setCompleting] = useState(null)

  const focusTasks = getTodaysFocusTasks()
  const weekXp = getWeekXp()
  const doneTasks = focusTasks.filter(t => isTaskDone(t)).length

  const xpPct = profile
    ? Math.min(100, Math.round((getXpInLevel(profile.total_xp) / 1000) * 100))
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
      setToast({ xp, message, id: Date.now() })
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
          <XPToast key={toast.id} xp={toast.xp} message={toast.message} onDone={() => setToast(null)} />
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
      </main>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: redesign Dashboard — stats row, two-column focus+arena layout"
```

---

## Task 6: Redesign ArenaDetail.jsx

**Files:**
- Modify: `src/pages/ArenaDetail.jsx`

- [ ] **Step 1: Read the current file to identify imports and hooks**

Run: `cat src/pages/ArenaDetail.jsx`

Note the existing hooks, Supabase queries, and state. Keep all data-fetching logic intact.

- [ ] **Step 2: Replace the JSX return (keep all hooks and handlers)**

Find the `return (` block and replace everything from `return (` to the final `)` with:

```jsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={arena?.name ?? slug}
        subtitle={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        <div className="bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
          {/* Task list */}
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

              {/* Inline add row */}
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
```

Also add `import TopBar from '../components/TopBar'` and `import Badge from '../components/ui/Badge'` to the imports, and remove `import Header from '../components/Header'`. Add `const [showAddForm, setShowAddForm] = useState(false)` to state if not present, and an `AddTaskForm` component at the bottom of the file:

```jsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ArenaDetail.jsx
git commit -m "feat: redesign ArenaDetail — table-style task list, inline add"
```

---

## Task 7: Redesign HabitTracker.jsx

**Files:**
- Modify: `src/pages/HabitTracker.jsx`

- [ ] **Step 1: Read the current file**

Run: `cat src/pages/HabitTracker.jsx`

Note the existing state and data for `currentStreak`, `longestStreak`, and the 66-day grid logic.

- [ ] **Step 2: Replace imports and return block**

Add `import TopBar from '../components/TopBar'`, remove `import Header`.

Replace the return block:

```jsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Habit Tracker" subtitle="66-day challenge" />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        {/* Streak stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm">
          <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-accent rounded-xl px-4 py-4">
            <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">Current Streak</p>
            <p className="text-2xl font-extrabold text-peak-text">{currentStreak}</p>
            <p className="text-[10px] text-peak-muted">days</p>
          </div>
          <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-text rounded-xl px-4 py-4">
            <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">Longest Streak</p>
            <p className="text-2xl font-extrabold text-peak-text">{longestStreak}</p>
            <p className="text-[10px] text-peak-muted">days</p>
          </div>
        </div>

        {/* 66-day grid */}
        <div className="bg-peak-surface border border-peak-border rounded-xl p-5">
          <p className="text-xs font-semibold text-peak-muted uppercase tracking-widest mb-4">66-Day Grid</p>
          <div className="grid grid-cols-11 gap-1.5">
            {days.map((day, i) => (
              <div
                key={i}
                title={day.label}
                className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-semibold transition-colors ${
                  day.isFuture
                    ? 'bg-[#F4F4F5] text-[#D4D4D8]'
                    : day.completed
                    ? 'bg-peak-accent text-white'
                    : 'bg-peak-border text-peak-muted'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
```

Note: `days`, `currentStreak`, `longestStreak` must already exist from the existing hook/logic — preserve all of that unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/pages/HabitTracker.jsx
git commit -m "feat: redesign HabitTracker — stat cards, amber grid"
```

---

## Task 8: Redesign Journal.jsx + Add Log Past Entry Button

**Files:**
- Modify: `src/pages/Journal.jsx`

- [ ] **Step 1: Read the full file**

Run: `cat src/pages/Journal.jsx`

- [ ] **Step 2: Update imports and state**

Replace `import Header from '../components/Header'` with `import TopBar from '../components/TopBar'`.
Add `import PastEntryModal from '../components/PastEntryModal'` (will be created in Task 11).
Add to state: `const [showPastEntry, setShowPastEntry] = useState(false)`

- [ ] **Step 3: Replace the return block**

```jsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Journal"
        subtitle="Morning & evening check-ins"
        action={
          <button
            onClick={() => setShowPastEntry(true)}
            className="text-xs font-semibold bg-peak-accent text-white px-3 py-1.5 rounded-lg hover:bg-amber-500 transition-colors"
          >
            + Log Past Entry
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        {/* Today's check-in buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => !morningDone && setModal('morning')}
            disabled={morningDone}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              morningDone
                ? 'border-peak-border text-peak-muted cursor-default'
                : 'border-peak-accent text-peak-accent hover:bg-peak-accent-light'
            }`}
          >
            {morningDone ? '✓ Morning Done' : 'Morning Check-in'}
          </button>
          <button
            onClick={() => !eveningDone && setModal('evening')}
            disabled={eveningDone}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              eveningDone
                ? 'bg-peak-bg border border-peak-border text-peak-muted cursor-default'
                : 'bg-peak-accent text-white hover:bg-amber-500'
            }`}
          >
            {eveningDone ? '✓ Evening Done' : 'Evening Check-in'}
          </button>
          {/* Filter */}
          <div className="ml-auto flex gap-1">
            {['week', 'month', 'all'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-peak-text text-white'
                    : 'text-peak-muted hover:text-peak-text'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {grouped.length === 0 && (
          <p className="text-center text-peak-muted text-sm py-16">No entries yet.</p>
        )}
        <div className="space-y-4">
          {grouped.map(([date, { morning, evening }]) => (
            <div key={date} className="bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-peak-border flex items-center justify-between">
                <span className="text-xs font-bold text-peak-text">{formatJournalDate(date)}</span>
                {date !== new Date().toISOString().slice(0, 10) && (
                  <span className="text-[9px] text-peak-muted">· backdated</span>
                )}
              </div>
              {morning && <JournalEntry entry={morning} type="morning" />}
              {evening && <JournalEntry entry={evening} type="evening" />}
            </div>
          ))}
        </div>
      </main>

      {/* Today's check-in modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md bg-peak-surface border border-peak-border rounded-2xl p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-peak-text">
                {modal === 'morning' ? 'Morning Check-in' : 'Evening Check-in'}
              </h2>
              <button onClick={() => setModal(null)} className="text-peak-muted hover:text-peak-text text-lg">&times;</button>
            </div>
            {modal === 'morning'
              ? <MorningForm saveCheckin={saveCheckin} onSuccess={handleSuccess} />
              : <EveningForm saveCheckin={saveCheckin} onSuccess={handleSuccess} />
            }
          </div>
        </div>
      )}

      {showPastEntry && (
        <PastEntryModal
          userId={user?.id}
          onClose={() => setShowPastEntry(false)}
          onSuccess={() => { setShowPastEntry(false); refresh() }}
        />
      )}
    </div>
  )
```

- [ ] **Step 4: Add JournalEntry helper component at the bottom of the file**

```jsx
function ScoreBar({ value, max = 5 }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-peak-border rounded-full overflow-hidden">
        <div className="h-full bg-peak-accent rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-peak-muted">{value}/{max}</span>
    </div>
  )
}

function JournalEntry({ entry, type }) {
  return (
    <div className="px-5 py-4 border-b border-peak-border last:border-0">
      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3 ${
        type === 'morning' ? 'bg-peak-accent-light text-peak-accent' : 'bg-[#EFF6FF] text-[#2563EB]'
      }`}>
        {type === 'morning' ? 'Morning' : 'Evening'}
      </span>
      {type === 'morning' && entry.intention && (
        <p className="text-sm text-peak-text">{entry.intention}</p>
      )}
      {type === 'evening' && (
        <div className="space-y-2">
          {entry.day_rating && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-peak-muted w-16">Day rating</span>
              <ScoreBar value={entry.day_rating} />
            </div>
          )}
          {[entry.gratitude_1, entry.gratitude_2, entry.gratitude_3].filter(Boolean).map((g, i) => (
            <p key={i} className="text-sm text-peak-text">· {g}</p>
          ))}
          {entry.reflection && <p className="text-sm text-peak-muted italic mt-1">{entry.reflection}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Journal.jsx
git commit -m "feat: redesign Journal — restyled timeline, Log Past Entry button"
```

---

## Task 9: Redesign MonthlyTracker.jsx

**Files:**
- Modify: `src/pages/MonthlyTracker.jsx`

- [ ] **Step 1: Read the current file**

Run: `cat src/pages/MonthlyTracker.jsx`

Note the calendar grid rendering, month navigation, and `selectedDay` / `DayDetailModal` usage.

- [ ] **Step 2: Update imports**

Replace `import Header from '../components/Header'` with `import TopBar from '../components/TopBar'`.

- [ ] **Step 3: Replace the return block**

Keep all existing state and handlers. Replace only the JSX return:

```jsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        subtitle="Monthly view"
        action={
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="text-xs text-peak-muted hover:text-peak-text px-2 py-1 rounded-lg hover:bg-peak-bg transition-colors">← Prev</button>
            <button onClick={nextMonth} className="text-xs text-peak-muted hover:text-peak-text px-2 py-1 rounded-lg hover:bg-peak-bg transition-colors">Next →</button>
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        <div className="bg-peak-surface border border-peak-border rounded-xl overflow-hidden">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-peak-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center py-2.5 text-[10px] font-semibold text-peak-muted uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} className="border-b border-r border-peak-border aspect-square" />
              const hasActivity = completionsByDate[day.dateStr] > 0
              const isToday = day.dateStr === todayStr
              const isPast = day.dateStr < todayStr
              return (
                <div
                  key={day.dateStr}
                  onClick={() => isPast || isToday ? setSelectedDay(day.dateStr) : null}
                  className={`relative border-b border-r border-peak-border p-2 aspect-square flex flex-col transition-colors ${
                    isPast || isToday ? 'cursor-pointer hover:bg-peak-bg' : 'cursor-default'
                  } ${isToday ? 'bg-peak-accent-light' : ''}`}
                >
                  <span className={`text-xs font-semibold ${isToday ? 'text-peak-accent' : 'text-peak-text'}`}>
                    {day.day}
                  </span>
                  {hasActivity && (
                    <div className="w-1.5 h-1.5 rounded-full bg-peak-accent mt-auto" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          userId={user?.id}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/MonthlyTracker.jsx
git commit -m "feat: redesign MonthlyTracker — clean grid, amber dot indicators"
```

---

## Task 10: Redesign WeeklyReport.jsx

**Files:**
- Modify: `src/pages/WeeklyReport.jsx`

- [ ] **Step 1: Read the current file**

Run: `cat src/pages/WeeklyReport.jsx`

Note the week navigation logic (`prevWeek`, `nextWeek`, `weekLabel`) and report content structure.

- [ ] **Step 2: Update imports and return block**

Replace `import Header from '../components/Header'` with `import TopBar from '../components/TopBar'`.

Replace the return block (keep all data-fetching logic and handlers):

```jsx
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Weekly Report"
        subtitle={
          <span className="flex items-center gap-2">
            <button onClick={prevWeek} className="hover:text-peak-text transition-colors">←</button>
            <span>{weekLabel}</span>
            <button onClick={nextWeek} disabled={!canGoNext} className="hover:text-peak-text transition-colors disabled:opacity-30">→</button>
          </span>
        }
      />
      <main className="flex-1 overflow-y-auto bg-peak-bg p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            {/* Stats summary */}
            {report?.stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-accent rounded-xl px-4 py-4">
                  <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">Tasks Done</p>
                  <p className="text-2xl font-extrabold text-peak-text">{report.stats.completed}</p>
                </div>
                <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-accent rounded-xl px-4 py-4">
                  <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">XP Earned</p>
                  <p className="text-2xl font-extrabold text-peak-accent">+{report.stats.xp}</p>
                </div>
                <div className="bg-peak-surface border border-peak-border border-l-[3px] border-l-peak-success rounded-xl px-4 py-4">
                  <p className="text-[9px] font-semibold text-peak-muted uppercase tracking-widest mb-1">Best Arena</p>
                  <p className="text-xl font-extrabold text-peak-text">{report.stats.bestArena}</p>
                </div>
              </div>
            )}

            {/* AI Coach */}
            {report?.coach && (
              <div className="bg-peak-surface border border-peak-border rounded-xl p-6">
                <p className="text-[10px] font-semibold text-peak-muted uppercase tracking-widest mb-4">AI Coach</p>
                <p className="text-[15px] text-peak-text leading-[1.7] whitespace-pre-wrap">{report.coach}</p>
              </div>
            )}

            {!report && (
              <p className="text-center text-peak-muted text-sm py-16">No report available for this week yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/WeeklyReport.jsx
git commit -m "feat: redesign WeeklyReport — typography, nav in TopBar"
```

---

## Task 11: Add Journal Tab to DayDetailModal

**Files:**
- Modify: `src/components/DayDetailModal.jsx`

- [ ] **Step 1: Add journal state and fetch to DayDetailModal**

After the existing `const [loading, setLoading] = useState(true)` line, add:

```jsx
const [activeTab, setActiveTab] = useState('tasks')
const [journalEntries, setJournalEntries] = useState({ morning: null, evening: null })
const [journalLoading, setJournalLoading] = useState(false)
const [expandedForm, setExpandedForm] = useState(null) // 'morning' | 'evening' | null
const [journalDraft, setJournalDraft] = useState('')
const [dayRating, setDayRating] = useState(null)
```

- [ ] **Step 2: Fetch journal entries alongside tasks**

In the existing `fetchData` function inside `useEffect`, add a third parallel query:

```jsx
async function fetchData() {
  setLoading(true)
  const [{ data: tasksData }, { data: completionsData }, { data: journalData }] = await Promise.all([
    supabase.from('tasks').select('*, arenas(id, name, slug, emoji)').eq('user_id', userId).eq('is_active', true).order('created_at'),
    supabase.from('task_completions').select('*').eq('user_id', userId).gte('completed_at', date + 'T00:00:00Z').lt('completed_at', date + 'T23:59:59Z'),
    supabase.from('daily_checkins').select('*').eq('user_id', userId).eq('date', date),
  ])
  setTasks(tasksData || [])
  setCompletions(completionsData || [])
  const entries = { morning: null, evening: null }
  ;(journalData || []).forEach(e => { entries[e.type] = e })
  setJournalEntries(entries)
  setLoading(false)
}
```

- [ ] **Step 3: Add saveJournalEntry helper inside the component**

```jsx
async function saveJournalEntry(type) {
  setJournalLoading(true)
  const payload = {
    user_id: userId,
    date,
    type,
    ...(type === 'morning'
      ? { intention: journalDraft.trim() }
      : { day_rating: dayRating, reflection: journalDraft.trim() || null }),
  }
  const { data } = await supabase
    .from('daily_checkins')
    .upsert(payload, { onConflict: 'user_id,date,type' })
    .select()
    .single()
  if (data) {
    setJournalEntries(prev => ({ ...prev, [type]: data }))
  }
  setExpandedForm(null)
  setJournalDraft('')
  setDayRating(null)
  setJournalLoading(false)
}
```

- [ ] **Step 4: Replace the Modal children JSX**

Replace everything inside `<Modal title={...} onClose={onClose}>` with:

```jsx
<Modal title={formatDate(date)} onClose={onClose}>
  {/* Tab bar */}
  <div className="flex gap-1 mb-4 bg-peak-bg rounded-lg p-1">
    {['tasks', 'journal'].map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
          activeTab === tab ? 'bg-white text-peak-text shadow-sm' : 'text-peak-muted'
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>

  {loading ? (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 border-2 border-peak-accent border-t-transparent rounded-full animate-spin" />
    </div>
  ) : activeTab === 'tasks' ? (
    <>
      {isFuture && (
        <p className="text-xs text-peak-muted bg-peak-bg rounded-lg px-3 py-2 mb-4">Future date — view only</p>
      )}
      <p className="text-xs text-peak-muted mb-4">{dailyDone} of {dailyTasks.length} daily tasks completed</p>
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
                  {isWeeklyTask && <span className="text-[10px] text-peak-muted shrink-0">weekly</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {tasks.length === 0 && <p className="text-peak-muted text-sm text-center py-4">No tasks found.</p>}
    </>
  ) : (
    /* Journal tab */
    <div className="space-y-3">
      {['morning', 'evening'].map(type => {
        const entry = journalEntries[type]
        const isExpanded = expandedForm === type
        return (
          <div key={type} className="border border-peak-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-peak-bg">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  type === 'morning' ? 'bg-peak-accent-light text-peak-accent' : 'bg-[#EFF6FF] text-[#2563EB]'
                }`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                {entry && <span className="text-[10px] text-peak-muted">✓ Done</span>}
              </div>
              {!isFuture && (
                <button
                  onClick={() => setExpandedForm(isExpanded ? null : type)}
                  className="text-xs text-peak-accent font-semibold hover:underline"
                >
                  {entry ? 'Edit' : '+ Add'}
                </button>
              )}
            </div>
            {entry && !isExpanded && (
              <div className="px-4 py-3">
                {type === 'morning' && <p className="text-sm text-peak-text">{entry.intention}</p>}
                {type === 'evening' && entry.day_rating && (
                  <p className="text-sm text-peak-text">Day rating: {entry.day_rating}/5</p>
                )}
              </div>
            )}
            {isExpanded && (
              <div className="px-4 py-3 space-y-3">
                {type === 'morning' ? (
                  <>
                    <p className="text-xs text-peak-muted">Set your intention for that day</p>
                    <textarea
                      autoFocus
                      value={journalDraft || entry?.intention || ''}
                      onChange={e => setJournalDraft(e.target.value)}
                      placeholder="My focus that day was..."
                      className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-peak-muted">How was the day?</p>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button
                          key={n}
                          onClick={() => setDayRating(n)}
                          className={`w-8 h-8 rounded-full border-2 text-sm font-semibold flex items-center justify-center transition-colors ${
                            (dayRating ?? entry?.day_rating) === n
                              ? 'bg-peak-accent border-peak-accent text-white'
                              : 'border-peak-border text-peak-muted hover:border-peak-accent/50'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={journalDraft || entry?.reflection || ''}
                      onChange={e => setJournalDraft(e.target.value)}
                      placeholder="Reflection..."
                      className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
                    />
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => saveJournalEntry(type)}
                    disabled={journalLoading}
                    className="text-xs font-semibold bg-peak-accent text-white px-3 py-1.5 rounded-lg hover:bg-amber-500 disabled:opacity-50"
                  >
                    {journalLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setExpandedForm(null); setJournalDraft(''); setDayRating(null) }}
                    className="text-xs text-peak-muted hover:text-peak-text"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )}
</Modal>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/DayDetailModal.jsx
git commit -m "feat: DayDetailModal — Journal tab with inline add/edit for past days"
```

---

## Task 12: Build PastEntryModal.jsx

**Files:**
- Create: `src/components/PastEntryModal.jsx`

- [ ] **Step 1: Create PastEntryModal.jsx**

```jsx
// src/components/PastEntryModal.jsx
import { useState } from 'react'
import Modal from './ui/Modal'
import { supabase } from '../lib/supabase'

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

export default function PastEntryModal({ userId, onClose, onSuccess }) {
  const today = toDateStr(new Date())
  const yesterday = toDateStr(new Date(Date.now() - 86400000))

  const [selectedDate, setSelectedDate] = useState(yesterday)
  const [type, setType] = useState('morning')
  const [intention, setIntention] = useState('')
  const [dayRating, setDayRating] = useState(null)
  const [reflection, setReflection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedDate || selectedDate >= today) return
    setSubmitting(true)
    setError(null)

    const payload = {
      user_id: userId,
      date: selectedDate,
      type,
      ...(type === 'morning'
        ? { intention: intention.trim() }
        : {
            day_rating: dayRating,
            reflection: reflection.trim() || null,
          }),
    }

    const { error: dbError } = await supabase
      .from('daily_checkins')
      .upsert(payload, { onConflict: 'user_id,date,type' })

    setSubmitting(false)
    if (dbError) {
      setError('Could not save entry. Please try again.')
      return
    }
    onSuccess?.()
  }

  const isValid = selectedDate && selectedDate < today &&
    (type === 'morning' ? intention.trim().length > 0 : dayRating !== null)

  return (
    <Modal title="Log Past Entry" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date picker */}
        <div>
          <label className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider block mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            max={yesterday}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full text-sm border border-peak-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-peak-accent/30 text-peak-text"
          />
        </div>

        {/* Morning / Evening toggle */}
        <div>
          <label className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider block mb-1">Session</label>
          <div className="flex gap-2">
            {['morning', 'evening'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${
                  type === t
                    ? 'bg-peak-accent text-white border-peak-accent'
                    : 'border-peak-border text-peak-muted hover:text-peak-text'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        {type === 'morning' ? (
          <div>
            <label className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider block mb-1">Intention</label>
            <textarea
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="My focus that day was..."
              className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider block mb-2">Day Rating</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDayRating(n)}
                    className={`w-9 h-9 rounded-full border-2 text-sm font-semibold flex items-center justify-center transition-colors ${
                      dayRating === n
                        ? 'bg-peak-accent border-peak-accent text-white'
                        : 'border-peak-border text-peak-muted hover:border-peak-accent/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-peak-muted uppercase tracking-wider block mb-1">Reflection</label>
              <textarea
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                placeholder="How did the day go?"
                className="w-full text-sm border border-peak-border rounded-lg p-2.5 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-peak-accent/30"
              />
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full bg-peak-accent text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PastEntryModal.jsx
git commit -m "feat: PastEntryModal — date picker, morning/evening form, Supabase upsert"
```

---

## Task 13: Smoke Test + Polish Pass

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify each route**

Open http://localhost:5173 and check:

| Route | Check |
|---|---|
| `/` | Sidebar visible, stats row shows, task list + arena progress render |
| `/arena/career` | Table-style task list, inline add row at bottom |
| `/habits` | Streak stat cards above 66-day grid, amber filled cells |
| `/journal` | Timeline entries styled, "Log Past Entry" button in top bar |
| `/month` | Clean calendar grid, amber dots on days with activity |
| `/report` | Prev/Next in TopBar subtitle, AI coach text readable |

- [ ] **Step 3: Test Log Past Entry flow**

1. Go to `/journal`
2. Click "Log Past Entry"
3. Pick yesterday's date, select Morning, enter intention, click Save
4. Verify entry appears in timeline with "· backdated" label

- [ ] **Step 4: Test Monthly Tracker Journal tab**

1. Go to `/month`
2. Click any past day
3. Verify modal has Tasks + Journal tabs
4. In Journal tab, click "+ Add" for Morning
5. Enter text, save, verify entry preview appears

- [ ] **Step 5: Fix any token reference errors**

Search for any remaining references to removed tokens:

```bash
grep -r "peak-primary\|peak-xp\|peak-elevated\|peak-accent-light\b" src/ --include="*.jsx"
```

For each match, replace:
- `peak-primary` → `peak-text`
- `peak-xp` → `peak-accent`
- `peak-elevated` → `peak-bg`
- `peak-accent-light` (old blue tint) — replace with `peak-accent-light` only where amber tint is intended; otherwise use arena-specific bg colors

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: smoke test polish — token cleanup, final reskin pass"
```
