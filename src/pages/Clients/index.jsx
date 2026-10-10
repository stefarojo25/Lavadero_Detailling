import { useState } from 'react'
import { CarFront, Eye, Pencil, Plus, Search, UserRound, Users } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import MetricCard from '../../components/shared/MetricCard.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatDate, fullName, vehicleName } from '../../lib/formatters.js'
import { matchesClientSearch } from '../../lib/search.js'
import PhotoGallery from '../../components/photos/PhotoGallery.jsx'

const EMPTY_CLIENT = { fullName: '', phone: '', address: '', whatsapp: '', observations: '', active: true }
const EMPTY_VEHICLE = { plate: '', type: 'Carro', brand: '', model: '', color: '', observations: '', active: true }

function ClientsPage() {
  const { data, createClient, updateClient, createVehicle, updateVehicle, uploadPhoto, listPhotos, readPhotoFile, deletePhoto } = useBusinessData()
  const { user } = useAuth()
  const canCreateClient = user?.role === 'admin' || user?.role === 'employee'
  const canCreateVehicle = user?.role === 'admin' || user?.role === 'employee'
  const canAdministerClients = user?.role === 'admin'
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState(EMPTY_CLIENT)
  const [vehicleDrafts, setVehicleDrafts] = useState([])
  const [vehicleDialog, setVehicleDialog] = useState(null)
  const [vehicleForm, setVehicleForm] = useState({ plate: '', type: 'Carro', brand: '', model: '', color: '', active: true })
  const [feedback, setFeedback] = useState(null)

  const filteredClients = data.clients.filter((client) => {
    return matchesClientSearch(client, query) && (statusFilter === 'all' || client.active === (statusFilter === 'active'))
  })

  function openForm(client = null) {
    setForm(client ? { fullName: fullName(client), phone: client.phone, address: client.address ?? '', whatsapp: client.whatsapp ?? '', observations: client.observations ?? '', active: client.active } : { ...EMPTY_CLIENT })
    setVehicleDrafts([])
    setDialog({ type: 'form', clientId: client?.id ?? null })
    setFeedback(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    try {
      const [firstName, ...lastNameParts] = form.fullName.trim().split(/\s+/)
      const values = { firstName, lastName: lastNameParts.join(' '), phone: form.phone, address: form.address, whatsapp: form.whatsapp, observations: form.observations, active: form.active }
      if (dialog.clientId) {
        updateClient(dialog.clientId, values)
        setFeedback({ type: 'success', message: 'Cliente actualizado.' })
      } else {
        createClient(values, vehicleDrafts)
        setFeedback({ type: 'success', message: vehicleDrafts.length ? 'Cliente y vehículos registrados. El código se generará al crear una orden.' : 'Cliente registrado.' })
      }
      setDialog(null)
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function updateVehicleDraft(index, field, value) {
    setVehicleDrafts((current) => current.map((vehicle, vehicleIndex) => vehicleIndex === index ? { ...vehicle, [field]: value } : vehicle))
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function toggleClient(client) {
    try {
      updateClient(client.id, { ...client, active: !client.active })
      setFeedback({ type: 'success', message: `Cliente ${client.active ? 'desactivado' : 'activado'}.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function openVehicleForm(vehicle = null) {
    setVehicleForm(vehicle ? { ...vehicle } : { plate: '', type: 'Carro', brand: '', model: '', color: '', observations: '', active: true })
    setVehicleDialog({ vehicleId: vehicle?.id ?? null })
  }

  function submitVehicle(event) {
    event.preventDefault()
    try {
      const values = { ...vehicleForm, clientId: detailClient.id }
      if (vehicleDialog.vehicleId) updateVehicle(vehicleDialog.vehicleId, values)
      else createVehicle(values)
      setVehicleDialog(null)
      setFeedback({ type: 'success', message: vehicleDialog.vehicleId ? 'Vehículo actualizado.' : 'Vehículo asociado. El código se generará al crear una orden.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  async function saveVehiclePhoto(vehicle, file) {
    await uploadPhoto(file, { vehicleId: vehicle.id, stage: 'general' })
  }

  async function removeVehiclePhoto(photoId) {
    await deletePhoto(photoId)
  }

  const detailClient = dialog?.type === 'detail' ? data.clients.find((client) => client.id === dialog.clientId) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm text-muted">Relación y atención</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Clientes</h2><p className="mt-2 text-sm text-muted">Consulta perfiles, vehículos y órdenes asociadas.</p></div>
        {canCreateClient && <Button type="button" onClick={() => openForm()}><Plus size={17} />Nuevo cliente</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Clientes registrados" value={data.clients.length} icon={Users} />
        <MetricCard label="Activos" value={data.clients.filter((client) => client.active).length} tone="green" />
        <MetricCard label="Vehículos asociados" value={data.vehicles.length} icon={CarFront} tone="amber" />
      </div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      <section className="overflow-hidden rounded-xl border border-outline bg-surface">
        <div className="flex flex-col gap-3 border-b border-outline p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, teléfono o correo" aria-label="Buscar clientes" className="h-10 w-full rounded-lg border border-outline bg-canvas pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-brand" /></div>
          <div className="w-full sm:w-44"><SelectField id="client-filter" label="Estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></SelectField></div>
        </div>
        {filteredClients.length === 0 ? <div className="px-5 py-14 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl bg-surface-secondary text-muted"><UserRound size={21} /></span><h3 className="mt-4 font-medium text-foreground">{query ? 'No hay coincidencias' : 'No hay clientes registrados'}</h3><p className="mt-1 text-sm text-muted">{query ? 'Prueba con otro nombre o teléfono.' : 'Registra el primer cliente para iniciar su historial.'}</p>{!query && canCreateClient && <Button type="button" onClick={() => openForm()} className="mt-5"><Plus size={16} />Agregar cliente</Button>}</div> : (
          <ul className="divide-y divide-outline">
            {filteredClients.map((client) => {
              const vehicleCount = data.vehicles.filter((vehicle) => vehicle.clientId === client.id).length
              return <li key={client.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-outline bg-surface-secondary text-muted"><UserRound size={18} /></span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{fullName(client)}</p><StatusBadge status={client.active ? 'active' : 'inactive'} /></div><p className="mt-1 truncate text-sm text-muted">{client.phone}</p><p className="mt-1 text-xs text-muted">{vehicleCount} {vehicleCount === 1 ? 'vehículo' : 'vehículos'} · Registro {formatDate(client.createdAt)}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => setDialog({ type: 'detail', clientId: client.id })} aria-label={`Ver ${fullName(client)}`} title="Ver detalle"><Eye size={16} /><span className="sm:hidden">Ver</span></Button>
                  {canAdministerClients && <><Button type="button" variant="secondary" onClick={() => openForm(client)} aria-label={`Editar ${fullName(client)}`} title="Editar"><Pencil size={16} /><span className="sm:hidden">Editar</span></Button><Button type="button" variant="secondary" onClick={() => toggleClient(client)}>{client.active ? 'Desactivar' : 'Activar'}</Button></>}
                </div>
              </li>
            })}
          </ul>
        )}
      </section>

      {dialog?.type === 'form' && <Modal title={dialog.clientId ? 'Editar cliente' : 'Nuevo cliente'} description="Registra nombre completo, teléfono y dirección." onClose={() => setDialog(null)} wide>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><TextField id="client-full-name" name="fullName" label="Nombre completo" value={form.fullName} onChange={updateField} required maxLength={140} /></div>
            <TextField id="client-phone" name="phone" label="Teléfono" type="tel" value={form.phone} onChange={updateField} required maxLength={30} />
            <TextField id="client-address" name="address" label="Dirección" value={form.address} onChange={updateField} maxLength={160} />
            <TextField id="client-whatsapp" name="whatsapp" label="WhatsApp" type="tel" value={form.whatsapp} onChange={updateField} maxLength={30} />
            <div className="sm:col-span-2"><TextField id="client-observations" name="observations" label="Observaciones" value={form.observations} onChange={updateField} maxLength={500} /></div>
            {dialog.clientId && <SelectField id="client-active" label="Estado" value={String(form.active)} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField>}
          </div>
          {!dialog.clientId && <section className="space-y-4 rounded-lg border border-outline bg-canvas p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-foreground">Vehículos</h3><p className="mt-1 text-xs text-muted">Puedes registrar uno o varios ahora y agregar más después.</p></div><Button type="button" variant="secondary" onClick={() => setVehicleDrafts((current) => [...current, { ...EMPTY_VEHICLE }])}><Plus size={15} />Agregar vehículo</Button></div>{vehicleDrafts.map((vehicle, index) => <div key={`vehicle-draft-${index}`} className="grid gap-3 border-t border-outline pt-4 sm:grid-cols-2"><TextField id={`client-new-vehicle-plate-${index}`} label="Placa" value={vehicle.plate} onChange={(event) => updateVehicleDraft(index, 'plate', event.target.value)} required maxLength={10} /><SelectField id={`client-new-vehicle-type-${index}`} label="Tipo" value={vehicle.type} onChange={(event) => updateVehicleDraft(index, 'type', event.target.value)}><option>Moto</option><option>Carro</option><option>Camioneta</option></SelectField><TextField id={`client-new-vehicle-brand-${index}`} label="Marca" value={vehicle.brand} onChange={(event) => updateVehicleDraft(index, 'brand', event.target.value)} required maxLength={60} /><TextField id={`client-new-vehicle-model-${index}`} label="Modelo" value={vehicle.model} onChange={(event) => updateVehicleDraft(index, 'model', event.target.value)} required maxLength={60} /><TextField id={`client-new-vehicle-color-${index}`} label="Color" value={vehicle.color} onChange={(event) => updateVehicleDraft(index, 'color', event.target.value)} maxLength={40} /><SelectField id={`client-new-vehicle-active-${index}`} label="Estado" value={String(vehicle.active)} onChange={(event) => updateVehicleDraft(index, 'active', event.target.value === 'true')}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField><Button type="button" variant="secondary" onClick={() => setVehicleDrafts((current) => current.filter((_, vehicleIndex) => vehicleIndex !== index))}>Quitar vehículo</Button></div>)}</section>}
          <div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit">Guardar cliente</Button></div>
        </form>
      </Modal>}

      {detailClient && <Modal title={fullName(detailClient)} description={`Cliente desde ${formatDate(detailClient.createdAt)}`} onClose={() => setDialog(null)} wide>
        <div className="grid gap-6 sm:grid-cols-2">
          <section><h3 className="text-sm font-semibold text-foreground">Información de contacto</h3><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Teléfono</dt><dd className="text-right text-foreground">{detailClient.phone}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">WhatsApp</dt><dd className="text-right text-foreground">{detailClient.whatsapp || 'Sin número'}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Dirección</dt><dd className="text-right text-foreground">{detailClient.address || 'Sin dirección'}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Observaciones</dt><dd className="max-w-[55%] text-right text-foreground">{detailClient.observations || 'Sin observaciones'}</dd></div></dl></section>
          <section><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-foreground">Vehículos ({data.vehicles.filter((item) => item.clientId === detailClient.id).length})</h3>{canCreateVehicle && <Button type="button" variant="secondary" onClick={() => openVehicleForm()}><Plus size={14} />Agregar</Button>}</div><ul className="mt-3 space-y-3">{data.vehicles.filter((item) => item.clientId === detailClient.id).map((vehicle) => <li key={vehicle.id} className="rounded-lg border border-outline bg-canvas p-3 text-sm text-foreground"><div className="flex items-start justify-between gap-2"><div className="min-w-0">{vehicleName(vehicle)}<span className="mt-0.5 block text-xs text-muted">{vehicle.type} · {vehicle.color} · {vehicle.active ? 'Activo' : 'Inactivo'}</span>{vehicle.observations && <span className="mt-1 block text-xs text-muted">{vehicle.observations}</span>}</div>{canAdministerClients && <Button type="button" variant="secondary" onClick={() => openVehicleForm(vehicle)} aria-label={`Editar ${vehicle.plate}`} title="Editar vehículo"><Pencil size={15} /></Button>}</div>{canAdministerClients && <div className="mt-3"><PhotoGallery label="Fotos generales del vehículo" photos={listPhotos({ vehicleId: vehicle.id })} readFile={readPhotoFile} onSave={(file) => saveVehiclePhoto(vehicle, file)} onDelete={removeVehiclePhoto} canUpload={canAdministerClients} canDelete={canAdministerClients} /></div>}</li>)}{!data.vehicles.some((item) => item.clientId === detailClient.id) && <li className="text-sm text-muted">Sin vehículos asociados.</li>}</ul></section>
          <section className="sm:col-span-2"><h3 className="text-sm font-semibold text-foreground">Historial de órdenes</h3><ul className="mt-3 space-y-2">{data.orders.filter((item) => item.clientId === detailClient.id).map((order) => { const service = data.services.find((item) => item.id === order.serviceId); return <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline bg-canvas px-3 py-2 text-sm"><span className="text-foreground">{order.number} · {service?.name}</span><span className="text-muted">{formatDate(order.createdAt)} · {order.status}</span></li> })}{!data.orders.some((item) => item.clientId === detailClient.id) && <li className="text-sm text-muted">Sin órdenes registradas.</li>}</ul></section>
        </div>
      </Modal>}
      {detailClient && vehicleDialog && (!vehicleDialog.vehicleId || canAdministerClients) && <Modal title={vehicleDialog.vehicleId ? 'Editar vehículo' : 'Agregar vehículo'} description={`Vehículo asociado a ${fullName(detailClient)}.`} onClose={() => setVehicleDialog(null)}>
        <form className="space-y-4" onSubmit={submitVehicle}><div className="grid gap-4 sm:grid-cols-2"><TextField id="client-vehicle-plate" label="Placa" value={vehicleForm.plate} onChange={(event) => setVehicleForm((current) => ({ ...current, plate: event.target.value }))} required maxLength={10} /><SelectField id="client-vehicle-type" label="Tipo" value={vehicleForm.type} onChange={(event) => setVehicleForm((current) => ({ ...current, type: event.target.value }))}><option>Moto</option><option>Carro</option><option>Camioneta</option></SelectField><TextField id="client-vehicle-brand" label="Marca" value={vehicleForm.brand} onChange={(event) => setVehicleForm((current) => ({ ...current, brand: event.target.value }))} required maxLength={60} /><TextField id="client-vehicle-model" label="Modelo" value={vehicleForm.model} onChange={(event) => setVehicleForm((current) => ({ ...current, model: event.target.value }))} required maxLength={60} /><TextField id="client-vehicle-color" label="Color" value={vehicleForm.color} onChange={(event) => setVehicleForm((current) => ({ ...current, color: event.target.value }))} maxLength={40} /><div className="sm:col-span-2"><TextField id="client-vehicle-observations" label="Observaciones" value={vehicleForm.observations} onChange={(event) => setVehicleForm((current) => ({ ...current, observations: event.target.value }))} maxLength={500} /></div><SelectField id="client-vehicle-active" label="Estado" value={String(vehicleForm.active)} onChange={(event) => setVehicleForm((current) => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField></div><div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setVehicleDialog(null)}>Cancelar</Button><Button type="submit">Guardar vehículo</Button></div></form>
      </Modal>}
    </div>
  )
}

export default ClientsPage

