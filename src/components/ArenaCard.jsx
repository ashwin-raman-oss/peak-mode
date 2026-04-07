import { useNavigate } from 'react-router-dom'
import ProgressBar from './ui/ProgressBar'

const ARENA_ACCENT = {
  career:   '#E8E0D0',   // warm white
  health:   '#4A7A5A',   // soft green
  learning: '#5A4A7A',   // soft purple
  misc:     '#444444',   // slate
}

export default function ArenaCard({ arena, stats }) {
  const navigate = useNavigate()
  const { completed, total, xpEarned } = stats
  const accentColor = ARENA_ACCENT[arena.slug] ?? '#444444'

  return (
    <button
      onClick={() => navigate(`/arena/${arena.slug}`)}
      aria-label={`${arena.name} — ${completed} of ${total} tasks complete, ${xpEarned} XP this week`}
      className="card-premium bg-peak-surface border border-peak-border rounded-xl p-4 text-left transition-colors group w-full hover:bg-peak-elevated"
      style={{ borderTopColor: accentColor }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{arena.emoji}</span>
          <span className="text-sm font-semibold text-peak-primary group-hover:text-peak-accent transition-colors tracking-tight">
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
