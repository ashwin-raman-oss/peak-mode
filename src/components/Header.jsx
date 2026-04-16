import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getXpInLevel } from '../lib/xp'
import Icon from './ui/Icon'

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
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-sm font-extrabold text-peak-primary uppercase shrink-0"
          style={{ letterSpacing: '-0.02em', fontWeight: 800 }}
        >
          PEAK MODE
        </Link>

        {/* Right: level, streak, nav */}
        <div className="flex items-center gap-4 shrink-0">
          {profile && (
            <span className="text-[11px] font-bold tracking-wide text-peak-accent border border-peak-accent rounded-full px-2.5 py-0.5">
              LVL {profile.level}
            </span>
          )}
          {profile && profile.current_streak > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-peak-primary">
              <Icon name="streak" className="w-3.5 h-3.5 text-peak-xp" />
              {profile.current_streak}d
            </span>
          )}
          <Link to="/month" className="text-peak-text hover:text-peak-accent text-xs font-medium transition-colors">
            Month
          </Link>
          <Link to="/habits" className="text-peak-text hover:text-peak-accent text-xs font-medium transition-colors">
            Habits
          </Link>
          <Link to="/report" className="text-peak-text hover:text-peak-accent text-xs font-medium transition-colors">
            Report
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="text-peak-muted hover:text-peak-text text-xs font-medium transition-colors"
          >
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
