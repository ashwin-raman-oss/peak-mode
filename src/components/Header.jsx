import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProgressBar from './ui/ProgressBar'
import { getXpInLevel, getXpToNextLevel } from '../lib/xp'

export default function Header({ profile }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const xpInLevel = profile ? getXpInLevel(profile.total_xp) : 0
  const xpToNext  = profile ? getXpToNextLevel(profile.total_xp) : 1000

  return (
    <header className="sticky top-0 z-40 bg-peak-bg/95 backdrop-blur border-b border-peak-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-sm font-black tracking-widest text-white uppercase shrink-0">
          PEAK <span className="text-peak-accent">MODE</span>
        </Link>

        {/* XP + level (center) */}
        {profile && (
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <span className="text-peak-accent text-xs font-black tracking-wider shrink-0">
              LVL {profile.level}
            </span>
            <div className="flex-1">
              <ProgressBar value={xpInLevel} max={1000} />
            </div>
            <span className="text-slate-500 text-[10px] shrink-0">
              {xpInLevel} / 1000
            </span>
          </div>
        )}

        {/* Streak + nav */}
        <div className="flex items-center gap-3 shrink-0">
          {profile && profile.current_streak > 0 && (
            <span className="bg-peak-accent-dim border border-peak-accent/30 text-peak-accent text-[10px] font-black tracking-wider px-2 py-1 rounded">
              🔥 {profile.current_streak}
            </span>
          )}
          <Link to="/report" className="text-slate-500 hover:text-white text-xs transition-colors">
            Report
          </Link>
          <button onClick={handleLogout} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
            Out
          </button>
        </div>
      </div>
    </header>
  )
}
