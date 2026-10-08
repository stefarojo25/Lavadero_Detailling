export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  AGENDA: '/agenda',
  CLIENTS: '/clients',
  SERVICES: '/services',
  ORDERS: '/orders',
  INVENTORY: '/inventory',
  CASH: '/cash',
  REPORTS: '/reports',
  EMPLOYEES: '/employees',
  SETTINGS: '/settings',
  PUBLIC_VEHICLE: '/consulta',
}

export const ADMIN_NAVIGATION = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'Agenda', to: ROUTES.AGENDA, icon: 'CalendarDays' },
  { label: 'Clientes', to: ROUTES.CLIENTS, icon: 'Users' },
  { label: 'Servicios', to: ROUTES.SERVICES, icon: 'Sparkles' },
  { label: 'Órdenes', to: ROUTES.ORDERS, icon: 'ClipboardList' },
  { label: 'Inventario', to: ROUTES.INVENTORY, icon: 'Package' },
  { label: 'Caja', to: ROUTES.CASH, icon: 'WalletCards' },
  { label: 'Reportes', to: ROUTES.REPORTS, icon: 'BarChart3' },
  { label: 'Empleados', to: ROUTES.EMPLOYEES, icon: 'UserCog' },
  { label: 'Configuración', to: ROUTES.SETTINGS, icon: 'Settings' },
]

export const EMPLOYEE_NAVIGATION = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'Agenda', to: ROUTES.AGENDA, icon: 'CalendarDays' },
  { label: 'Clientes', to: ROUTES.CLIENTS, icon: 'Users' },
  { label: 'Mis órdenes', to: ROUTES.ORDERS, icon: 'ClipboardList' },
  { label: 'Mis servicios', to: ROUTES.SERVICES, icon: 'ClipboardCheck' },
]

export const ROUTE_TITLES = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.AGENDA]: 'Agenda',
  [ROUTES.CLIENTS]: 'Clientes',
  [ROUTES.SERVICES]: 'Servicios',
  [ROUTES.ORDERS]: 'Órdenes',
  [ROUTES.INVENTORY]: 'Inventario',
  [ROUTES.CASH]: 'Caja',
  [ROUTES.REPORTS]: 'Reportes',
  [ROUTES.EMPLOYEES]: 'Empleados',
  [ROUTES.SETTINGS]: 'Configuración',
}
