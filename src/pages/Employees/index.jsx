import { useState } from 'react'
import { Pencil, Plus, UserRoundCog, Users } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import MetricCard from '../../components/shared/MetricCard.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatDate } from '../../lib/formatters.js'

const EMPTY_EMPLOYEE = { name: '', email: '', active: true, joinedAt: new Date().toISOString() }

function EmployeesPage() {
  const { data, saveEmployee } = useBusinessData()
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState(EMPTY_EMPLOYEE)
  const [feedback, setFeedback] = useState(null)

  function openForm(employee = null) {
    setForm(employee ? { ...employee } : { ...EMPTY_EMPLOYEE, joinedAt: new Date().toISOString() })
    setDialog({ employeeId: employee?.id ?? null })
    setFeedback(null)
  }

  function submit(event) {
    event.preventDefault()
    try {
      saveEmployee(form, dialog.employeeId)
      setDialog(null)
      setFeedback({ type: 'success', message: dialog.employeeId ? 'Empleado actualizado.' : 'Empleado agregado al directorio.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function toggle(employee) {
    try {
      saveEmployee({ ...employee, active: !employee.active }, employee.id)
      setFeedback({ type: 'success', message: `Empleado ${employee.active ? 'desactivado' : 'activado'}.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-muted">Equipo del negocio</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Empleados</h2><p className="mt-2 text-sm text-muted">Directorio local para asignar órdenes. No envía invitaciones ni crea credenciales.</p></div><Button type="button" onClick={() => openForm()}><Plus size={17} />Agregar empleado</Button></div>
      <div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Empleados" value={data.employees.length} icon={Users} /><MetricCard label="Activos" value={data.employees.filter((employee) => employee.active).length} tone="green" /><MetricCard label="Órdenes completadas" value={data.orders.filter((order) => order.status === 'COMPLETED').length} icon={UserRoundCog} /></div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      {data.employees.length === 0 ? <div className="rounded-xl border border-outline bg-surface px-5 py-14 text-center"><Users className="mx-auto text-muted" /><p className="mt-3 text-sm text-muted">No hay empleados registrados.</p><Button type="button" onClick={() => openForm()} className="mt-5"><Plus size={16} />Agregar empleado</Button></div> : <section className="overflow-hidden rounded-xl border border-outline bg-surface"><ul className="divide-y divide-outline">{data.employees.map((employee) => { const assigned = data.orders.filter((order) => order.employeeId === employee.id); const completed = assigned.filter((order) => order.status === 'COMPLETED').length; return <li key={employee.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full border border-outline bg-surface-secondary text-muted"><UserRoundCog size={18} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{employee.name}</p><StatusBadge status={employee.active ? 'active' : 'inactive'} /><span className="rounded-full border border-outline px-2 py-0.5 text-[11px] text-muted">Empleado</span></div><p className="mt-1 truncate text-sm text-muted">{employee.email}</p><p className="mt-1 text-xs text-muted">Ingreso {formatDate(employee.joinedAt)} · {assigned.length} órdenes · {completed} completadas</p></div></div><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => openForm(employee)} aria-label={`Editar ${employee.name}`} title="Editar empleado"><Pencil size={16} />Editar</Button><Button type="button" variant="secondary" onClick={() => toggle(employee)}>{employee.active ? 'Desactivar' : 'Activar'}</Button></div></li> })}</ul></section>}
      {dialog && <Modal title={dialog.employeeId ? 'Editar empleado' : 'Agregar empleado'} description="Los empleados activos aparecen para asignar órdenes." onClose={() => setDialog(null)}>
        <form className="space-y-4" onSubmit={submit}><TextField id="employee-name" label="Nombre completo" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required maxLength={100} /><TextField id="employee-email" label="Correo electrónico" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required maxLength={120} /><div className="grid gap-4 sm:grid-cols-2"><SelectField id="employee-role" label="Rol operativo" value="employee" disabled><option value="employee">Empleado</option></SelectField>{dialog.employeeId && <SelectField id="employee-active" label="Estado" value={String(form.active)} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField>}</div><div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit">Guardar empleado</Button></div></form>
      </Modal>}
    </div>
  )
}

export default EmployeesPage

