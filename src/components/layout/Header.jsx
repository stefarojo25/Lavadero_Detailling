import { LogOut, Menu, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES, ROUTE_TITLES } from '../../app/routes.js'
import { useAuth } from '../../features/auth/useAuth.js'

function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const roleLabel = user?.role === 'employee' ? 'Empleado' : 'Administrador'
  const title = pathname === ROUTES.INVENTORY && user?.role === 'employee' ? 'Vehículos' : ROUTE_TITLES[pathname] ?? 'Dashboard'

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-outline bg-canvas px-4 sm:h-18 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="grid size-10 shrink-0 place-items-center rounded-lg border border-outline bg-surface text-muted hover:text-foreground lg:hidden" aria-label="Abrir navegación"><Menu size={20} /></button>
        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden max-w-44 text-right sm:block"><p className="truncate text-sm font-medium leading-5 text-foreground">{user?.name ?? 'Usuario Demo'}</p><p className="text-xs leading-4 text-muted">{roleLabel}</p></div>
        <span className="grid size-9 place-items-center rounded-full border border-outline bg-surface text-muted sm:size-10" aria-hidden="true"><UserRound size={18} /></span>
        <button type="button" onClick={handleLogout} className="grid size-9 place-items-center rounded-lg border border-outline bg-surface text-muted transition hover:border-red-400/50 hover:text-red-300 sm:size-10" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={17} /></button>
      </div>
    </header>
  )
}

export default Header
