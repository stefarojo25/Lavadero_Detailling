const VARIANTS = {
  primary: 'bg-brand text-white shadow-[0_8px_24px_rgba(0,140,255,0.2)] hover:bg-brand-hover',
  secondary: 'border border-outline bg-surface-secondary text-foreground hover:border-brand/50 hover:bg-surface',
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant] ?? VARIANTS.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button