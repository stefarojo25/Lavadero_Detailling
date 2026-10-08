import { useState } from 'react'
import { CarFront, Search, ShieldCheck } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useBusinessData } from '../../hooks/useBusinessData.js'
import { formatDateTime, vehicleName } from '../../lib/formatters.js'

function PublicVehiclePage() {
  const { data } = useBusinessData()
  const [plate, setPlate] = useState('')
  const [code, setCode] = useState('')
  const [searchedPlate, setSearchedPlate] = useState('')
  const [searchedCode, setSearchedCode] = useState('')

  function submit(event) {
    event.preventDefault()
    const normalizedPlate = plate.trim().toUpperCase().replace(/\s+/g, '')
    const normalizedCode = code.trim()
    if (!/^\d{4}$/.test(normalizedCode)) {
      setSearchedPlate(normalizedPlate)
      setSearchedCode('')
      return
    }
    setSearchedPlate(normalizedPlate)
    setSearchedCode(normalizedCode)
  }

  const vehicle = searchedPlate && searchedCode ? data.vehicles.find((item) => item.plate.toUpperCase() === searchedPlate && item.consultationCode === searchedCode && item.active) : null
  const orders = vehicle ? data.orders.filter((order) => order.vehicleId === vehicle.id).sort((left, right) => right.createdAt.localeCompare(left.createdAt)) : []

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand"><CarFront size={25} /></span><h1 className="mt-5 text-2xl font-semibold text-foreground">Consulta de vehículo</h1><p className="mt-2 text-sm text-muted">Ingresa la placa y el código entregado al registrar el vehículo.</p></div>
      <form onSubmit={submit} className="rounded-xl border border-outline bg-surface p-4 sm:p-5"><div className="grid gap-3 sm:grid-cols-2"><TextField id="lookup-plate" label="Placa" placeholder="KLM482" value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} required maxLength={10} icon={<CarFront size={17} />} /><TextField id="lookup-code" label="Código de consulta" placeholder="8427" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 4))} required maxLength={4} inputMode="numeric" icon={<ShieldCheck size={17} />} /></div><Button type="submit" className="mt-3 min-h-11 w-full"><Search size={17} />Consultar</Button><p className="mt-3 flex items-center gap-2 text-xs text-muted"><ShieldCheck size={14} />La consulta es de solo lectura y solo muestra el vehículo asociado a ambos datos.</p></form>
      {searchedPlate && searchedCode && !vehicle && <div role="status" className="rounded-xl border border-outline bg-surface px-5 py-8 text-center"><p className="font-medium text-foreground">No encontramos un vehículo activo con esa placa y código.</p><p className="mt-1 text-sm text-muted">Verifica ambos datos e inténtalo de nuevo.</p></div>}
      {vehicle && <section className="overflow-hidden rounded-xl border border-outline bg-surface"><div className="border-b border-outline p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wider text-brand">Vehículo encontrado</p><h2 className="mt-2 text-lg font-semibold text-foreground">{vehicleName(vehicle)}</h2><p className="mt-1 text-sm text-muted">{vehicle.type} · {vehicle.color} · {vehicle.active ? 'Activo' : 'Inactivo'}</p><p className="mt-2 font-mono text-xs text-brand">{vehicle.consultationCode}</p></div><div className="p-4 sm:p-5"><h3 className="text-sm font-semibold text-foreground">Historial de este vehículo</h3>{orders.length === 0 ? <p className="mt-3 text-sm text-muted">Este vehículo todavía no tiene órdenes registradas.</p> : <ul className="mt-3 divide-y divide-outline">{orders.map((order) => { const service = data.services.find((item) => item.id === order.serviceId); return <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-foreground">{service?.name ?? 'Servicio'} · {order.number}</p><p className="mt-1 text-xs text-muted">{formatDateTime(order.createdAt)}</p></div><StatusBadge status={order.status} /></li> })}</ul>}</div></section>}
      <p className="text-center text-xs text-muted">{data.business.name} · {data.business.phone}</p>
    </div>
  )
}

export default PublicVehiclePage

