import Badge from './ui/Badge'

export default function TaskRow({ task, completionCount, isDone, onComplete, completing }) {
  const effectivePriority = task.priority_override ?? task.priority
  const isCounter = task.weekly_target > 1
  const canComplete = !isDone && !completing

  return (
    <div className={`flex items-center gap-3 py-2.5 px-1 border-b border-peak-border/50 last:border-0 ${isDone ? 'opacity-50' : ''}`}>
      {/* Checkbox or counter */}
      {isCounter ? (
        <button
          onClick={() => canComplete && onComplete(task)}
          disabled={!canComplete}
          aria-label={`${task.title} — ${completionCount} of ${task.weekly_target} complete`}
          className={`shrink-0 w-14 h-7 rounded-lg border text-[10px] font-black tracking-wider transition-colors
            ${isDone
              ? 'bg-peak-accent/20 border-peak-accent/40 text-peak-accent'
              : 'bg-peak-surface border-peak-border text-slate-400 hover:border-peak-accent/50'
            } disabled:cursor-not-allowed`}
        >
          {completionCount} / {task.weekly_target}
        </button>
      ) : (
        <button
          onClick={() => canComplete && onComplete(task)}
          disabled={!canComplete}
          aria-label={completing ? 'Completing...' : isDone ? `${task.title} — done` : `Complete: ${task.title}`}
          className={`shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center
            ${isDone
              ? 'bg-peak-accent border-peak-accent'
              : 'border-slate-600 hover:border-peak-accent'
            } disabled:cursor-not-allowed`}
        >
          {isDone && <span className="text-peak-bg text-[10px] font-black">✓</span>}
          {completing && !isDone && <div className="w-1.5 h-1.5 rounded-full bg-peak-accent animate-pulse" />}
        </button>
      )}

      {/* Title */}
      <span className={`text-sm flex-1 ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
        {task.title}
      </span>

      {/* Priority badge */}
      <Badge priority={effectivePriority} />
    </div>
  )
}
