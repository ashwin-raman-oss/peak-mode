export default function FormDipBanner({ count }) {
  if (count <= 0) return null
  const hour = new Date().getHours()
  if (hour < 18) return null // only show after 6pm

  return (
    <div className="animate-form-dip bg-amber-950/40 border border-amber-900/50 text-amber-400 text-xs font-medium px-4 py-2.5 rounded-lg flex items-center gap-2">
      <span>⚠️</span>
      <span>Form dip — {count} High {count === 1 ? 'task' : 'tasks'} remaining today</span>
    </div>
  )
}
