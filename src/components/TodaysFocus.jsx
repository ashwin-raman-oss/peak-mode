const PRIORITY_DOT = {
  high:     'bg-peak-accent',
  medium:   'bg-peak-xp',
  optional: 'bg-peak-muted',
}

const cardClass = 'rounded-xl px-5 py-4'
const cardStyle = { borderLeft: '3px solid #2D5BE3', backgroundColor: '#F0F4FF' }
const labelStyle = { color: '#2D5BE3' }

export default function TodaysFocus({ tasks = [], onComplete, completing, weekSummary }) {
  const today = new Date()
  const dayOfWeek = today.getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) {
    return (
      <section className={cardClass} style={cardStyle}>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={labelStyle}>Week in Review</p>
        {weekSummary ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] font-bold tracking-widest uppercase text-peak-muted mb-0.5">Tasks</p>
              <p className="text-lg font-extrabold text-peak-primary tabular-nums leading-tight">
                {weekSummary.completed}<span className="text-peak-muted font-normal text-xs">/{weekSummary.total}</span>
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-widest uppercase text-peak-muted mb-0.5">XP Earned</p>
              <p className="text-lg font-extrabold text-peak-xp tabular-nums leading-tight">{weekSummary.weekXp}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-widest uppercase text-peak-muted mb-0.5">Best Arena</p>
              <p className="text-sm font-bold text-peak-primary leading-tight truncate">{weekSummary.bestArena}</p>
            </div>
          </div>
        ) : (
          <p className="text-peak-text text-sm">Rest day. Back Monday.</p>
        )}
      </section>
    )
  }

  if (tasks.length === 0) {
    return (
      <section className={cardClass} style={cardStyle}>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={labelStyle}>Today's Focus</p>
        <p className="text-peak-text text-sm">All priority tasks done.</p>
      </section>
    )
  }

  return (
    <section className={cardClass} style={cardStyle}>
      <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={labelStyle}>Today's Focus</p>
      <div className="space-y-0">
        {tasks.map(task => {
          const priority = task.priority_override ?? task.priority
          const dotClass = PRIORITY_DOT[priority] ?? PRIORITY_DOT.optional
          return (
            <div key={task.id} className="flex items-center gap-3 py-3 border-b border-black/[0.06] last:border-0">
              <button
                onClick={() => onComplete?.(task)}
                disabled={completing === task.id}
                aria-label={completing === task.id ? 'Completing...' : `Complete: ${task.title}`}
                className="shrink-0 w-[22px] h-[22px] rounded-full border-2 border-peak-border hover:border-peak-accent bg-white transition-colors flex items-center justify-center disabled:opacity-40"
              >
                {completing === task.id && (
                  <div className="w-2 h-2 rounded-full bg-peak-accent animate-pulse" />
                )}
              </button>
              <span className="text-peak-primary flex-1 font-medium" style={{ fontSize: 16 }}>
                {task.title}
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} aria-label={priority} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
