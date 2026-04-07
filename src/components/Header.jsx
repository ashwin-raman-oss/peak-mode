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
    <header className="sticky top-0 z-40 bg-peak-bg/98 backdrop-blur border-b border-peak-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-sm font-black tracking-tight text-peak-accent uppercase shrink-0">
          PEAK MODE
        </Link>

        {/* Level + streak */}
        <div className="flex items-center gap-3 shrink-0">
          {profile && (
            <span className="text-peak-xp text-xs font-bold tracking-wider">
              LVL {profile.level}
            </span>
          )}
          {profile && profile.current_streak > 0 && (
            <span className="text-peak-muted text-[10px] tracking-wider">
              {profile.current_streak} day streak
            </span>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/report" className="text-peak-muted hover:text-peak-text text-xs transition-colors tracking-wide">
            Report
          </Link>
          <button onClick={handleLogout} aria-label="Log out" className="text-peak-muted hover:text-peak-text text-xs transition-colors tracking-wide">
            Sign out
          </button>
        </div>
      </div>

      {/* XP progress line — ultra-thin, sits flush under the header bar */}
      {profile && (
        <div className="h-px bg-peak-border">
          <div
            className="h-full bg-peak-accent/40 transition-all duration-700"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      )}
    </header>
  )
}
