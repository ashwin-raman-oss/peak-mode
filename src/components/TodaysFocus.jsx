import Badge from './ui/Badge'

export default function TodaysFocus({ tasks, onComplete, completing }) {
  const today = new Date()
  const dayOfWeek = today.getUTCDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) {
    return (
      <section className="bg-peak-surface border border-peak-border rounded-xl p-4">
        <p className="text-xs font-black tracking-widest uppercase text-peak-accent mb-1">Today's Focus</p>
        <p className="text-slate-500 text-sm">Rest day. Back Monday.</p>
      </section>
    )
  }

  if (tasks.length === 0) {
    return (
      <section className="bg-peak-surface border border-peak-border rounded-xl p-4">
        <p className="text-xs font-black tracking-widest uppercase text-peak-accent mb-1">Today's Focus</p>
        <p className="text-slate-500 text-sm">All high-priority tasks done. Peak form.</p>
      </section>
    )
  }

  return (
    <section className="bg-peak-surface border-l-2 border-l-peak-accent border border-peak-border rounded-xl p-4">
      <p className="text-xs font-black tracking-widest uppercase text-peak-accent mb-3">Today's Focus</p>
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-3 group"
          >
            <button
              onClick={() => onComplete(task)}
              disabled={completing === task.id}
              className="w-5 h-5 rounded-full border-2 border-slate-600 hover:border-peak-accent transition-colors shrink-0 flex items-center justify-center disabled:opacity-50"
            >
              {completing === task.id && (
                <div className="w-2 h-2 rounded-full bg-peak-accent animate-pulse" />
              )}
            </button>
            <span className="text-sm text-slate-200 flex-1">{task.title}</span>
            <Badge priority={task.priority_override ?? task.priority} />
          </div>
        ))}
      </div>
    </section>
  )
}
