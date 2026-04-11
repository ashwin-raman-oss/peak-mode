import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getXpInLevel } from '../lib/xp'

export default function Header({ profile }) {
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
    navigate('/login')
  }

  const xpInLevel = profile ? getXpInLevel(profile.total_xp) : 0
  const xpPct = Math.min(100, Math.round((xpInLevel / 1000) * 100))

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-peak-border shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-sm font-black tracking-tight text-peak-accent uppercase shrink-0">
          PEAK MODE
        </Link>

        {/* Level + streak */}
        <div className="flex items-center gap-3 shrink-0">
          {profile && (
            <span className="bg-peak-accent text-white text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">
              LVL {profile.level}
            </span>
          )}
          {profile && profile.current_streak > 0 && (
            <span className="text-peak-primary text-[10px] font-medium tracking-wide">
              🔥 {profile.current_streak} day streak
            </span>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/report" className="text-peak-text hover:text-peak-accent text-xs transition-colors tracking-wide">
            Report
          </Link>
          <button onClick={handleLogout} aria-label="Log out" className="text-peak-muted hover:text-peak-text text-xs transition-colors tracking-wide">
            Sign out
          </button>
        </div>
      </div>

      {/* XP progress line */}
      {profile && (
        <div className="h-[2px] bg-peak-border">
          <div
            className="h-full bg-peak-accent transition-all duration-700"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      )}
    </header>
  )
}
