import { useState } from 'react'
import { BarChart3, CircleDollarSign, Users, Wrench } from 'lucide-react'
import MetricCard from '../../components/shared/MetricCard.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { commercialDateInput, commercialDateRange, formatCurrency } from '../../lib/formatters.js'
import { calculateReportFinancials } from './reportFinancials.js'

function ReportsPage() {
  const { data } = useBusinessData()
  const { user } = useAuth()
  const businessId = user?.business_id ?? data.business?.business_id
  const [period, setPeriod] = useState('30days')
  const [selectedDate, setSelectedDate] = useState(commercialDateInput())
  const { startDate, endDate } = commercialDateRange(period === '7days' ? 7 : period === '30days' ? 30 : 1)
  const reportStartDate = period === 'specific' ? selectedDate : startDate
  const reportEndDate = period === 'specific' && selectedDate <= endDate ? selectedDate : endDate
  const financials = calculateReportFinancials({
    payments: data.payments,
    manualTransactions: data.manualTransactions,
    orders: data.orders,
    businessId,
    startDate: reportStartDate,
    endDate: reportEndDate,
  })
  const { payments } = financials
  const paidOrderIds = new Set(payments.map((payment) => payment.orderId))
  const completedOrders = data.orders.filter((order) => (order.business_id ?? order.businessId) === businessId && order.status === 'COMPLETED' && paidOrderIds.has(order.id))
  const serviceStats = data.services.filter((service) => (service.business_id ?? service.businessId) === businessId).map((service) => {
    const orders = completedOrders.filter((order) => order.serviceId === service.id)
    return { ...service, count: orders.length, revenue: orders.reduce((sum, order) => sum + order.price, 0) }
  }).filter((service) => service.count > 0).sort((left, right) => right.count - left.count)
  const employeeStats = data.employees.filter((employee) => (employee.business_id ?? employee.businessId) === businessId).map((employee) => ({ ...employee, completed: completedOrders.filter((order) => order.employeeId === employee.id).length })).filter((employee) => employee.completed > 0).sort((left, right) => right.completed - left.completed)
  const clientStats = data.clients.filter((client) => (client.business_id ?? client.businessId) === businessId).map((client) => ({ ...client, visits: completedOrders.filter((order) => order.clientId === client.id).length })).filter((client) => client.visits > 0).sort((left, right) => right.visits - left.visits)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">Datos de órdenes, pagos y movimientos manuales</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Reportes</h2><p className="mt-2 text-sm text-muted">Los ingresos por servicios consideran solo pagos confirmados.</p></div><div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm text-muted">Periodo<select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-10 rounded-lg border border-outline bg-surface px-3 text-foreground outline-none focus:border-brand"><option value="today">Hoy</option><option value="7days">Últimos 7 días</option><option value="30days">Últimos 30 días</option><option value="specific">Día específico</option></select></label>{period === 'specific' && <label className="flex items-center gap-2 text-sm text-muted"><span>Fecha</span><input aria-label="Elegir día del reporte" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-10 rounded-lg border border-outline bg-surface px-3 text-foreground outline-none focus:border-brand" /></label>}</div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Ingresos por servicios" value={formatCurrency(financials.serviceIncome)} detail="Pagos confirmados de órdenes" icon={CircleDollarSign} tone="green" /><MetricCard label="Servicios vendidos" value={completedOrders.length} detail="Órdenes completadas y pagadas" icon={Wrench} /><MetricCard label="Clientes atendidos" value={clientStats.length} detail="Con al menos un servicio completado" icon={Users} tone="amber" /><MetricCard label="Órdenes completadas" value={completedOrders.length} detail="Con pago aplicado a Caja" icon={BarChart3} /></div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Servicios más realizados</h3><p className="mt-1 text-xs text-muted">Cantidad e ingresos por servicio</p>{serviceStats.length === 0 ? <p className="py-8 text-center text-sm text-muted">No hay ventas en este periodo.</p> : <ul className="mt-4 space-y-4">{serviceStats.map((service) => <li key={service.id}><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium text-foreground">{service.name}</span><span className="text-muted">{service.count} · {formatCurrency(service.revenue)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(8, service.count / serviceStats[0].count * 100)}%` }} /></div></li>)}</ul>}</section>
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Resumen financiero</h3><p className="mt-1 text-xs text-muted">Valores del mismo período comercial que Caja</p><div className="mt-5 space-y-3">{[['Ingresos por servicios', financials.serviceIncome], ['Ingresos manuales', financials.manualIncome], ['Ingresos totales', financials.totalIncome], ['Egresos', financials.expenses], ['Balance neto', financials.netBalance]].map(([label, amount]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-outline py-2 last:border-0"><span className="text-sm text-muted">{label}</span><span className="font-semibold text-foreground">{formatCurrency(amount)}</span></div>)}</div></section>
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Ingresos y egresos por método</h3><p className="mt-1 text-xs text-muted">Desglose sin mezclar efectivo y transferencia</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{[['Efectivo', financials.cash], ['Transferencia', financials.transfer]].map(([label, values]) => <div key={label} className="rounded-lg border border-outline bg-canvas p-4"><h4 className="font-medium text-foreground">{label}</h4><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-2"><dt className="text-muted">Servicios</dt><dd className="font-medium text-foreground">{formatCurrency(values.serviceIncome)}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Ingresos manuales</dt><dd className="font-medium text-foreground">{formatCurrency(values.manualIncome)}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Egresos</dt><dd className="font-medium text-foreground">{formatCurrency(values.expenses)}</dd></div><div className="flex justify-between gap-2 border-t border-outline pt-2"><dt className="text-muted">Neto</dt><dd className="font-semibold text-foreground">{formatCurrency(values.netBalance)}</dd></div></dl></div>)}</div></section>
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Rendimiento de empleados</h3><p className="mt-1 text-xs text-muted">Órdenes completadas con pago</p>{employeeStats.length === 0 ? <p className="py-8 text-center text-sm text-muted">No hay servicios completados en el periodo.</p> : <ul className="mt-4 divide-y divide-outline">{employeeStats.map((employee) => <li key={employee.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-foreground">{employee.name}</span><span className="text-sm text-muted">{employee.completed} {employee.completed === 1 ? 'servicio' : 'servicios'}</span></li>)}</ul>}</section>
        <section className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><h3 className="font-semibold text-foreground">Clientes atendidos</h3><p className="mt-1 text-xs text-muted">Historial de servicios completados</p>{clientStats.length === 0 ? <p className="py-8 text-center text-sm text-muted">No hay clientes atendidos en el periodo.</p> : <ul className="mt-4 divide-y divide-outline">{clientStats.map((client) => <li key={client.id} className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-foreground">{client.firstName} {client.lastName}</span><span className="text-sm text-muted">{client.visits} {client.visits === 1 ? 'visita' : 'visitas'}</span></li>)}</ul>}</section>
      </div>
    </div>
  )
}

export default ReportsPage

