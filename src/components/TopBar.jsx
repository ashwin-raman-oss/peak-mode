// src/components/TopBar.jsx
export default function TopBar({ title, subtitle, action }) {
  return (
    <div className="h-14 bg-white border-b border-peak-border flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-sm font-bold text-peak-text leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-peak-muted">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
