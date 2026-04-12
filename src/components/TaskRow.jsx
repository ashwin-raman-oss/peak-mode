import Badge from './ui/Badge'

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export default function TaskRow({ task, completionCount, isDone, onComplete, onToggle, completing, onEdit, onDelete, readOnly }) {
  const effectivePriority = task.priority_override ?? task.priority
  const isCounter = task.weekly_target > 1

  // Toggle mode: button is always clickable (undo or complete)
  // Normal mode: only clickable when not done
  const canInteract = !completing && !readOnly
  const canComplete = onToggle ? canInteract : (canInteract && !isDone)

  function handleCircleClick() {
    if (!canInteract) return
    if (onToggle) { onToggle(task); return }
    if (canComplete) onComplete(task)
  }

  return (
    <div className={`group flex items-center gap-3 py-2.5 px-1 border-b border-peak-border/50 last:border-0 ${isDone && !onToggle ? 'opacity-50' : ''}`}>
      {/* Checkbox or counter */}
      {isCounter ? (
        <button
          onClick={handleCircleClick}
          disabled={!canComplete}
          title={readOnly ? "Weekly tasks can't be edited by day" : undefined}
          aria-label={`${task.title} — ${completionCount} of ${task.weekly_target} complete`}
          className={`shrink-0 w-14 h-7 rounded-lg border text-[10px] font-black tracking-wider transition-colors
            ${isDone
              ? 'bg-peak-accent-light border-peak-accent text-peak-accent'
              : 'bg-peak-elevated border-peak-border text-peak-muted hover:border-peak-accent'
            } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {completionCount} / {task.weekly_target}
        </button>
      ) : (
        <button
          onClick={handleCircleClick}
          disabled={!canComplete && !onToggle}
          title={readOnly ? "Weekly tasks can't be edited by day" : undefined}
          aria-label={completing ? 'Completing...' : isDone ? `${task.title} — done` : `Complete: ${task.title}`}
          className={`shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center
            ${isDone
              ? 'bg-peak-success border-peak-success'
              : 'border-peak-border hover:border-peak-accent'
            } ${readOnly ? 'opacity-40 cursor-not-allowed' : ''} ${onToggle && isDone ? 'cursor-pointer' : ''}`}
        >
          {isDone && <span className="text-white text-[10px] font-black">✓</span>}
          {completing && !isDone && <div className="w-1.5 h-1.5 rounded-full bg-peak-accent animate-pulse" />}
        </button>
      )}

      {/* Title */}
      <span className={`text-sm flex-1 ${isDone && !onToggle ? 'line-through text-peak-muted' : isDone && onToggle ? 'text-peak-muted' : 'text-peak-primary'}`}>
        {task.title}
      </span>

      {/* Priority badge */}
      <Badge priority={effectivePriority} />

      {/* Action buttons — always visible on mobile, hover-only on desktop */}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              aria-label={`Edit: ${task.title}`}
              className="p-1.5 text-peak-muted hover:text-peak-accent transition-colors rounded"
            >
              <PencilIcon />
            </button>
          )}
          {onDelete && task.task_type !== 'recurring' && (
            <button
              onClick={() => onDelete(task)}
              aria-label={`Delete: ${task.title}`}
              className="p-1.5 text-peak-muted hover:text-[#DC2626] transition-colors rounded"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
