export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'
  const variants = {
    primary: 'bg-peak-accent text-white hover:bg-amber-500',
    ghost:   'bg-white text-peak-text border border-peak-border hover:bg-peak-bg',
    danger:  'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEE2E2]',
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-xs px-4 py-2.5',
    lg: 'text-sm px-6 py-3.5',
  }
  return (
    <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
