import { useState } from 'react'
import { AlertTriangle, Package, Pencil, Plus, Search } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/shared/Modal.jsx'
import MetricCard from '../../components/shared/MetricCard.jsx'
import StatusBadge from '../../components/shared/StatusBadge.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useBusinessData } from '../../hooks/useBusinessData.js'

const NEW_ITEM = { name: '', category: 'Químicos', unit: 'ml', stock: 0, minStock: 0, cost: 0, active: true }
const CATEGORIES = ['Químicos', 'Lavado', 'Protección', 'Accesorios', 'Otros']
const UNITS = ['ml', 'L', 'g', 'kg', 'unidades', 'rollos', 'pares']

function InventoryPage() {
  const { data, saveInventoryItem } = useBusinessData()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState(NEW_ITEM)
  const [feedback, setFeedback] = useState(null)
  const items = data.inventory.filter((item) => {
    const matchesQuery = `${item.name} ${item.category} ${item.sku ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesQuery && (statusFilter === 'all' || item.active === (statusFilter === 'active'))
  })
  const lowStock = data.inventory.filter((item) => item.active && item.stock <= item.minStock)

  function openForm(item = null) {
    setForm(item ? { ...item } : { ...NEW_ITEM })
    setDialog({ itemId: item?.id ?? null })
    setFeedback(null)
  }

  function submit(event) {
    event.preventDefault()
    try {
      saveInventoryItem(form, dialog.itemId)
      setDialog(null)
      setFeedback({ type: 'success', message: dialog.itemId ? 'Insumo actualizado.' : 'Insumo agregado al inventario.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function toggleActive(item) {
    try {
      saveInventoryItem({ ...item, active: !item.active }, item.id)
      setFeedback({ type: 'success', message: `${item.name}: estado actualizado.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">Consumibles y materiales del centro</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">Inventario de insumos</h2>
          <p className="mt-2 text-sm text-muted">El consumo de las recetas se descuenta al completar un servicio.</p>
        </div>
        <Button type="button" onClick={() => openForm()}><Plus size={17} />Agregar insumo</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Insumos activos" value={data.inventory.filter((item) => item.active).length} icon={Package} />
        <MetricCard label="Bajo mínimo" value={lowStock.length} icon={AlertTriangle} tone={lowStock.length ? 'amber' : 'green'} />
        <MetricCard label="Consumos aplicados" value={data.inventoryMovements.filter((movement) => movement.type === 'consumption').length} detail="Movimientos generados por órdenes" />
      </div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      <section className="overflow-hidden rounded-xl border border-outline bg-surface">
        <div className="flex flex-col gap-3 border-b border-outline p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar insumo o categoría" aria-label="Buscar insumos" className="h-10 w-full rounded-lg border border-outline bg-canvas pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-brand" />
          </div>
          <div className="w-full sm:w-44"><SelectField id="inventory-status" label="Estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></SelectField></div>
        </div>
        {items.length === 0 ? <div className="px-5 py-14 text-center"><Package className="mx-auto text-muted" /><h3 className="mt-3 font-medium text-foreground">{query || statusFilter !== 'all' ? 'No hay insumos con esos filtros' : 'No hay insumos registrados'}</h3><p className="mt-1 text-sm text-muted">{query || statusFilter !== 'all' ? 'Ajusta la búsqueda o el estado.' : 'Agrega materiales para configurar recetas de servicios.'}</p>{!query && statusFilter === 'all' && <Button type="button" onClick={() => openForm()} className="mt-5"><Plus size={16} />Agregar insumo</Button>}</div> : <ul className="divide-y divide-outline">
          {items.map((item) => {
            const isLow = item.active && item.stock <= item.minStock
            return <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{item.name}</p><StatusBadge status={item.active ? 'active' : 'inactive'} />{isLow && <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200"><AlertTriangle size={12} />Bajo mínimo</span>}</div><p className="mt-1 text-sm text-muted">{item.category}{item.sku ? ` · ${item.sku}` : ''}</p></div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end"><div className="min-w-28 text-left sm:text-right"><p className={`font-semibold ${isLow ? 'text-amber-200' : 'text-foreground'}`}>{Number(item.stock).toLocaleString('es-CO')} {item.unit}</p><p className="mt-0.5 text-xs text-muted">Mínimo {Number(item.minStock).toLocaleString('es-CO')} {item.unit}</p></div><Button type="button" variant="secondary" onClick={() => openForm(item)} aria-label={`Editar ${item.name}`} title="Editar insumo"><Pencil size={16} /></Button><Button type="button" variant="secondary" onClick={() => toggleActive(item)}>{item.active ? 'Desactivar' : 'Activar'}</Button></div>
            </li>
          })}
        </ul>}
      </section>
      {dialog && <Modal title={dialog.itemId ? 'Editar insumo' : 'Agregar insumo'} description="Define la unidad que se utilizará en las recetas de servicios." onClose={() => setDialog(null)}>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="item-name" name="name" label="Nombre" value={form.name} onChange={updateField} required maxLength={100} />
            <SelectField id="item-category" name="category" label="Categoría" value={form.category} onChange={updateField} required>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</SelectField>
            <SelectField id="item-unit" name="unit" label="Unidad" value={form.unit} onChange={updateField} required>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</SelectField>
            <TextField id="item-stock" name="stock" label="Stock actual" type="number" min="0" step="any" value={form.stock} onChange={updateField} required />
            <TextField id="item-min" name="minStock" label="Stock mínimo" type="number" min="0" step="any" value={form.minStock} onChange={updateField} required />
            <TextField id="item-sku" name="sku" label="Código interno (opcional)" value={form.sku ?? ''} onChange={updateField} maxLength={30} />
            {dialog.itemId && <SelectField id="item-active" label="Estado" value={String(form.active)} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField>}
          </div>
          <div className="flex justify-end gap-2 border-t border-outline pt-4"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit">Guardar insumo</Button></div>
        </form>
      </Modal>}
    </div>
  )
}

export default InventoryPage
