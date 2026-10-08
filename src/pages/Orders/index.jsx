import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CarFront, Check, CircleCheck, CircleX, Clock3, ImagePlus, Pencil, Plus, Search, Trash2, UserRound, Wrench } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { ROUTES } from '../../app/routes.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatCurrency, formatDateTime, fullName, vehicleName } from '../../lib/formatters.js'
import { normalizeSearchText, searchRank } from '../../lib/search.js'

const EMPTY_ORDER = { clientId: '', vehicleId: '', serviceId: '', employeeId: '', date: new Date().toISOString().slice(0, 10), paymentMethod: '', price: '', initialConditionNotes: '', initialConditionPhotos: [] }

function OrdersPage() {
  const location = useLocation()
  const { data, createOrder, updateOrder, deleteOrder, transitionOrder, declarePaymentMethod, confirmPayment } = useBusinessData()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isEmployee = user?.role === 'employee'
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientSearch, setClientSearch] = useState('')
  const [plateSearch, setPlateSearch] = useState('')
  const [form, setForm] = useState(EMPTY_ORDER)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const [deleteOrderId, setDeleteOrderId] = useState(null)
  const [paymentOrderId, setPaymentOrderId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [feedback, setFeedback] = useState(null)
  const temporaryPhotoUrls = useRef(new Set())
  const visibleOrders = data.orders.filter((order) => isAdmin || (user?.employeeId && order.employeeId === user.employeeId))

  const filteredOrders = data.orders.filter((order) => {
    if (!isAdmin && (!user?.employeeId || order.employeeId !== user.employeeId)) return false
    const relations = { client: data.clients.find((item) => item.id === order.clientId), vehicle: data.vehicles.find((item) => item.id === order.vehicleId), service: data.services.find((item) => item.id === order.serviceId) }
    const text = `${order.number} ${fullName(relations.client)} ${vehicleName(relations.vehicle)} ${relations.service?.name ?? ''}`.toLowerCase()
    return text.includes(query.trim().toLowerCase()) && (statusFilter === 'all' || order.status === statusFilter)
  })

  function openCreate() {
    const selectedService = data.services.find((service) => service.id === location.state?.serviceId && service.active)
    setForm({ ...EMPTY_ORDER, ...(selectedService ? { serviceId: selectedService.id, price: String(selectedService.price) } : {}) })
    setClientSearch('')
    setPlateSearch('')
    setCreateOpen(true)
    setFeedback(null)
  }

  useEffect(() => {
    if (!createOpen) return
    const temporaryUrls = temporaryPhotoUrls.current
    return () => {
      temporaryUrls.forEach((url) => URL.revokeObjectURL(url))
      temporaryUrls.clear()
    }
  }, [createOpen])

  function addInitialPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Selecciona una imagen válida.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Cada fotografía debe pesar menos de 5 MB.' })
      return
    }
    const previewUrl = URL.createObjectURL(file)
    temporaryPhotoUrls.current.add(previewUrl)
    setForm((current) => ({ ...current, initialConditionPhotos: [...current.initialConditionPhotos, { id: crypto.randomUUID(), fileName: file.name, url: previewUrl, capturedAt: new Date().toISOString(), description: '', position: '' }] }))
    setFeedback(null)
  }

  function updateInitialPhoto(index, field, value) {
    setForm((current) => ({ ...current, initialConditionPhotos: current.initialConditionPhotos.map((photo, photoIndex) => photoIndex === index ? { ...photo, [field]: value } : photo) }))
  }

  function removeInitialPhoto(index) {
    const photo = form.initialConditionPhotos[index]
    if (photo?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url)
      temporaryPhotoUrls.current.delete(photo.url)
    }
    setForm((current) => ({ ...current, initialConditionPhotos: current.initialConditionPhotos.filter((_, photoIndex) => photoIndex !== index) }))
  }

  function closeCreate() {
    temporaryPhotoUrls.current.forEach((url) => URL.revokeObjectURL(url))
    temporaryPhotoUrls.current.clear()
    setCreateOpen(false)
  }

  function handleCreate(event) {
    event.preventDefault()
    try {
      const savedPhotos = form.initialConditionPhotos.map((photo) => ({ id: photo.id, url: null, fileName: photo.fileName, capturedAt: photo.capturedAt, description: photo.description.trim(), position: photo.position.trim() }))
      const orderValues = { ...form, employeeId: isAdmin ? form.employeeId : user.employeeId, paymentMethod: form.paymentMethod, initialConditionPhotos: savedPhotos }
      createOrder(orderValues)
      setCreateOpen(false)
      setFeedback({ type: 'success', message: 'Orden creada en estado Pendiente. El pago queda pendiente de confirmación.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function openEdit(order) {
    setEditOrder({ id: order.id, clientId: order.clientId, vehicleId: order.vehicleId, serviceId: order.serviceId, employeeId: order.employeeId, price: String(order.price) })
    setFeedback(null)
  }

  function handleEdit(event) {
    event.preventDefault()
    try {
      updateOrder(editOrder.id, editOrder)
      setEditOrder(null)
      setFeedback({ type: 'success', message: 'Orden corregida.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function handleDelete() {
    try {
      deleteOrder(deleteOrderId)
      setDeleteOrderId(null)
      setFeedback({ type: 'success', message: 'Orden eliminada.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function changeStatus(order, nextStatus) {
    if (nextStatus === 'CANCELLED' && !window.confirm(`¿Cancelar la orden ${order.number}?`)) return
    try {
      transitionOrder(order.id, nextStatus)
      if (nextStatus === 'COMPLETED' && !isAdmin) {
        setPaymentOrderId(order.id)
      }
      setFeedback({ type: 'success', message: `${order.number}: ${nextStatus === 'IN_PROGRESS' ? 'servicio iniciado' : nextStatus === 'COMPLETED' ? 'servicio completado e insumos descontados' : 'orden cancelada'}.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function handlePayment(event) {
    event.preventDefault()
    try {
      declarePaymentMethod(paymentOrderId, paymentMethod)
      setPaymentOrderId(null)
      setFeedback({ type: 'success', message: 'Método declarado. El pago queda pendiente de confirmación administrativa.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function handlePaymentConfirmation(order) {
    try {
      confirmPayment(order.id)
      setFeedback({ type: 'success', message: `Pago de ${order.number} confirmado y enviado a Caja.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  const availableVehicles = data.vehicles.filter((vehicle) => vehicle.clientId === form.clientId && vehicle.active)
  const normalizedClientSearch = normalizeSearchText(clientSearch)
  const normalizedPlateSearch = normalizeSearchText(plateSearch)
  const clientSearchResults = normalizedClientSearch
    ? data.clients
      .filter((client) => client.active)
      .map((client) => {
        const name = normalizeSearchText(fullName(client))
        const phone = normalizeSearchText(client.phone)
        const whatsapp = normalizeSearchText(client.whatsapp ?? '')
        const ranks = [name, phone, whatsapp].map((value) => searchRank(value, normalizedClientSearch))
        return { client, rank: Math.min(...ranks) }
      })
      .filter(({ client }) => {
        const name = normalizeSearchText(fullName(client))
        const phone = normalizeSearchText(client.phone)
        const whatsapp = normalizeSearchText(client.whatsapp ?? '')
        return [name, phone, whatsapp].some((value) => value.includes(normalizedClientSearch))
      })
      .sort((first, second) => first.rank - second.rank)
      .map(({ client }) => client)
    : []
  const plateSearchResults = normalizedPlateSearch
    ? data.vehicles
      .filter((vehicle) => vehicle.active)
      .map((vehicle) => ({ vehicle, rank: searchRank(normalizeSearchText(vehicle.plate), normalizedPlateSearch) }))
      .filter(({ vehicle }) => normalizeSearchText(vehicle.plate).includes(normalizedPlateSearch))
      .sort((first, second) => first.rank - second.rank)
      .map(({ vehicle }) => vehicle)
    : []

  function selectClient(client) {
    setForm((current) => ({ ...current, clientId: client.id, vehicleId: '' }))
    setClientSearch('')
    setPlateSearch('')
  }

  function selectVehicle(vehicle) {
    setForm((current) => ({ ...current, clientId: vehicle.clientId, vehicleId: vehicle.id }))
    setClientSearch('')
    setPlateSearch('')
  }

  function registerClient() {
    setCreateOpen(false)
    navigate(ROUTES.CLIENTS)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">{isAdmin ? 'Seguimiento de todas las órdenes' : 'Tareas que te fueron asignadas'}</p><h2 className="mt-1 text-2xl font-semibold text-foreground">{isAdmin ? 'Órdenes de servicio' : 'Mis órdenes'}</h2><p className="mt-2 text-sm text-muted">La finalización descuenta receta; Caja solo recibe pagos confirmados por Admin.</p></div>{(isAdmin || isEmployee) && <Button type="button" onClick={openCreate}><Plus size={17} />Crear orden</Button>}</div>
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border border-outline bg-surface p-4"><p className="text-xs text-muted">Pendientes</p><p className="mt-2 text-2xl font-semibold text-amber-200">{visibleOrders.filter((item) => item.status === 'PENDING').length}</p></div><div className="rounded-xl border border-outline bg-surface p-4"><p className="text-xs text-muted">En proceso</p><p className="mt-2 text-2xl font-semibold text-sky-200">{visibleOrders.filter((item) => item.status === 'IN_PROGRESS').length}</p></div><div className="rounded-xl border border-outline bg-surface p-4"><p className="text-xs text-muted">Completadas</p><p className="mt-2 text-2xl font-semibold text-emerald-200">{visibleOrders.filter((item) => item.status === 'COMPLETED').length}</p></div><div className="rounded-xl border border-outline bg-surface p-4"><p className="text-xs text-muted">Canceladas</p><p className="mt-2 text-2xl font-semibold text-muted">{visibleOrders.filter((item) => item.status === 'CANCELLED').length}</p></div></div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      <section className="overflow-hidden rounded-xl border border-outline bg-surface">
        <div className="flex flex-col gap-3 border-b border-outline p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar orden, cliente o placa" aria-label="Buscar órdenes" className="h-10 w-full rounded-lg border border-outline bg-canvas pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-brand" /></div><div className="w-full sm:w-48"><SelectField id="order-filter" label="Estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos los estados</option><option value="PENDING">Pendientes</option><option value="IN_PROGRESS">En proceso</option><option value="COMPLETED">Completadas</option><option value="CANCELLED">Canceladas</option></SelectField></div></div>
        {filteredOrders.length === 0 ? <p className="px-5 py-14 text-center text-sm text-muted">{query || statusFilter !== 'all' ? 'No hay órdenes que coincidan con el filtro.' : 'Todavía no hay órdenes registradas.'}</p> : <ul className="grid gap-3 p-4 xl:grid-cols-2">{filteredOrders.map((order) => {
          const client = data.clients.find((item) => item.id === order.clientId)
          const vehicle = data.vehicles.find((item) => item.id === order.vehicleId)
          const service = data.services.find((item) => item.id === order.serviceId)
          const employee = data.employees.find((item) => item.id === order.employeeId)
          const payment = data.payments.find((item) => item.id === order.paymentId)
          return <li key={order.id} className="min-w-0 rounded-lg border border-outline bg-canvas p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-sm font-semibold text-foreground">{order.number}</p><StatusBadge status={order.status} /></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="flex min-w-0 gap-2.5"><UserRound size={16} className="mt-0.5 shrink-0 text-muted" /><p className="truncate text-sm text-foreground">{fullName(client)}</p></div><div className="flex min-w-0 gap-2.5"><CarFront size={16} className="mt-0.5 shrink-0 text-muted" /><p className="truncate text-sm text-foreground">{vehicleName(vehicle)}</p></div><div className="flex min-w-0 gap-2.5"><Wrench size={16} className="mt-0.5 shrink-0 text-muted" /><p className="truncate text-sm text-foreground">{service?.name ?? 'Servicio no disponible'}</p></div><div className="flex min-w-0 gap-2.5"><UserRound size={16} className="mt-0.5 shrink-0 text-muted" /><p className="truncate text-sm text-foreground">{employee?.name ?? 'Empleado no asignado'}</p></div></div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-outline pt-3"><div><p className="text-lg font-semibold text-foreground">{formatCurrency(order.price)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock3 size={13} />{formatDateTime(order.createdAt)}</p>{order.initialConditionNotes && <p className="mt-2 max-w-2xl text-xs text-muted">Estado inicial: {order.initialConditionNotes}</p>}{order.initialConditionPhotos.length > 0 && <p className="mt-1 text-xs text-muted">Fotografías iniciales: {order.initialConditionPhotos.length}</p>}<p className="mt-1 text-xs text-muted">{payment ? `Pagado · ${payment.method === 'cash' ? 'Efectivo' : 'Transferencia'}` : order.paymentStatus === 'PENDING_CONFIRMATION' ? `Pendiente de confirmación · ${order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}` : order.paymentStatus === 'AWAITING_METHOD' ? 'Pendiente de método indicado' : 'Sin pago declarado'}</p>{order.status === 'COMPLETED' && order.inventoryConsumedAt && <p className="mt-1 text-xs text-emerald-300">Insumos descontados automáticamente</p>}</div>
              <div className="flex flex-wrap justify-end gap-2">{order.status === 'PENDING' && <><Button type="button" onClick={() => changeStatus(order, 'IN_PROGRESS')}><ArrowRight size={15} />Iniciar</Button><Button type="button" variant="secondary" onClick={() => changeStatus(order, 'CANCELLED')}><CircleX size={15} />Cancelar</Button></>}{order.status === 'IN_PROGRESS' && <><Button type="button" onClick={() => changeStatus(order, 'COMPLETED')}><Check size={15} />Completar</Button><Button type="button" variant="secondary" onClick={() => changeStatus(order, 'CANCELLED')}><CircleX size={15} />Cancelar</Button></>}{order.status === 'COMPLETED' && order.paymentStatus === 'AWAITING_METHOD' && !isAdmin && <Button type="button" onClick={() => setPaymentOrderId(order.id)}>Indicar método de pago</Button>}{order.status === 'COMPLETED' && order.paymentStatus === 'PENDING_CONFIRMATION' && isAdmin && <Button type="button" onClick={() => handlePaymentConfirmation(order)}><CircleCheck size={15} />Confirmar pago</Button>}{isAdmin && order.status !== 'CANCELLED' && <><Button type="button" variant="secondary" onClick={() => openEdit(order)}><Pencil size={15} />Corregir</Button>{(!order.paymentId && order.paymentStatus !== 'CONFIRMED' && order.status !== 'COMPLETED') && <Button type="button" variant="secondary" onClick={() => setDeleteOrderId(order.id)}><Trash2 size={15} />Eliminar</Button>}</>}</div>
            </div>
          </li>
        })}</ul>}
      </section>

      {createOpen && <Modal title="Crear orden de servicio" description="El precio se carga desde el servicio seleccionado y puede ajustarse para esta orden." onClose={() => setCreateOpen(false)} wide>
        <form className="space-y-4" onSubmit={handleCreate}>
          <section className="space-y-4 rounded-lg border border-outline bg-canvas p-4">
            <div><h3 className="font-semibold text-foreground">Cliente y vehículo</h3><p className="mt-1 text-xs text-muted">Busca por nombre, teléfono o WhatsApp, o selecciona directamente una placa.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="mb-2 text-sm font-medium text-foreground">Buscar cliente</p><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Nombre, teléfono o WhatsApp" aria-label="Buscar cliente" className="h-10 w-full rounded-lg border border-outline bg-surface pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-brand" /></div></div>
              <div><p className="mb-2 text-sm font-medium text-foreground">Buscar por placa</p><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={plateSearch} onChange={(event) => setPlateSearch(event.target.value)} placeholder="ABC123" aria-label="Buscar por placa" className="h-10 w-full rounded-lg border border-outline bg-surface pl-9 pr-3 text-sm text-foreground uppercase outline-none placeholder:text-muted focus:border-brand" /></div></div>
            </div>
            {normalizedClientSearch && <div className="space-y-2"><p className="text-xs font-medium text-muted">Resultados</p>{clientSearchResults.length > 0 ? <ul className="grid gap-2 sm:grid-cols-2">{clientSearchResults.map((client) => { const clientVehicles = data.vehicles.filter((vehicle) => vehicle.clientId === client.id && vehicle.active); return <li key={client.id} className="rounded-lg border border-outline bg-surface p-3"><p className="font-medium text-foreground">{fullName(client)}</p><p className="mt-1 text-xs text-muted">{client.phone}</p>{client.whatsapp && <p className="mt-0.5 text-xs text-muted">WhatsApp: {client.whatsapp}</p>}<p className="mt-2 text-xs text-muted">{clientVehicles.length} {clientVehicles.length === 1 ? 'vehículo' : 'vehículos'}</p><Button type="button" variant="secondary" onClick={() => selectClient(client)} className="mt-3"><Plus size={14} />Seleccionar cliente</Button></li> })}</ul> : <div className="rounded-lg border border-dashed border-outline px-3 py-4"><p className="text-sm text-muted">Cliente no encontrado.</p>{(isAdmin || isEmployee) && <Button type="button" variant="secondary" onClick={registerClient} className="mt-3"><Plus size={14} />Registrar nuevo cliente</Button>}</div>}</div>}
            {normalizedPlateSearch && <div className="space-y-2"><p className="text-xs font-medium text-muted">Resultados</p>{plateSearchResults.length > 0 ? <ul className="grid gap-2 sm:grid-cols-2">{plateSearchResults.map((vehicle) => <li key={vehicle.id} className="rounded-lg border border-outline bg-surface p-3"><p className="font-mono font-semibold text-foreground">{vehicle.plate}</p><p className="mt-1 text-sm text-foreground">{fullName(data.clients.find((client) => client.id === vehicle.clientId))}</p><p className="mt-1 text-xs text-muted">{vehicle.brand} {vehicle.model} · {vehicle.color}</p><Button type="button" variant="secondary" onClick={() => selectVehicle(vehicle)} className="mt-3">Seleccionar vehículo</Button></li>)}</ul> : <p className="rounded-lg border border-dashed border-outline px-3 py-4 text-sm text-muted">Vehículo no encontrado.</p>}</div>}
            {form.clientId && <div className="grid gap-2 rounded-lg border border-outline bg-surface p-3 sm:grid-cols-2"><div><p className="text-xs text-muted">Cliente seleccionado</p><p className="mt-1 text-sm font-medium text-foreground">{fullName(data.clients.find((client) => client.id === form.clientId))}</p></div><div><p className="text-xs text-muted">Vehículo seleccionado</p><p className="mt-1 text-sm font-medium text-foreground">{vehicleName(data.vehicles.find((vehicle) => vehicle.id === form.vehicleId))}</p></div></div>}
            {form.clientId && <div className="space-y-2"><p className="text-xs font-medium text-muted">Vehículos disponibles</p>{availableVehicles.length > 0 ? <div className="grid gap-2 sm:grid-cols-2">{availableVehicles.map((vehicle) => <button key={vehicle.id} type="button" onClick={() => selectVehicle(vehicle)} className={`rounded-lg border p-3 text-left transition hover:border-brand/50 ${form.vehicleId === vehicle.id ? 'border-brand bg-brand/10' : 'border-outline bg-surface'}`}><p className="font-mono text-sm font-semibold text-foreground">{vehicle.plate}</p><p className="mt-1 text-xs text-muted">{vehicle.brand} {vehicle.model} · {vehicle.color}</p></button>)}</div> : <p className="text-sm text-muted">Este cliente no tiene vehículos activos.</p>}</div>}
            {form.clientId && <SelectField id="order-service" label="Servicio" value={form.serviceId} onChange={(event) => { const selected = data.services.find((item) => item.id === event.target.value); setForm((current) => ({ ...current, serviceId: event.target.value, price: selected ? String(selected.price) : '' })) }} required><option value="">Selecciona un servicio</option>{data.services.filter((item) => item.active).map((service) => <option key={service.id} value={service.id}>{service.name} · {formatCurrency(service.price)}</option>)}</SelectField>}
            {!form.clientId && <p className="text-sm text-muted">Selecciona un cliente y un vehículo para continuar.</p>}
            {isAdmin ? <SelectField id="order-employee" label="Empleado asignado" value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} required><option value="">Selecciona un empleado</option>{data.employees.filter((item) => item.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</SelectField> : <p className="rounded-lg border border-outline bg-canvas px-3.5 py-3 text-sm text-muted">Empleado asignado: {fullName(data.employees.find((item) => item.id === user.employeeId))}</p>}
            <TextField id="order-date" label="Fecha de la orden" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
            <TextField id="order-price" label="Precio de la orden" type="number" min="0" step="100" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required />
            <SelectField id="order-payment-method" label="Método de pago informado" value={form.paymentMethod ?? ''} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} required><option value="">Selecciona un método</option><option value="cash">Efectivo</option><option value="transfer">Transferencia</option></SelectField>
          </section>
          <section className="space-y-4 rounded-lg border border-outline bg-canvas p-4">
            <div><h3 className="font-semibold text-foreground">Estado inicial del vehículo</h3><p className="mt-1 text-xs text-muted">Registra cómo llegó el vehículo antes de iniciar el servicio.</p></div>
            <div className="sm:col-span-2"><TextField id="order-initial-condition-notes" label="Observaciones iniciales" value={form.initialConditionNotes} onChange={(event) => setForm((current) => ({ ...current, initialConditionNotes: event.target.value }))} maxLength={500} placeholder="Ejemplo: rayón en la puerta delantera derecha" /></div>
            <div>
              <label htmlFor="order-initial-condition-photo" className="mb-2 block text-sm font-medium text-foreground">Fotografías del estado inicial</label>
              <label htmlFor="order-initial-condition-photo" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-outline bg-surface px-3.5 text-sm font-medium text-foreground hover:border-brand/50"><ImagePlus size={16} />Agregar fotografía<input id="order-initial-condition-photo" type="file" accept="image/*" onChange={addInitialPhoto} className="sr-only" /></label>
              <p className="mt-2 text-xs text-muted">Las imágenes se usan únicamente como previsualización durante el formulario. No se guardan en localStorage.</p>
            </div>
            {form.initialConditionPhotos.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{form.initialConditionPhotos.map((photo, index) => <li key={photo.id} className="overflow-hidden rounded-lg border border-outline bg-surface"><div className="relative aspect-4/3 bg-surface-secondary"><img src={photo.url} alt={`Previsualización ${index + 1}`} className="h-full w-full object-cover" /><Button type="button" variant="secondary" onClick={() => removeInitialPhoto(index)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-md p-0" aria-label={`Eliminar fotografía ${index + 1}`} title="Eliminar fotografía"><Trash2 size={15} /></Button></div><div className="space-y-2 p-3"><p className="truncate text-xs text-muted">{photo.fileName}</p><TextField id={`initial-photo-description-${index}`} label="Descripción" value={photo.description} onChange={(event) => updateInitialPhoto(index, 'description', event.target.value)} maxLength={200} /><TextField id={`initial-photo-position-${index}`} label="Ángulo o posición" value={photo.position} onChange={(event) => updateInitialPhoto(index, 'position', event.target.value)} maxLength={100} placeholder="Frente, lateral, trasero" /></div></li>)}</ul>}
          </section>
          <p className="rounded-lg border border-outline bg-canvas px-3.5 py-3 text-sm text-muted">La orden inicia Pendiente. El método de pago queda pendiente de confirmación administrativa; no se descuenta inventario al crear.</p>
          <div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={closeCreate}>Cancelar</Button><Button type="submit">Crear orden</Button></div>
        </form>
      </Modal>}

      {editOrder && <Modal title="Corregir orden" description="Solo administrador puede modificar la relación de la orden." onClose={() => setEditOrder(null)} wide>
        <form className="space-y-4" onSubmit={handleEdit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField id="edit-order-client" label="Cliente" value={editOrder.clientId} onChange={(event) => setEditOrder((current) => ({ ...current, clientId: event.target.value, vehicleId: '' }))} required><option value="">Selecciona un cliente</option>{data.clients.filter((item) => item.active).map((client) => <option key={client.id} value={client.id}>{fullName(client)}</option>)}</SelectField>
            <SelectField id="edit-order-vehicle" label="Vehículo" value={editOrder.vehicleId} onChange={(event) => setEditOrder((current) => ({ ...current, vehicleId: event.target.value }))} required disabled={!editOrder.clientId}><option value="">{editOrder.clientId ? 'Selecciona un vehículo' : 'Primero elige un cliente'}</option>{data.vehicles.filter((vehicle) => vehicle.clientId === editOrder.clientId && vehicle.active).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicleName(vehicle)}</option>)}</SelectField>
            <SelectField id="edit-order-service" label="Servicio" value={editOrder.serviceId} onChange={(event) => { const selected = data.services.find((item) => item.id === event.target.value); setEditOrder((current) => ({ ...current, serviceId: event.target.value, price: selected ? String(selected.price) : '' })) }} required><option value="">Selecciona un servicio</option>{data.services.filter((item) => item.active).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</SelectField>
            <SelectField id="edit-order-employee" label="Empleado" value={editOrder.employeeId} onChange={(event) => setEditOrder((current) => ({ ...current, employeeId: event.target.value }))} required><option value="">Selecciona un empleado</option>{data.employees.filter((item) => item.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</SelectField>
            <TextField id="edit-order-price" label="Precio" type="number" min="0" step="100" value={editOrder.price} onChange={(event) => setEditOrder((current) => ({ ...current, price: event.target.value }))} required />
          </div>
          <div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setEditOrder(null)}>Cancelar</Button><Button type="submit">Guardar cambios</Button></div>
        </form>
      </Modal>}

      {deleteOrderId && <Modal title="Eliminar orden" description="Esta acción quita la orden cuando no tiene pago confirmado ni inventario consumido." onClose={() => setDeleteOrderId(null)}>
        <div className="space-y-4">
          <p className="rounded-lg border border-outline bg-canvas px-3.5 py-3 text-sm text-foreground">{data.orders.find((item) => item.id === deleteOrderId)?.number} · {formatCurrency(data.orders.find((item) => item.id === deleteOrderId)?.price)}</p>
          <div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDeleteOrderId(null)}>Cancelar</Button><Button type="button" onClick={handleDelete}>Eliminar</Button></div>
        </div>
      </Modal>}

      {paymentOrderId && <Modal title="Declarar método de pago" description="El método queda pendiente; solo Admin confirma el ingreso en Caja." onClose={() => setPaymentOrderId(null)}>
        <form className="space-y-4" onSubmit={handlePayment}><p className="rounded-lg border border-outline bg-canvas px-3.5 py-3 text-sm text-foreground">{data.orders.find((item) => item.id === paymentOrderId)?.number} · {formatCurrency(data.orders.find((item) => item.id === paymentOrderId)?.price)}</p><SelectField id="payment-method" label="Método recibido" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="cash">Efectivo</option><option value="transfer">Transferencia</option></SelectField><div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setPaymentOrderId(null)}>Más tarde</Button><Button type="submit">Enviar a confirmación</Button></div></form>
      </Modal>}
    </div>
  )
}

export default OrdersPage

