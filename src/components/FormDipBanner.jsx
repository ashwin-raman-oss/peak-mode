export default function FormDipBanner({ count }) {
  if (!count || count <= 0) return null
  const hour = new Date().getHours()
  if (hour < 18) return null

  return (
    <div className="animate-form-dip bg-[#1E1A10] border border-[#3A2E10] text-[#8A7040] text-xs font-medium px-4 py-2.5 rounded-lg flex items-center gap-2">
      <span aria-hidden="true" className="text-[#C9A84C]">—</span>
      <span>{count} high-priority {count === 1 ? 'task' : 'tasks'} remaining today</span>
    </div>
  )
}
