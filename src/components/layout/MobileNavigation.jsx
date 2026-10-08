import { BarChart3, CalendarDays, ClipboardCheck, ClipboardList, LayoutDashboard, MoreHorizontal, Package, PlusCircle, Settings, Sparkles, UserCog, Users, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ADMIN_NAVIGATION, EMPLOYEE_NAVIGATION, ROUTES } from '../../app/routes.js'
import { useAuth } from '../../features/auth/useAuth.js'

const ICONS = { LayoutDashboard, CalendarDays, Users, Sparkles, ClipboardList, Package, WalletCards, BarChart3, UserCog, Settings, PlusCircle, ClipboardCheck }

function MobileNavigation() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { user } = useAuth()
  const navigation = user?.role === 'employee' ? EMPLOYEE_NAVIGATION : ADMIN_NAVIGATION
  const primaryRoutes = [ROUTES.DASHBOARD, ROUTES.AGENDA, ROUTES.CLIENTS, ROUTES.ORDERS]
  const primaryItems = primaryRoutes.map((route) => navigation.find((item) => item.to === route)).filter(Boolean)
  const extraItems = navigation.filter((item) => !primaryRoutes.includes(item.to))

  return (
    <>
      {moreOpen && <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 rounded-xl border border-outline bg-surface p-2 shadow-xl lg:hidden" aria-label="Más secciones">
        {extraItems.map(({ label, to, icon }) => {
          const Icon = ICONS[icon]
          return <NavLink key={label} to={to} onClick={() => setMoreOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${isActive ? 'bg-brand/10 text-foreground' : 'text-muted hover:bg-surface-secondary hover:text-foreground'}`}><Icon size={18} aria-hidden="true" /><span>{label}</span></NavLink>
        })}
        {extraItems.length === 0 && <p className="px-3 py-2 text-sm text-muted">No hay más secciones.</p>}
      </div>}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-outline bg-surface px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 lg:hidden" aria-label="Navegación móvil">
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {primaryItems.map(({ label, to, icon }) => {
            const Icon = ICONS[icon]
            return <li key={label}><NavLink to={to} end={to === ROUTES.DASHBOARD} className={({ isActive }) => `flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium ${isActive ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-secondary hover:text-foreground'}`}><Icon size={19} aria-hidden="true" /><span>{label === 'Nueva orden' ? 'Orden' : label}</span></NavLink></li>
          })}
          <li><button type="button" onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen} aria-label={moreOpen ? 'Cerrar más secciones' : 'Mostrar más secciones'} className={`flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium ${moreOpen ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-secondary hover:text-foreground'}`}><MoreHorizontal size={19} aria-hidden="true" /><span>Más</span></button></li>
        </ul>
      </nav>
    </>
  )
}

export default MobileNavigation
