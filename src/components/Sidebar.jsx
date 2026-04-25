// src/components/Sidebar.jsx
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useSidebar } from '../context/SidebarContext'
import { getXpInLevel, XP_PER_LEVEL } from '../lib/xp'
import { supabase } from '../lib/supabase'

const NAV_ITEMS_BEFORE = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
]

const ARENA_SLUGS = [
  { slug: 'career',   label: 'Career' },
  { slug: 'health',   label: 'Health' },
  { slug: 'learning', label: 'Learning' },
  { slug: 'misc',     label: 'Misc' },
]

const NAV_ITEMS_AFTER = [
  { to: '/habits',  label: 'Habits',        icon: '◷' },
  { to: '/journal', label: 'Journal',       icon: '✎' },
  { to: '/okrs',    label: 'OKRs',          icon: '◎' },
  { to: '/month',   label: 'Monthly',       icon: '▦' },
  { to: '/report',  label: 'Weekly Report', icon: '⚡' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { isOpen, close } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  const isArenaActive = location.pathname.startsWith('/arena/')

  const xpInLevel = profile ? getXpInLevel(profile.total_xp) : 0
  const xpPct = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100))
  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
    navigate('/login')
  }

  // Closes sidebar on mobile when a nav link is clicked
  function handleNavClick() {
    close()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-[220px] bg-peak-sidebar flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo + mobile close button */}
        <div className="px-4 py-5 border-b border-peak-sidebar-border flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-peak-accent rounded-md flex items-center justify-center shrink-0">
            <span className="text-black font-extrabold text-xs">P</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight flex-1">Peak Mode</span>
          <button
            onClick={close}
            className="lg:hidden text-peak-sidebar-text hover:text-white text-lg leading-none p-0.5"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <p className="text-[9px] font-semibold text-peak-sidebar-text uppercase tracking-widest px-2 mb-2">Main</p>

          {NAV_ITEMS_BEFORE.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={handleNavClick}
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

          {/* Arena parent + sub-links */}
          <div className="mb-0.5">
            <button
              onClick={() => { navigate('/arena/career'); close() }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5 text-sm font-medium transition-colors ${
                isArenaActive
                  ? 'bg-peak-sidebar-active text-white'
                  : 'text-peak-sidebar-text hover:text-white hover:bg-peak-sidebar-hover'
              }`}
            >
              <span className="text-base leading-none">◈</span>
              Arena
            </button>
            <div className="ml-4 border-l border-peak-sidebar-border pl-2 space-y-0.5">
              {ARENA_SLUGS.map(({ slug, label }) => (
                <NavLink
                  key={slug}
                  to={`/arena/${slug}`}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `block px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-peak-sidebar-active text-white'
                        : 'text-peak-sidebar-text hover:text-white hover:bg-peak-sidebar-hover'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {NAV_ITEMS_AFTER.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
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
    </>
  )
}
