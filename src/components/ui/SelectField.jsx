import { ChevronDown } from 'lucide-react'

function SelectField({ id, label, children, controlClassName = '', className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <select
          id={id}
          className={`h-11 min-h-11 w-full appearance-none rounded-lg border border-outline bg-surface px-3.5 pr-10 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${controlClassName}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </div>
  )
}

export default SelectField