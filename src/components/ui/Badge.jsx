export default function Badge({ priority }) {
  const config = {
    high:     { label: 'HIGH',     bg: 'bg-[#3D1515]', text: 'text-[#CC7777]', border: 'border-[#5A2020]' },
    medium:   { label: 'MED',      bg: 'bg-[#2D2010]', text: 'text-[#C9A84C]', border: 'border-[#4A3518]' },
    optional: { label: 'OPT',      bg: 'bg-[#141C1C]', text: 'text-[#5A8A8A]', border: 'border-[#1E2E2E]' },
  }
  const { label, bg, text, border } = config[priority] ?? config.optional
  return (
    <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${bg} ${text} ${border}`}>
      {label}
    </span>
  )
}
