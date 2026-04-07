import Badge from './ui/Badge'

export default function TodaysFocus({ tasks = [], onComplete, completing }) {
  const today = new Date()
  const dayOfWeek = today.getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) {
    return (
      <section className="card-premium bg-peak-surface border border-peak-border rounded-xl px-5 py-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mb-1">Today's Focus</p>
        <p className="text-peak-text text-sm">Rest day. Back Monday.</p>
      </section>
    )
  }

  if (tasks.length === 0) {
    return (
      <section className="card-premium bg-peak-surface border border-peak-border rounded-xl px-5 py-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mb-1">Today's Focus</p>
        <p className="text-peak-text text-sm">All priority tasks done.</p>
      </section>
    )
  }

  return (
    <section className="card-premium bg-peak-surface border border-peak-border border-l-2 rounded-xl px-5 py-4"
      style={{ borderLeftColor: '#E8E0D0' }}>
      <p className="text-[10px] font-bold tracking-widest uppercase text-peak-muted mb-4">Today's Focus</p>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-4">
            <button
              onClick={() => onComplete?.(task)}
              disabled={completing === task.id}
              aria-label={completing === task.id ? 'Completing...' : `Complete: ${task.title}`}
              className={`shrink-0 w-4 h-4 rounded-full border transition-colors flex items-center justify-center disabled:opacity-40
                border-peak-border hover:border-peak-accent`}
            >
              {completing === task.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-peak-accent animate-pulse" />
              )}
            </button>
            <span className="text-sm text-peak-primary flex-1 tracking-tight">{task.title}</span>
            <Badge priority={task.priority_override ?? task.priority} />
          </div>
        ))}
      </div>
    </section>
  )
}
