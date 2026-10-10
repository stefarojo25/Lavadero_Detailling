import { useState } from 'react'
import { Banknote, CalendarDays, CircleDollarSign, Plus, ReceiptText, Wallet } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { commercialDateInput, commercialDateRange, formatCommercialDateTime, formatCurrency } from '../../lib/formatters.js'
import { filterBusinessFinancialRecords } from '../Reports/reportFinancials.js'

const CATEGORIES = ['Venta/ingreso adicional', 'Compra de insumos', 'Compra de productos', 'Gastos operativos', 'Mantenimiento', 'Inversión', 'Transporte', 'Otros']
const TODAY = commercialDateInput()
const EMPTY_FORM = { type: 'expense', category: 'Compra de insumos', description: '', amount: '', paymentMethod: 'cash', date: TODAY, notes: '' }

function CashPage() {
  const { data, createManualCashMovement } = useBusinessData()
  const { user } = useAuth()
  const businessId = user?.business_id ?? data.business?.business_id
  const isAdmin = user?.role === 'admin'
  const [period, setPeriod] = useState('today')
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [feedback, setFeedback] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const { startDate, endDate } = commercialDateRange(period === '7days' ? 7 : period === '30days' ? 30 : 1)
  const scopedRecords = filterBusinessFinancialRecords({ payments: data.payments, manualTransactions: data.manualTransactions, orders: data.orders, businessId })
  const orders = scopedRecords.payments.filter((payment) => payment.status === 'CONFIRMED').map((payment) => {
    const order = data.orders.find((item) => item.id === payment.orderId && (item.business_id ?? item.businessId) === businessId)
    const client = data.clients.find((item) => item.id === order?.clientId && (item.business_id ?? item.businessId) === businessId)
    const vehicle = data.vehicles.find((item) => item.id === order?.vehicleId && (item.business_id ?? item.businessId) === businessId)
    const service = data.services.find((item) => item.id === order?.serviceId && (item.business_id ?? item.businessId) === businessId)
    const timestamp = payment.confirmedAt ?? payment.createdAt
    return { id: payment.id, orderId: order?.id, type: 'income', category: 'Pago de servicio', description: `Pago de ${order?.number ?? 'orden'}`, amount: payment.amount, paymentMethod: payment.method ?? payment.paymentMethod, date: commercialDateInput(timestamp), timestamp, source: 'Orden', createdBy: payment.confirmedBy ?? 'Sin dato histórico', paymentStatus: 'Confirmado', clientName: client ? `${client.firstName} ${client.lastName}`.trim() : 'Cliente no disponible', vehicleName: vehicle ? `${vehicle.plate} · ${vehicle.brand} ${vehicle.model}` : 'Vehículo no disponible', serviceName: service?.name ?? 'Servicio no disponible' }
  })
  const manual = scopedRecords.manualTransactions.map((item) => ({ ...item, timestamp: `${item.date}T17:00:00.000Z`, source: 'Movimiento manual' }))
  const allMovements = [...orders, ...manual].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const movements = allMovements.filter((item) => period === 'specific' ? item.date === selectedDate && item.date <= endDate : item.date >= startDate && item.date <= endDate)
  const amountOf = (items) => items.reduce((sum, item) => sum + Number(item.amount), 0)
  const select = (type, method, source) => movements.filter((item) => item.type === type && item.paymentMethod === method && (!source || item.source === source))
  const servicesCash = select('income', 'cash', 'Orden')
  const servicesTransfer = select('income', 'transfer', 'Orden')
  const manualIncomeCash = select('income', 'cash', 'Movimiento manual')
  const manualIncomeTransfer = select('income', 'transfer', 'Movimiento manual')
  const expensesCash = select('expense', 'cash')
  const expensesTransfer = select('expense', 'transfer')
  const incomeCash = amountOf(servicesCash) + amountOf(manualIncomeCash)
  const incomeTransfer = amountOf(servicesTransfer) + amountOf(manualIncomeTransfer)
  const expenseCash = amountOf(expensesCash)
  const expenseTransfer = amountOf(expensesTransfer)
  const balanceCash = incomeCash - expenseCash
  const balanceTransfer = incomeTransfer - expenseTransfer
  const totalIncome = incomeCash + incomeTransfer
  const totalExpense = expenseCash + expenseTransfer
  const totalBalance = balanceCash + balanceTransfer
  const historyGroups = {
    cash: { title: 'Movimientos en efectivo', items: movements.filter((item) => item.paymentMethod === 'cash'), total: balanceCash },
    transfer: { title: 'Movimientos por transferencia', items: movements.filter((item) => item.paymentMethod === 'transfer'), total: balanceTransfer },
    income: { title: 'Ingresos del periodo', items: movements.filter((item) => item.type === 'income'), total: totalIncome },
    expenses: { title: 'Egresos del periodo', items: movements.filter((item) => item.type === 'expense'), total: totalExpense },
    total: { title: 'Todos los movimientos del periodo', items: movements, total: totalBalance },
  }

  function summaryCard(key, label, value, detail, Icon, tone = 'brand') {
    const active = selectedDetail === key
    const tones = { brand: 'bg-brand/10 text-brand', green: 'bg-emerald-500/10 text-emerald-400', amber: 'bg-amber-500/10 text-amber-300' }
    return <button key={key} type="button" aria-pressed={active} onClick={() => setSelectedDetail(active ? null : key)} className={`group min-w-0 rounded-xl border bg-surface p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_12px_32px_rgba(0,140,255,0.09)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:p-5 ${active ? 'border-brand ring-1 ring-brand/40' : 'border-outline'}`}><span className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-muted">{label}</span><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tones[tone] ?? tones.brand}`}><Icon size={18} aria-hidden="true" /></span></span><span className="mt-4 block break-words text-2xl font-semibold text-foreground">{formatCurrency(value)}</span>{detail && <span className="mt-1 block text-xs text-muted">{detail}</span>}</button>
  }

  function submit(event) {
    event.preventDefault()
    try {
      createManualCashMovement(form)
      setDialogOpen(false)
      setForm({ ...EMPTY_FORM, date: commercialDateInput() })
      setFeedback({ type: 'success', message: 'Movimiento registrado en Caja.' })
    } catch (error) { setFeedback({ type: 'error', message: error.message }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">Pagos confirmados de órdenes y movimientos manuales</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Caja</h2><p className="mt-2 text-sm text-muted">Los pagos declarados aparecen solo después de confirmación administrativa.</p></div><div className="flex flex-wrap items-center gap-3">{isAdmin && <Button type="button" onClick={() => { setDialogOpen(true); setFeedback(null) }}><Plus size={17} />Registrar movimiento</Button>}<label className="flex items-center gap-2 text-sm text-muted"><CalendarDays size={16} /><span className="sr-only">Periodo</span><select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-10 rounded-lg border border-outline bg-surface px-3 text-foreground outline-none focus:border-brand"><option value="today">Hoy</option><option value="7days">Últimos 7 días</option><option value="30days">Últimos 30 días</option><option value="specific">Día específico</option></select></label>{period === 'specific' && <label className="flex items-center gap-2 text-sm text-muted"><span>Fecha</span><input aria-label="Elegir día del historial" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-10 rounded-lg border border-outline bg-surface px-3 text-foreground outline-none focus:border-brand" /></label>}</div></div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{summaryCard('cash', 'Saldo efectivo', balanceCash, `Ingresos ${formatCurrency(incomeCash)} · Egresos ${formatCurrency(expenseCash)}`, Banknote, 'green')}{summaryCard('transfer', 'Saldo transferencia', balanceTransfer, `Ingresos ${formatCurrency(incomeTransfer)} · Egresos ${formatCurrency(expenseTransfer)}`, CircleDollarSign, 'amber')}{summaryCard('income', 'Ingresos del periodo', totalIncome, 'Servicios + movimientos manuales', ReceiptText, 'green')}{summaryCard('expenses', 'Egresos del periodo', totalExpense, 'Efectivo + transferencia', ReceiptText, 'amber')}{summaryCard('total', 'Saldo general', totalBalance, 'Efectivo + transferencia', Wallet)}</div>
      <section className="overflow-hidden rounded-xl border border-outline bg-surface"><div className="border-b border-outline px-4 py-4 sm:px-5"><h3 className="font-semibold text-foreground">Historial de movimientos</h3>{selectedDetail && <p className="mt-1 text-xs text-muted">{historyGroups[selectedDetail].title} · {historyGroups[selectedDetail].items.length} registros · Total {formatCurrency(historyGroups[selectedDetail].total)}</p>}</div>{selectedDetail && historyGroups[selectedDetail].items.length > 0 && <ul className="divide-y divide-outline">{historyGroups[selectedDetail].items.map((item) => <li key={`${item.source}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><div className="min-w-0"><p className="font-medium text-foreground">{item.source === 'Orden' ? `${item.clientName} · ${item.vehicleName} · ${item.serviceName}` : item.description}</p><p className="mt-1 text-xs text-muted">{formatCommercialDateTime(item.timestamp)} · {item.category} · {item.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}</p><p className="mt-1 text-xs text-muted">Estado del pago: {item.paymentStatus ?? 'Registrado'} · Origen: {item.source} · {item.source === 'Orden' ? 'Confirmó' : 'Registró'}: {item.createdBy || 'Sin dato histórico'}</p>{item.notes && <p className="mt-1 text-xs text-muted">{item.notes}</p>}</div><p className={`text-lg font-semibold ${item.type === 'income' ? 'text-emerald-300' : 'text-amber-200'}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</p></li>)}</ul>}</section>
      {dialogOpen && <Modal title="Registrar movimiento" description="Registra un ingreso adicional o un egreso. El movimiento de Caja no modifica inventario." onClose={() => setDialogOpen(false)}><form className="space-y-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><SelectField id="cash-type" label="Tipo" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, category: event.target.value === 'income' ? CATEGORIES[0] : 'Compra de insumos' }))} required><option value="income">Ingreso</option><option value="expense">Egreso</option></SelectField><SelectField id="cash-category" label="Categoría" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required>{(form.type === 'income' ? [CATEGORIES[0], 'Otros'] : CATEGORIES.slice(1)).map((category) => <option key={category}>{category}</option>)}</SelectField><TextField id="cash-description" label="Concepto o descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required maxLength={160} /><TextField id="cash-amount" label="Valor" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required /><SelectField id="cash-method" label="Método de pago" value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} required><option value="cash">Efectivo</option><option value="transfer">Transferencia</option></SelectField><TextField id="cash-date" label="Fecha del movimiento" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></div><TextField id="cash-notes" label="Observaciones (opcional)" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} maxLength={500} />{form.type === 'expense' && form.category === 'Compra de insumos' && <p className="rounded-lg border border-outline bg-canvas px-3 py-2 text-xs text-muted">Este egreso no aumenta el stock. Registra por separado la entrada en Inventario con los productos y cantidades.</p>}<div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit">Guardar movimiento</Button></div></form></Modal>}
    </div>
  )
}

export default CashPage
