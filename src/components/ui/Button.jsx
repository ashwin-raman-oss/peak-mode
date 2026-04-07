export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'font-bold tracking-wider uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'
  const variants = {
    primary: 'bg-peak-accent text-peak-bg hover:bg-peak-primary',
    ghost: 'text-peak-muted hover:text-peak-primary border border-peak-border hover:border-peak-text',
    danger: 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50',
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
