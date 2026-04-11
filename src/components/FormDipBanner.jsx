export default function FormDipBanner({ count }) {
  if (!count || count <= 0) return null
  const hour = new Date().getHours()
  if (hour < 18) return null

  return (
    <div className="animate-form-dip border-l-4 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-medium px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ borderLeftColor: '#D97706' }}>
      <span aria-hidden="true">⚠️</span>
      <span>{count} high-priority {count === 1 ? 'task' : 'tasks'} remaining today</span>
    </div>
  )
}
