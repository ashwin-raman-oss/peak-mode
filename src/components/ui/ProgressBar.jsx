export default function ProgressBar({ value, max, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-[4px] bg-peak-border rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-peak-accent rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
