import { useNavigate } from 'react-router-dom'
import ProgressBar from './ui/ProgressBar'

export default function ArenaCard({ arena, stats }) {
  const navigate = useNavigate()
  const { completed, total, xpEarned } = stats

  return (
    <button
      onClick={() => navigate(`/arena/${arena.slug}`)}
      className="bg-peak-surface border border-peak-border rounded-xl p-4 text-left hover:border-peak-accent/50 transition-colors group w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{arena.emoji}</span>
          <span className="text-sm font-bold text-white group-hover:text-peak-accent transition-colors">
            {arena.name}
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          {completed}/{total}
        </span>
      </div>
      <ProgressBar value={completed} max={Math.max(total, 1)} className="mb-2" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-600">This week</span>
        <span className="text-[10px] font-bold text-peak-accent">{xpEarned} XP</span>
      </div>
    </button>
  )
}
