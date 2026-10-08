import { BarChart3, CalendarDays, ClipboardCheck, ClipboardList, LayoutDashboard, Package, PlusCircle, Settings, Sparkles, UserCog, Users, WalletCards, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ADMIN_NAVIGATION, EMPLOYEE_NAVIGATION, ROUTES } from '../../app/routes.js'
import { useAuth } from '../../features/auth/useAuth.js'
import NavigationItem from './NavigationItem.jsx'

const ICONS = { LayoutDashboard, CalendarDays, Users, Sparkles, ClipboardList, Package, WalletCards, BarChart3, UserCog, Settings, PlusCircle, ClipboardCheck }

function Sidebar({ onNavigate, mobile = false, onClose }) {
  const { user } = useAuth()
  const isEmployee = user?.role === 'employee'
  const navigation = isEmployee ? EMPLOYEE_NAVIGATION : ADMIN_NAVIGATION

  return (
    <aside className={`flex h-full w-64 shrink-0 flex-col border-r border-outline bg-surface ${mobile ? 'w-[min(20rem,85vw)] shadow-2xl' : ''}`} aria-label="Navegación principal">
      <div className="flex h-18 shrink-0 items-center justify-between border-b border-outline px-5">
        <Link to={ROUTES.DASHBOARD} onClick={onNavigate} className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-offset-4" aria-label="Lavadero Detailing, ir al dashboard">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10" aria-hidden="true"><span className="size-3 rounded-full bg-brand shadow-[0_0_16px_var(--app-accent)]" /></span>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold tracking-wide text-foreground">Lavadero</span><span className="block truncate text-xs text-muted">Detailing</span></span>
        </Link>
        {mobile && <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground" aria-label="Cerrar navegación"><X size={20} /></button>}
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label={isEmployee ? 'Menú de empleado' : 'Menú de administrador'}>
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Espacio de trabajo</p>
        <ul className="space-y-1">{navigation.map(({ label, to, icon }) => { const Icon = ICONS[icon]; return <li key={`${to}-${label}`}><NavigationItem to={to} label={label} icon={Icon} onNavigate={onNavigate} /></li> })}</ul>
      </nav>
      <div className="shrink-0 border-t border-outline p-4"><div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3"><span className="grid size-9 shrink-0 place-items-center rounded-full border border-outline bg-surface text-muted" aria-hidden="true"><Users size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{user?.name ?? 'Usuario Demo'}</span><span className="block truncate text-xs text-muted">{isEmployee ? 'Empleado' : 'Administrador'}</span></span></div></div>
    </aside>
  )
}

export default Sidebar
