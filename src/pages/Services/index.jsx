import { useState } from 'react'
import { ArrowRight, CarFront, Clock3, Layers3, Pencil, Plus, ShieldCheck, Sparkles, Trash2, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import TextField from '../../components/ui/TextField.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatCurrency, formatDateTime, fullName, localDateInput, vehicleName } from '../../lib/formatters.js'

const ICONS = { Lavado: Waves, Interior: CarFront, Detailing: Sparkles, Protección: ShieldCheck }
const EMPTY_SERVICE = { name: '', description: '', category: 'Lavado', price: '', durationMinutes: 45, recipe: [], active: true }

function ServicesPage() {
  const { data, saveService } = useBusinessData()
  const { user } = useAuth()
  const canManage = user?.role === 'admin'
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState(EMPTY_SERVICE)
  const [feedback, setFeedback] = useState(null)

  function openForm(service = null) {
    setForm(service ? { ...service, recipe: (service.recipe ?? []).map((line) => ({ ...line })) } : { ...EMPTY_SERVICE, recipe: [] })
    setDialog({ serviceId: service?.id ?? null })
    setFeedback(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    try {
      saveService(form, dialog.serviceId)
      setDialog(null)
      setFeedback({ type: 'success', message: dialog.serviceId ? 'Servicio actualizado.' : 'Servicio creado.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function setActive(service) {
    try {
      saveService({ ...service, active: !service.active }, service.id)
      setFeedback({ type: 'success', message: `Servicio ${service.active ? 'desactivado' : 'activado'}.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function updateRecipeLine(index, field, value) {
    setForm((current) => ({ ...current, recipe: current.recipe.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line) }))
  }

  const assignedOrders = data.orders.filter((order) => order.employeeId === user?.employeeId && order.status !== 'CANCELLED')
  const assignedAppointments = data.appointments.filter((appointment) => appointment.employeeId === user?.employeeId && appointment.status === 'SCHEDULED' && appointment.date >= localDateInput())

  if (!canManage) return (
    <div className="space-y-6">
      <div><p className="text-sm text-muted">Trabajo que tienes asignado</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Mis servicios</h2><p className="mt-2 text-sm text-muted">Las órdenes se ejecutan en la sección Órdenes; aquí puedes consultar tus asignaciones.</p></div>
      {assignedAppointments.length === 0 && assignedOrders.length === 0 ? <p className="rounded-xl border border-outline bg-surface px-5 py-12 text-center text-sm text-muted">{user?.employeeId ? 'No tienes citas ni servicios asignados.' : 'Este acceso no está vinculado a un trabajador activo. Ingresa con el correo registrado por el administrador.'}</p> : <div className="space-y-3">
        {assignedAppointments.map((appointment) => { const client = data.clients.find((item) => item.id === appointment.clientId); const vehicle = data.vehicles.find((item) => item.id === appointment.vehicleId); const service = data.services.find((item) => item.id === appointment.serviceId); return <article key={appointment.id} className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-foreground">{appointment.date} · {appointment.time}</p><StatusBadge status="SCHEDULED" /></div><p className="mt-2 text-sm text-foreground">{fullName(client)} · {vehicleName(vehicle)}</p><p className="mt-1 text-sm text-muted">{service?.name}</p></article> })}
        {assignedOrders.map((order) => { const client = data.clients.find((item) => item.id === order.clientId); const vehicle = data.vehicles.find((item) => item.id === order.vehicleId); const service = data.services.find((item) => item.id === order.serviceId); return <article key={order.id} className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-foreground">{order.number} · {formatDateTime(order.createdAt)}</p><StatusBadge status={order.status} /></div><p className="mt-2 text-sm text-foreground">{fullName(client)} · {vehicleName(vehicle)}</p><p className="mt-1 text-sm text-muted">{service?.name}</p></article> })}
      </div>}
      <Link to="/orders" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-outline bg-surface px-3.5 text-sm font-medium text-foreground hover:border-brand/50">Abrir mis órdenes <ArrowRight size={15} /></Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">Catálogo del centro</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Servicios</h2><p className="mt-2 text-sm text-muted">Precios y duración se trasladan a cada nueva orden.</p></div>{canManage && <Button type="button" onClick={() => openForm()}><Plus size={17} />Nuevo servicio</Button>}</div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      {data.services.length === 0 ? <div className="rounded-xl border border-outline bg-surface px-5 py-14 text-center"><Layers3 className="mx-auto text-muted" /><h3 className="mt-3 font-medium text-foreground">No hay servicios en el catálogo</h3>{canManage && <Button type="button" onClick={() => openForm()} className="mt-5"><Plus size={16} />Crear servicio</Button>}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.services.map((service) => { const Icon = ICONS[service.category] ?? Layers3; return <article key={service.id} className="flex min-h-64 flex-col rounded-xl border border-outline bg-surface p-5">
          <div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl border border-brand/20 bg-brand/10 text-brand"><Icon size={21} aria-hidden="true" /></span><StatusBadge status={service.active ? 'active' : 'inactive'} /></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand">{service.category}</p><h3 className="mt-1 text-lg font-semibold text-foreground">{service.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-muted">{service.description || 'Sin descripción.'}</p>
          <div className="mt-4 border-t border-outline pt-3"><p className="text-xs font-medium text-muted">Receta de insumos</p>{service.recipe?.length ? <ul className="mt-2 space-y-1">{service.recipe.map((line) => { const item = data.inventory.find((entry) => entry.id === line.inventoryItemId); return <li key={line.inventoryItemId} className="flex justify-between gap-2 text-xs"><span className="truncate text-muted">{item?.name ?? 'Insumo eliminado'}</span><span className="shrink-0 text-foreground">{line.quantity} {item?.unit ?? ''}</span></li> })}</ul> : <p className="mt-1 text-xs text-muted">Sin insumos definidos.</p>}</div>
          <div className="mt-4 flex items-center justify-between border-t border-outline pt-4"><div><p className="text-lg font-semibold text-foreground">{formatCurrency(service.price)}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Clock3 size={13} />{service.durationMinutes} min</p></div>{canManage && <Button type="button" variant="secondary" onClick={() => openForm(service)} aria-label={`Editar ${service.name}`} title="Editar servicio"><Pencil size={16} /></Button>}</div>
          <div className="mt-4 flex gap-2"><Link to="/orders" state={{ serviceId: service.id }} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${service.active ? 'bg-brand text-white hover:bg-brand-hover' : 'pointer-events-none bg-surface-secondary text-muted'}`} aria-disabled={!service.active}>Usar en orden <ArrowRight size={15} /></Link>{canManage && <Button type="button" variant="secondary" onClick={() => setActive(service)}>{service.active ? 'Desactivar' : 'Activar'}</Button>}</div>
        </article> })}
      </div>}
      {canManage && dialog && <Modal title={dialog.serviceId ? 'Editar servicio' : 'Nuevo servicio'} description="Configura cómo se ofrece y factura este servicio." onClose={() => setDialog(null)}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TextField id="service-name" label="Nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required maxLength={100} />
          <div><label htmlFor="service-description" className="mb-2 block text-sm font-medium text-foreground">Descripción</label><textarea id="service-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={300} className="w-full resize-y rounded-lg border border-outline bg-surface px-3.5 py-3 text-sm text-foreground outline-none focus:border-brand" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><SelectField id="service-category" label="Categoría" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}><option>Lavado</option><option>Interior</option><option>Detailing</option><option>Protección</option></SelectField><TextField id="service-price" label="Precio" type="number" min="0" step="100" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required /><TextField id="service-duration" label="Duración (minutos)" type="number" min="1" value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} required />{dialog.serviceId && <SelectField id="service-active" label="Estado" value={String(form.active)} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField>}</div>
          <section className="space-y-3 rounded-lg border border-outline bg-canvas p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Receta de insumos</h3><p className="mt-1 text-xs text-muted">Se descontará del stock al completar la orden.</p></div><Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, recipe: [...current.recipe, { inventoryItemId: '', quantity: '' }] }))}><Plus size={15} />Agregar insumo</Button></div>{form.recipe.length === 0 ? <p className="text-sm text-muted">Este servicio no consume insumos.</p> : <ul className="space-y-2">{form.recipe.map((line, index) => { const selectedItem = data.inventory.find((item) => item.id === line.inventoryItemId); return <li key={`${line.inventoryItemId}-${index}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end"><SelectField id={`recipe-item-${index}`} label="Insumo" value={line.inventoryItemId} onChange={(event) => updateRecipeLine(index, 'inventoryItemId', event.target.value)} required><option value="">Selecciona un insumo</option>{data.inventory.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}</SelectField><TextField id={`recipe-quantity-${index}`} label={`Cantidad${selectedItem ? ` (${selectedItem.unit})` : ''}`} type="number" min="0.01" step="any" value={line.quantity} onChange={(event) => updateRecipeLine(index, 'quantity', event.target.value)} required /><Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, recipe: current.recipe.filter((_, lineIndex) => lineIndex !== index) }))} aria-label="Quitar insumo de la receta" title="Quitar insumo"><Trash2 size={16} /></Button></li> })}</ul>}</section>
          <div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit">Guardar servicio</Button></div>
        </form>
      </Modal>}
    </div>
  )
}

export default ServicesPage

