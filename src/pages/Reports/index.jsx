import { useState } from 'react'
import { BarChart3, CircleDollarSign, Users, Wrench } from 'lucide-react'
import MetricCard from '../../components/shared/MetricCard.jsx'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatCurrency } from '../../lib/formatters.js'

function ReportsPage() {
  const { data } = useBusinessData()
  const [period, setPeriod] = useState(30)
  const from = new Date()
  from.setDate(from.getDate() - period + 1)
  from.setHours(0, 0, 0, 0)
  const payments = data.payments.filter((payment) => new Date(payment.createdAt) >= from)
  const paidOrderIds = new Set(payments.map((payment) => payment.orderId))
  const completedOrders = data.orders.filter((order) => order.status === 'COMPLETED' && paidOrderIds.has(order.id))
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const serviceStats = data.services.map((service) => {
    const orders = completedOrders.filter((order) => order.serviceId === service.id)
    return { ...service, count: orders.length, revenue: orders.reduce((sum, order) => sum + order.price, 0) }
  }).filter((service) => service.count > 0).sort((left, right) => right.count - left.count)
  const employeeStats = data.employees.map((employee) => ({ ...employee, completed: completedOrders.filter((order) => order.employeeId === employee.id).length })).filter((employee) => employee.completed > 0).sort((left, right) => right.completed - left.completed)
  const clientStats = data.clients.map((client) => ({ ...client, visits: data.orders.filter((order) => order.clientId === client.id && order.status === 'COMPLETED').length })).filter((client) => client.visits > 0).sort((left, right) => right.visits - left.visits)
  const cashRevenue = payments.filter((payment) => payment.method === 'cash').reduce((sum, payment) => sum + payment.amount, 0)
  const transferRevenue = payments.filter((payment) => payment.method === 'transfer').reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">Datos de órdenes y pagos</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Reportes</h2><p className="mt-2 text-sm text-muted">Los indicadores incluyen servicios completados con pago registrado.</p></div><label className="flex items-center gap-2 text-sm text-muted">Periodo<select value={period} onChange={(event) => setPeriod(Number(event.target.value))} className="h-10 rounded-lg border border-outline bg-surface px-3 text-foreground outline-none focus:border-brand"><option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option></select></label></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total vendido" value={formatCurrency(totalRevenue)} detail={`En los últimos ${period} días`} icon={CircleDollarSign} tone="green" /><MetricCard label="Servicios vendidos" value={completedOrders.length} detail="Órdenes completadas y pagadas" icon={Wrench} /><MetricCard label="Clientes atendidos" value={clientStats.length} detail="Con al menos un servicio completado" icon={Users} tone="amber" /><MetricCard label="Órdenes completadas" value={completedOrders.length} detail="Con pago aplicado a Caja" icon={BarChart3} /></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Servicios más realizados</h3><p className="mt-1 text-xs text-muted">Cantidad e ingresos por servicio</p>{serviceStats.length === 0 ? <p className="py-8 text-center text-sm text-muted">No hay ventas en este periodo.</p> : <ul className="mt-4 space-y-4">{serviceStats.map((service) => <li key={service.id}><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium text-foreground">{service.name}</span><span className="text-muted">{service.count} · {formatCurrency(service.revenue)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(8, service.count / serviceStats[0].count * 100)}%` }} /></div></li>)}</ul>}</section>
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Ingresos por método</h3><p className="mt-1 text-xs text-muted">Pagos registrados en el periodo seleccionado</p><div className="mt-5 space-y-3"><div className="flex items-center justify-between rounded-lg border border-outline bg-canvas p-4"><span className="text-sm text-muted">Efectivo</span><span className="font-semibold text-foreground">{formatCurrency(cashRevenue)}</span></div><div className="flex items-center justify-between rounded-lg border border-outline bg-canvas p-4"><span className="text-sm text-muted">Transferencia</span><span className="font-semibold text-foreground">{formatCurrency(transferRevenue)}</span></div><div className="flex items-center justify-between border-t border-outline pt-3 text-sm"><span className="font-medium text-foreground">Total</span><span className="font-semibold text-foreground">{formatCurrency(cashRevenue + transferRevenue)}</span></div></div></section>
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Rendimiento de empleados</h3><p className="mt-1 text-xs text-muted">Órdenes completadas con pago</p>{employeeStats.length === 0 ? <p className="py-8 text-center text-sm text-muted">No hay servicios completados en el periodo.</p> : <ul className="mt-4 divide-y divide-outline">{employeeStats.map((employee) => <li key={employee.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-foreground">{employee.name}</span><span className="text-sm text-muted">{employee.completed} {employee.completed === 1 ? 'servicio' : 'servicios'}</span></li>)}</ul>}</section>
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Clientes atendidos</h3><p className="mt-1 text-xs text-muted">Historial de servicios completados</p>{clientStats.length === 0 ? <p className="py-8 text-center text-sm text-muted">No hay clientes atendidos en el periodo.</p> : <ul className="mt-4 divide-y divide-outline">{clientStats.map((client) => <li key={client.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-foreground">{client.firstName} {client.lastName}</span><span className="text-sm text-muted">{client.visits} {client.visits === 1 ? 'visita' : 'visitas'}</span></li>)}</ul>}</section>
      </div>
    </div>
  )
}

export default ReportsPage

