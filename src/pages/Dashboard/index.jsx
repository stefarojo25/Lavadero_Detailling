import { Activity, ArrowRight, CarFront, CheckCircle2, CircleDollarSign, ClipboardList, Clock3, Users, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import MetricCard from '../../components/shared/MetricCard.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatCurrency, formatDateTime } from '../../lib/formatters.js'
import { getDashboardMetrics } from '../../services/businessService.js'
import './dashboard.css'

const ACTIVITY_ROUTES = { client_created: '/clients', vehicle_created: '/inventory', order_created: '/orders', order_started: '/orders', order_completed: '/orders', order_cancelled: '/orders', payment: '/cash' }

function DashboardPage() {
  const { data } = useBusinessData()
  const { user } = useAuth()
  const isEmployee = user?.role === 'employee'
  const visibleOrders = isEmployee ? data.orders.filter((order) => order.employeeId === user.employeeId) : data.orders
  const visibleAppointments = isEmployee ? data.appointments.filter((appointment) => appointment.employeeId === user.employeeId) : data.appointments
  const visibleClientIds = new Set([...visibleOrders.map((order) => order.clientId), ...visibleAppointments.map((appointment) => appointment.clientId)])
  const visibleVehicleIds = new Set([...visibleOrders.map((order) => order.vehicleId), ...visibleAppointments.map((appointment) => appointment.vehicleId)])
  const metricsData = isEmployee ? { ...data, orders: visibleOrders, appointments: visibleAppointments, clients: data.clients.filter((client) => visibleClientIds.has(client.id)), vehicles: data.vehicles.filter((vehicle) => visibleVehicleIds.has(vehicle.id)) } : data
  const metrics = getDashboardMetrics(metricsData)
  const visibleReferences = new Set([...visibleOrders.map((order) => order.id), ...visibleAppointments.map((appointment) => appointment.id)])
  const activity = isEmployee ? data.activity.filter((item) => visibleReferences.has(item.referenceId)) : data.activity
  const activeOrders = visibleOrders.filter((order) => ['PENDING', 'IN_PROGRESS'].includes(order.status))
  const todayLabel = new Intl.DateTimeFormat('es-CO', { dateStyle: 'full' }).format(new Date())

  return (
    <div className="dashboard-atmosphere">
      <div className="space-y-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm capitalize text-muted">{todayLabel}</p><h2 className="mt-1 text-2xl font-semibold text-foreground">{isEmployee ? 'Mis servicios de hoy' : 'Resumen del negocio'}</h2><p className="mt-2 text-sm text-muted">{isEmployee ? 'Citas y órdenes que te fueron asignadas.' : 'Actividad y operación del centro en tiempo real.'}</p></div><Link to={isEmployee ? '/services' : '/orders'} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-outline bg-surface px-3.5 text-sm font-medium text-foreground hover:border-brand/50">{isEmployee ? 'Ver mis tareas' : 'Ver órdenes'} <ArrowRight size={15} /></Link></div>
      <section aria-label="Indicadores del negocio" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard to={isEmployee ? '/services' : '/orders'} label={isEmployee ? 'Servicios asignados hoy' : 'Servicios de hoy'} value={metrics.todayServices.total} detail={`${metrics.todayServices.pending} pendientes · ${metrics.todayServices.inProgress} en proceso · ${metrics.todayServices.completed} completados`} icon={Wrench} />
        {!isEmployee && <MetricCard to="/cash" label="Ingresos de hoy" value={formatCurrency(metrics.todayRevenue)} detail={`${metrics.todayPaymentCount} pagos confirmados`} icon={CircleDollarSign} tone="green" />}
        <MetricCard to="/clients" label="Clientes" value={metrics.clients} detail={`${metrics.clientsAttended} atendidos hoy`} icon={Users} />
        <MetricCard to="/clients" label="Vehículos" value={metrics.vehicles} detail={`${metrics.vehiclesAttended} atendidos hoy`} icon={CarFront} tone="amber" />
        <MetricCard to="/orders" label="Órdenes pendientes" value={metrics.orders.pending} detail={`${metrics.orders.inProgress} en proceso · ${metrics.orders.completed} completadas · ${metrics.orders.cancelled} canceladas`} icon={ClipboardList} />
        <MetricCard to="/agenda" label={isEmployee ? 'Citas asignadas hoy' : 'Citas de hoy'} value={metrics.todayAppointments} detail={isEmployee ? 'Planificadas para ti' : 'Planificadas por el equipo'} icon={CheckCircle2} tone="green" />
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section className="overflow-hidden rounded-xl border border-outline bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-outline px-4 py-4 sm:px-5"><div><h3 className="font-semibold text-foreground">{isEmployee ? 'Tareas asignadas' : 'Órdenes activas'}</h3><p className="mt-1 text-xs text-muted">Trabajo pendiente y en curso</p></div><Link to={isEmployee ? '/services' : '/orders'} className="text-sm font-medium text-brand hover:text-brand-hover">Ver todas</Link></div>
          {activeOrders.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted">{isEmployee ? 'No tienes tareas activas asignadas.' : 'No hay órdenes activas.'}</p> : <ul className="divide-y divide-outline">{activeOrders.slice(0, 5).map((order) => { const client = data.clients.find((item) => item.id === order.clientId); const vehicle = data.vehicles.find((item) => item.id === order.vehicleId); const service = data.services.find((item) => item.id === order.serviceId); return <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"><div className="min-w-0"><p className="text-sm font-medium text-foreground">{order.number} · {client ? `${client.firstName} ${client.lastName}` : 'Cliente'}</p><p className="mt-1 truncate text-xs text-muted">{vehicle?.plate ?? 'Sin vehículo'} · {service?.name ?? 'Servicio'}</p></div><StatusBadge status={order.status} /></li> })}</ul>}
        </section>
        <section className="overflow-hidden rounded-xl border border-outline bg-surface">
          <div className="flex items-center gap-2 border-b border-outline px-4 py-4 sm:px-5"><Activity size={17} className="text-brand" /><div><h3 className="font-semibold text-foreground">Actividad reciente</h3><p className="mt-1 text-xs text-muted">Cambios registrados en el negocio</p></div></div>
          {activity.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted">Aún no hay actividad asignada.</p> : <ul className="divide-y divide-outline">{activity.slice(0, 6).map((item) => <li key={item.id} className="flex gap-3 px-4 py-3.5 sm:px-5"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /><div className="min-w-0"><p className="text-sm text-foreground">{item.description}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock3 size={12} />{formatDateTime(item.createdAt)}</p></div>{ACTIVITY_ROUTES[item.type] && !(isEmployee && item.type === 'payment') && <Link to={ACTIVITY_ROUTES[item.type]} aria-label="Abrir elemento relacionado" className="ml-auto self-center text-muted hover:text-brand"><ArrowRight size={15} /></Link>}</li>)}</ul>}
        </section>
      </div>
      </div>
    </div>
  )
}

export default DashboardPage

