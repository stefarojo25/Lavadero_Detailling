import { useState } from 'react'
import { Banknote, CalendarDays, CircleDollarSign, Plus, ReceiptText, Wallet } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import MetricCard from '../../components/shared/MetricCard.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatCurrency, formatDateTime } from '../../lib/formatters.js'

const CATEGORIES = ['Venta/ingreso adicional', 'Compra de insumos', 'Compra de productos', 'Gastos operativos', 'Mantenimiento', 'Inversión', 'Transporte', 'Otros']
const TODAY = (() => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` })()
const EMPTY_FORM = { type: 'expense', category: 'Compra de insumos', description: '', amount: '', paymentMethod: 'cash', date: TODAY, notes: '' }

function CashPage() {
  const { data, createManualCashMovement } = useBusinessData()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [period, setPeriod] = useState('today')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [feedback, setFeedback] = useState(null)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (period === '7days') start.setDate(start.getDate() - 6)
  if (period === '30days') start.setDate(start.getDate() - 29)
  const orders = data.payments.filter((payment) => payment.status === 'CONFIRMED').map((payment) => ({ id: payment.id, type: 'income', category: 'Pago de servicio', description: `Pago de ${data.orders.find((order) => order.id === payment.orderId)?.number ?? 'orden'}`, amount: payment.amount, paymentMethod: payment.method, date: (payment.confirmedAt ?? payment.createdAt).slice(0, 10), timestamp: payment.confirmedAt ?? payment.createdAt, source: 'Orden', createdBy: 'Administrador' }))
  const manual = (data.manualTransactions ?? []).filter((item) => item.business_id === data.business?.business_id).map((item) => ({ ...item, timestamp: `${item.date}T12:00:00`, source: 'Movimiento manual' }))
  const allMovements = [...orders, ...manual].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const movements = allMovements.filter((item) => new Date(`${item.date}T00:00:00`) >= start)
  const income = movements.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
  const expenses = movements.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
  const balance = allMovements.reduce((sum, item) => sum + (item.type === 'income' ? Number(item.amount) : -Number(item.amount)), 0)
  const cash = movements.filter((item) => item.paymentMethod === 'cash').reduce((sum, item) => sum + (item.type === 'income' ? Number(item.amount) : -Number(item.amount)), 0)
  const transfer = movements.filter((item) => item.paymentMethod === 'transfer').reduce((sum, item) => sum + (item.type === 'income' ? Number(item.amount) : -Number(item.amount)), 0)

  function submit(event) {
    event.preventDefault()
    try {
      createManualCashMovement(form)
      setDialogOpen(false)
      setForm({ ...EMPTY_FORM, date: TODAY })
      setFeedback({ type: 'success', message: 'Movimiento registrado en Caja.' })
    } catch (error) { setFeedback({ type: 'error', message: error.message }) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">Pagos confirmados de órdenes y movimientos manuales</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Caja</h2><p className="mt-2 text-sm text-muted">Los pagos declarados aparecen solo después de confirmación administrativa.</p></div><div className="flex flex-wrap items-center gap-3">{isAdmin && <Button type="button" onClick={() => { setDialogOpen(true); setFeedback(null) }}><Plus size={17} />Registrar movimiento</Button>}<label className="flex items-center gap-2 text-sm text-muted"><CalendarDays size={16} /><span className="sr-only">Periodo</span><select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-10 rounded-lg border border-outline bg-surface px-3 text-foreground outline-none focus:border-brand"><option value="today">Hoy</option><option value="7days">Últimos 7 días</option><option value="30days">Últimos 30 días</option></select></label></div></div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Ingresos del periodo" value={formatCurrency(income)} icon={CircleDollarSign} tone="green" /><MetricCard label="Egresos del periodo" value={formatCurrency(expenses)} icon={ReceiptText} tone="amber" /><MetricCard label="Saldo acumulado" value={formatCurrency(balance)} detail="Ingresos menos egresos" icon={Wallet} /><MetricCard label="Efectivo / transferencia" value={`${formatCurrency(cash)} / ${formatCurrency(transfer)}`} icon={Banknote} /></div>
      <section className="overflow-hidden rounded-xl border border-outline bg-surface"><div className="border-b border-outline px-4 py-4 sm:px-5"><h3 className="font-semibold text-foreground">Historial de movimientos</h3><p className="mt-1 text-xs text-muted">Ingresos y egresos del negocio</p></div>{movements.length === 0 ? <div className="px-5 py-14 text-center"><ReceiptText className="mx-auto text-muted" /><p className="mt-3 text-sm font-medium text-foreground">No hay movimientos en este periodo</p></div> : <ul className="divide-y divide-outline">{movements.map((item) => <li key={`${item.source}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"><div className="min-w-0"><p className="font-medium text-foreground">{item.description}</p><p className="mt-1 text-xs text-muted">{formatDateTime(item.timestamp)} · {item.category} · {item.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}</p><p className="mt-1 text-xs text-muted">Origen: {item.source} · Registró: {item.createdBy || 'Administrador'}</p>{item.notes && <p className="mt-1 text-xs text-muted">{item.notes}</p>}</div><p className={`text-lg font-semibold ${item.type === 'income' ? 'text-emerald-300' : 'text-amber-200'}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</p></li>)}</ul>}</section>
      {dialogOpen && <Modal title="Registrar movimiento" description="Registra un ingreso adicional o un egreso. El movimiento de Caja no modifica inventario." onClose={() => setDialogOpen(false)}><form className="space-y-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><SelectField id="cash-type" label="Tipo" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, category: event.target.value === 'income' ? CATEGORIES[0] : 'Compra de insumos' }))} required><option value="income">Ingreso</option><option value="expense">Egreso</option></SelectField><SelectField id="cash-category" label="Categoría" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required>{(form.type === 'income' ? [CATEGORIES[0], 'Otros'] : CATEGORIES.slice(1)).map((category) => <option key={category}>{category}</option>)}</SelectField><TextField id="cash-description" label="Concepto o descripción" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required maxLength={160} /><TextField id="cash-amount" label="Valor" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required /><SelectField id="cash-method" label="Método de pago" value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} required><option value="cash">Efectivo</option><option value="transfer">Transferencia</option></SelectField><TextField id="cash-date" label="Fecha del movimiento" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></div><TextField id="cash-notes" label="Observaciones (opcional)" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} maxLength={500} />{form.type === 'expense' && form.category === 'Compra de insumos' && <p className="rounded-lg border border-outline bg-canvas px-3 py-2 text-xs text-muted">Este egreso no aumenta el stock. Registra por separado la entrada en Inventario con los productos y cantidades.</p>}<div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit">Guardar movimiento</Button></div></form></Modal>}
    </div>
  )
}

export default CashPage
