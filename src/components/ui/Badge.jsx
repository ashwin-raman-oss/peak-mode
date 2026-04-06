export default function Badge({ priority }) {
  const config = {
    high:     { label: '🔴 HIGH',     bg: 'bg-red-950/60',    text: 'text-red-400',    border: 'border-red-900/50' },
    medium:   { label: '🟡 MED',      bg: 'bg-yellow-950/60', text: 'text-yellow-400', border: 'border-yellow-900/50' },
    optional: { label: '🟢 OPT',      bg: 'bg-green-950/60',  text: 'text-green-400',  border: 'border-green-900/50' },
  }
  const { label, bg, text, border } = config[priority] ?? config.optional
  return (
    <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border ${bg} ${text} ${border}`}>
      {label}
    </span>
  )
}
