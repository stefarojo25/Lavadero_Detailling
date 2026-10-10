import { useState } from 'react'
import { CarFront, Search, ShieldCheck } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatDateTime } from '../../lib/formatters.js'
import { getPublicVehicleStatus } from '../../services/businessService.js'

function PublicVehiclePage() {
  const { data } = useBusinessData()
  const [plate, setPlate] = useState('')
  const [code, setCode] = useState('')
  const [publicStatus, setPublicStatus] = useState(null)
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    setPublicStatus(null)
    setError('')
    try {
      setPublicStatus(getPublicVehicleStatus(data, { plate, code }))
    } catch (lookupError) {
      setError(lookupError.message)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand"><CarFront size={25} /></span><h1 className="mt-5 text-2xl font-semibold text-foreground">Consulta de vehículo</h1><p className="mt-2 text-sm text-muted">Ingresa la placa y el código entregado al crear la orden de servicio.</p></div>
      <form onSubmit={submit} className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-2"><TextField id="lookup-plate" label="Placa" placeholder="KLM482" value={plate} onChange={(event) => setPlate(event.target.value)} required maxLength={10} icon={<CarFront size={17} />} /><TextField id="lookup-code" label="Código de consulta" placeholder="8427" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} required minLength={4} maxLength={4} pattern="[0-9]{4}" inputMode="numeric" autoComplete="one-time-code" icon={<ShieldCheck size={17} />} /></div><Button type="submit" className="mt-3 min-h-11 w-full"><Search size={17} />Consultar</Button><p className="mt-3 flex items-center gap-2 text-xs text-muted"><ShieldCheck size={14} />La consulta es de solo lectura y requiere la placa y el código de 4 dígitos.</p></form>
      {error && <div role="alert" className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">{error}</div>}
      {publicStatus && <section className="overflow-hidden rounded-xl border border-outline bg-surface"><div className="border-b border-outline p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wider text-brand">Estado de tu vehículo</p><h2 className="mt-2 text-lg font-semibold text-foreground">{publicStatus.vehicle.plate}</h2><p className="mt-1 text-sm text-muted">{[publicStatus.vehicle.brand, publicStatus.vehicle.model, publicStatus.vehicle.color, publicStatus.vehicle.type].filter(Boolean).join(' · ')}</p></div><div className="p-4 sm:p-5"><h3 className="text-sm font-semibold text-foreground">Servicio actual</h3>{publicStatus.service ? <div className="mt-3 rounded-lg border border-outline p-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{publicStatus.service.name}</p><span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">{publicStatus.service.status}</span></div><p className="mt-2 text-xs text-muted">Fecha de ingreso: {formatDateTime(publicStatus.service.entryDate)}</p></div> : <p className="mt-3 text-sm text-muted">No hay un servicio activo asociado actualmente a este vehículo.</p>}</div></section>}
    </div>
  )
}

export default PublicVehiclePage

