import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import AgendaPage from '../pages/Agenda/index.jsx'
import CashPage from '../pages/Cash/index.jsx'
import ClientsPage from '../pages/Clients/index.jsx'
import DashboardPage from '../pages/Dashboard/index.jsx'
import EmployeesPage from '../pages/Employees/index.jsx'
import InventoryPage from '../pages/Inventory/index.jsx'
import LoginPage from '../pages/Login/index.jsx'
import OrdersPage from '../pages/Orders/index.jsx'
import PublicVehiclePage from '../pages/PublicVehicle/index.jsx'
import ReportsPage from '../pages/Reports/index.jsx'
import ServicesPage from '../pages/Services/index.jsx'
import SettingsPage from '../pages/Settings/index.jsx'
import { ROUTES } from './routes.js'

function AppRouter() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <AuthLayout />}>
        <Route index element={<LoginPage />} />
      </Route>
      <Route element={user ? <DashboardLayout /> : <Navigate to={ROUTES.LOGIN} replace />}>
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.AGENDA} element={<AgendaPage />} />
        <Route path={ROUTES.CLIENTS} element={<ClientsPage />} />
        <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
        <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
        <Route element={isAdmin ? <Outlet /> : <Navigate to={ROUTES.DASHBOARD} replace />}>
          <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
          <Route path={ROUTES.CASH} element={<CashPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.EMPLOYEES} element={<EmployeesPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path={ROUTES.PUBLIC_VEHICLE} element={<PublicLayout />}><Route index element={<PublicVehiclePage />} /></Route>
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  )
}

export default AppRouter
