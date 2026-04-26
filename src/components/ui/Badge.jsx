export default function Badge({ priority }) {
  const config = {
    high:     { label: 'HIGH', className: 'bg-peak-accent text-white' },
    medium:   { label: 'MED',  className: 'bg-[#2563EB] text-white' },
    optional: { label: 'OPT',  className: 'bg-[#6B7280] text-white' },
  }
  const { label, className } = config[priority] ?? config.optional
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
