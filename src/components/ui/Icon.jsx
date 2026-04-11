const icons = {
  career: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="16" height="11" rx="2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="12" x2="10" y2="12.01" strokeWidth="2" />
    </svg>
  ),
  health: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,10 5,10 7,4 9,16 11,8 13,12 15,10 18,10" />
    </svg>
  ),
  learning: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H18v13H4.5A2.5 2.5 0 0 1 2 12.5V4.5z" />
      <path d="M2 15.5A2.5 2.5 0 0 0 4.5 18H18v-3" />
      <line x1="7" y1="7" x2="13" y2="7" />
      <line x1="7" y1="10" x2="11" y2="10" />
    </svg>
  ),
  misc: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  ),
  streak: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2c0 4-3 5-3 8a3 3 0 0 0 6 0c0-1-.5-2-1-3" />
      <path d="M9 14c-2 0-4-1.5-4-4 0-2 1-3.5 2-5 .5 1.5 1.5 2 2 3" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.29 3.29a2 2 0 0 1 3.42 0l6.29 10.87A2 2 0 0 1 16.29 17H3.71a2 2 0 0 1-1.71-2.84L8.29 3.29z" />
      <line x1="10" y1="9" x2="10" y2="12" />
      <circle cx="10" cy="14.5" r="0.5" fill="currentColor" />
    </svg>
  ),
}

export default function Icon({ name, className = 'w-5 h-5' }) {
  const svg = icons[name]
  if (!svg) return null
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {svg}
    </span>
  )
}
