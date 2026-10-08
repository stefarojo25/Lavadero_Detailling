function TextField({ id, label, error, hint, icon, endAdornment, inputClassName = '', className = '', ...props }) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          className={`h-11 min-h-11 w-full rounded-lg border bg-surface py-2 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20 ${icon ? 'pl-10' : 'pl-3.5'} ${endAdornment ? 'pr-12' : 'pr-3.5'} ${error ? 'border-red-400/70' : 'border-outline'} ${inputClassName}`}
          {...props}
        />
        {endAdornment && <span className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</span>}
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs text-red-300">{error}</p>}
      {!error && hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export default TextField