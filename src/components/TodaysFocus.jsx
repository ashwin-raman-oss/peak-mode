const PRIORITY_DOT = {
  high:     'bg-peak-accent',
  medium:   'bg-peak-xp',
  optional: 'bg-peak-muted',
}

export default function TodaysFocus({ tasks = [], onComplete, completing }) {
  const today = new Date()
  const dayOfWeek = today.getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  const cardClass = 'rounded-xl px-5 py-4 border-l-[3px]'
  const cardStyle = { borderLeftColor: '#2D5BE3', backgroundColor: '#F0F4FF', border: 'none', borderLeft: '3px solid #2D5BE3' }

  if (isWeekend) {
    return (
      <section className={cardClass} style={cardStyle}>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#2D5BE3' }}>Today's Focus</p>
        <p className="text-peak-text text-sm">Rest day. Back Monday.</p>
      </section>
    )
  }

  if (tasks.length === 0) {
    return (
      <section className={cardClass} style={cardStyle}>
        <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#2D5BE3' }}>Today's Focus</p>
        <p className="text-peak-text text-sm">All priority tasks done.</p>
      </section>
    )
  }

  return (
    <section className={cardClass} style={cardStyle}>
      <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: '#2D5BE3' }}>Today's Focus</p>
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
