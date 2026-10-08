import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../app/routes.js'

function NavigationItem({ to, label, icon: Icon, onNavigate, compact = false }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      end={to === ROUTES.DASHBOARD}
      className={({ isActive }) => [
        'group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-offset-2',
        isActive ? 'bg-brand/10 text-foreground' : 'text-muted hover:bg-surface-secondary hover:text-foreground',
        compact ? 'flex-col justify-center gap-1 px-1 py-2 text-[11px]' : '',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          {isActive && !compact && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand" aria-hidden="true" />}
          <Icon size={compact ? 19 : 19} strokeWidth={1.8} className={isActive ? 'shrink-0 text-brand' : 'shrink-0 text-muted group-hover:text-foreground'} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default NavigationItem
