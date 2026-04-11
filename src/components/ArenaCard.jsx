import { useNavigate } from 'react-router-dom'
import ProgressBar from './ui/ProgressBar'
import Icon from './ui/Icon'

const ARENA_CONFIG = {
  career:   { icon: 'career',   accentColor: '#2D5BE3' },
  health:   { icon: 'health',   accentColor: '#059669' },
  learning: { icon: 'learning', accentColor: '#7C3AED' },
  misc:     { icon: 'misc',     accentColor: '#D97706' },
}

export default function ArenaCard({ arena, stats, tasks = [], isTaskDone }) {
  const navigate = useNavigate()
  const { completed, total, xpEarned } = stats
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const config = ARENA_CONFIG[arena.slug] ?? ARENA_CONFIG.misc

  const nextTask = tasks.find(t => !isTaskDone?.(t))
  const allDone = total > 0 && completed >= total

  return (
    <button
      onClick={() => navigate(`/arena/${arena.slug}`)}
      aria-label={`${arena.name} — ${completed} of ${total} tasks complete, ${xpEarned} XP this week`}
      className="bg-peak-surface border border-peak-border rounded-xl p-5 text-left w-full group transition-all duration-200 hover:-translate-y-px border-l-4"
      style={{
        borderLeftColor: config.accentColor,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name={config.icon} className="w-4 h-4" style={{ color: config.accentColor }} />
          <span className="font-bold text-peak-primary" style={{ fontSize: 15 }}>
            {arena.name}
          </span>
        </div>
        <span className="tabular-nums text-sm">
          <span className="font-bold text-peak-primary">{completed}</span>
          <span className="text-peak-muted font-normal">/{total}</span>
        </span>
      </div>
      <ProgressBar value={completed} max={Math.max(total, 1)} className="mb-2.5" />

      {/* Next task preview */}
      <div className="mb-3 min-h-[16px]">
        {allDone ? (
          <p className="text-xs font-medium text-peak-success">✓ All complete</p>
        ) : nextTask ? (
          <p className="text-xs text-peak-muted italic truncate">Next: {nextTask.title}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-peak-xp tabular-nums">{xpEarned} XP this week</span>
        <span className="text-[11px] font-semibold text-peak-muted tabular-nums">{pct}% done</span>
      </div>
    </button>
  )
}
