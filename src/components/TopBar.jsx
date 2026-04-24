// src/components/TopBar.jsx
import { useSidebar } from '../context/SidebarContext'

export default function TopBar({ title, subtitle, action }) {
  const sidebar = useSidebar()

  return (
    <div className="h-14 bg-white border-b border-peak-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        {sidebar && (
          <button
            onClick={sidebar.open}
            className="lg:hidden p-1.5 rounded-md hover:bg-peak-bg text-peak-text shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-peak-text leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-peak-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  )
}
