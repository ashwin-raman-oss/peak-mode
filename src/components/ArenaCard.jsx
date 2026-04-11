import { useNavigate } from 'react-router-dom'
import ProgressBar from './ui/ProgressBar'

const ARENA_ACCENT = {
  career:   '#2D5BE3',
  health:   '#059669',
  learning: '#7C3AED',
  misc:     '#D97706',
}

export default function ArenaCard({ arena, stats }) {
  const navigate = useNavigate()
  const { completed, total, xpEarned } = stats
  const accentColor = ARENA_ACCENT[arena.slug] ?? '#2D5BE3'

  return (
    <button
      onClick={() => navigate(`/arena/${arena.slug}`)}
      aria-label={`${arena.name} — ${completed} of ${total} tasks complete, ${xpEarned} XP this week`}
      className="bg-peak-surface border border-peak-border rounded-xl p-4 text-left w-full group transition-all duration-200 hover:-translate-y-px"
      style={{
        borderTopColor: accentColor,
        borderTopWidth: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{arena.emoji}</span>
          <span className="text-sm font-bold text-peak-primary tracking-tight">
            {arena.name}
          </span>
        </div>
        <span className="text-[10px] text-peak-muted font-medium tabular-nums">
          {completed}/{total}
        </span>
      </div>
      <ProgressBar value={completed} max={Math.max(total, 1)} className="mb-3" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-peak-muted">This week</span>
        <span className="text-[10px] font-bold text-peak-xp tabular-nums">{xpEarned} XP</span>
      </div>
    </button>
  )
}
