import { useState } from 'react'
import { ArrowRight, CalendarDays, Check, Clock3, Pencil, Plus } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { commercialTimeInput, fullName, localDateInput, vehicleName } from '../../lib/formatters.js'

function nextStartTime() {
  const [hour, minute] = commercialTimeInput().split(':').map(Number)
  const nextSlot = Math.ceil((hour * 60 + minute + 1) / 30) * 30
  const normalizedSlot = nextSlot % (24 * 60)
  return `${String(Math.floor(normalizedSlot / 60)).padStart(2, '0')}:${String(normalizedSlot % 60).padStart(2, '0')}`
}

function AgendaPage() {
  const { data, createAppointment, updateAppointment, transitionAppointment } = useBusinessData()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const businessId = user?.business_id ?? data.business?.business_id
  const [day, setDay] = useState(localDateInput)
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState({ clientId: '', vehicleId: '', serviceId: '', employeeId: '', date: localDateInput(), time: nextStartTime(), observations: '' })
  const [feedback, setFeedback] = useState(null)
  const businessRecord = (record) => (record.business_id ?? record.businessId) === businessId
  const clients = data.clients.filter((record) => businessRecord(record))
  const vehiclesInBusiness = data.vehicles.filter((record) => businessRecord(record))
  const services = data.services.filter((record) => businessRecord(record))
  const employees = data.employees.filter((record) => businessRecord(record))
  const appointments = data.appointments.filter((appointment) => businessRecord(appointment) && appointment.date === day && (isAdmin || appointment.employeeId === user?.employeeId)).sort((left, right) => left.time.localeCompare(right.time))
  const vehicles = vehiclesInBusiness.filter((vehicle) => vehicle.clientId === form.clientId && vehicle.active)

  function openForm(appointment = null) {
    setForm(appointment ? { clientId: appointment.clientId, vehicleId: appointment.vehicleId, serviceId: appointment.serviceId, employeeId: appointment.employeeId, date: appointment.date, time: appointment.time, observations: appointment.observations ?? '' } : { clientId: '', vehicleId: '', serviceId: '', employeeId: '', date: day, time: nextStartTime(), observations: '' })
    setDialog({ appointmentId: appointment?.id ?? null })
    setFeedback(null)
  }

  function submit(event) {
    event.preventDefault()
    try {
      if (dialog.appointmentId) updateAppointment(dialog.appointmentId, form)
      else createAppointment(form)
      setDialog(null)
      setDay(form.date)
      setFeedback({ type: 'success', message: dialog.appointmentId ? 'Cita actualizada.' : 'Cita programada.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function cancel(appointment) {
    if (!window.confirm(`¿Cancelar la cita de ${appointment.time}?`)) return
    try {
      transitionAppointment(appointment.id, 'CANCELLED')
      setFeedback({ type: 'success', message: 'Cita cancelada.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function changeStatus(appointment, status) {
    try {
      transitionAppointment(appointment.id, status)
      const messages = { IN_PROGRESS: 'Cita iniciada.', COMPLETED: 'Cita completada.' }
      setFeedback({ type: 'success', message: messages[status] ?? 'Estado de cita actualizado.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">{isAdmin ? 'Planificación de citas' : 'Tareas programadas para ti'}</p><h2 className="mt-1 text-2xl font-semibold text-foreground">{isAdmin ? 'Agenda' : 'Mis servicios'}</h2><p className="mt-2 text-sm text-muted">{isAdmin ? 'Programa y asigna tareas; las órdenes se crean por separado desde Órdenes.' : user?.employeeId ? 'Solo se muestran citas y servicios asignados a tu usuario.' : 'Este acceso no está vinculado a un trabajador activo.'}</p></div><div className="flex flex-wrap items-end gap-3"><label className="flex items-center gap-2 text-sm text-muted"><CalendarDays size={16} /><span className="sr-only">Fecha de agenda</span><input type="date" min={isAdmin ? localDateInput() : undefined} value={day} onChange={(event) => setDay(event.target.value)} className="h-10 rounded-lg border border-outline bg-surface px-3 text-foreground outline-none focus:border-brand" /></label>{isAdmin && <Button type="button" onClick={() => openForm()}><Plus size={17} />Nueva cita</Button>}</div></div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      <section className="overflow-hidden rounded-xl border border-outline bg-surface"><div className="border-b border-outline px-4 py-4 sm:px-5"><h3 className="font-semibold text-foreground">Citas · {day}</h3><p className="mt-1 text-xs text-muted">{appointments.length} {appointments.length === 1 ? 'cita programada' : 'citas programadas'}</p></div>{appointments.length === 0 ? <div className="px-5 py-14 text-center"><CalendarDays className="mx-auto text-muted" /><p className="mt-3 text-sm font-medium text-foreground">{isAdmin ? 'No hay citas para esta fecha' : 'No tienes citas asignadas para esta fecha'}</p>{isAdmin && <Button type="button" onClick={() => openForm()} className="mt-4"><Plus size={16} />Programar cita</Button>}</div> : <ul className="divide-y divide-outline">{appointments.map((appointment) => { const client = clients.find((item) => item.id === appointment.clientId); const vehicle = vehiclesInBusiness.find((item) => item.id === appointment.vehicleId); const service = services.find((item) => item.id === appointment.serviceId); const employee = employees.find((item) => item.id === appointment.employeeId); return <li key={appointment.id} className="grid gap-3 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center sm:px-5"><div className="flex items-center gap-2 text-lg font-semibold text-foreground"><Clock3 size={17} className="text-brand" />{appointment.time}</div><div className="min-w-0"><p className="font-medium text-foreground">{fullName(client)} · {vehicleName(vehicle)}</p><p className="mt-1 text-sm text-muted">{service?.name} · Trabajador: {employee?.name ?? 'Sin asignar'}</p>{appointment.observations && <p className="mt-1 text-xs text-muted">Observaciones: {appointment.observations}</p>}</div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={appointment.status} />{appointment.status === 'SCHEDULED' && <>{isAdmin && <><Button type="button" variant="secondary" onClick={() => openForm(appointment)} aria-label="Editar cita"><Pencil size={15} />Editar</Button><Button type="button" variant="secondary" onClick={() => cancel(appointment)}>Cancelar</Button></>}<Button type="button" onClick={() => changeStatus(appointment, 'IN_PROGRESS')}><ArrowRight size={15} />Iniciar</Button></>}{appointment.status === 'IN_PROGRESS' && <Button type="button" onClick={() => changeStatus(appointment, 'COMPLETED')}><Check size={15} />Completar</Button>}</div></li> })}</ul>}</section>
      {isAdmin && dialog && <Modal title={dialog.appointmentId ? 'Editar cita' : 'Nueva cita'} description="La cita es una tarea programada. Las órdenes se crean por separado desde Órdenes." onClose={() => setDialog(null)} wide>
        <form className="space-y-4" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><SelectField id="appointment-client" label="Cliente" value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value, vehicleId: '' }))} required><option value="">Selecciona un cliente</option>{clients.filter((item) => item.active).map((client) => <option key={client.id} value={client.id}>{fullName(client)}</option>)}</SelectField><SelectField id="appointment-vehicle" label="Vehículo del cliente" value={form.vehicleId} onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))} required disabled={!form.clientId}><option value="">{form.clientId ? 'Selecciona un vehículo' : 'Primero selecciona un cliente'}</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicleName(vehicle)}</option>)}</SelectField><SelectField id="appointment-service" label="Servicio/tarea" value={form.serviceId} onChange={(event) => setForm((current) => ({ ...current, serviceId: event.target.value }))} required><option value="">Selecciona un servicio</option>{services.filter((item) => item.active).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</SelectField><SelectField id="appointment-employee" label="Trabajador asignado" value={form.employeeId} onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))} required><option value="">Selecciona un trabajador</option>{employees.filter((item) => item.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</SelectField><label className="block text-sm font-medium text-foreground">Fecha<input type="date" min={localDateInput()} value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required className="mt-2 h-11 w-full rounded-lg border border-outline bg-surface px-3.5 text-sm text-foreground outline-none focus:border-brand" /></label><label className="block text-sm font-medium text-foreground">Hora<input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} required className="mt-2 h-11 w-full rounded-lg border border-outline bg-surface px-3.5 text-sm text-foreground outline-none focus:border-brand" /></label><label className="block text-sm font-medium text-foreground sm:col-span-2">Observaciones<textarea value={form.observations} onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))} rows={3} maxLength={500} className="mt-2 w-full rounded-lg border border-outline bg-surface px-3.5 py-2 text-sm text-foreground outline-none focus:border-brand" /></label></div><div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit">Guardar cita</Button></div></form>
      </Modal>}
    </div>
  )
}

export default AgendaPage

