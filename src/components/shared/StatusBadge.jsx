const STATUS = {
  PENDING: ['Pendiente', 'border-amber-400/20 bg-amber-400/10 text-amber-200'],
  IN_PROGRESS: ['En proceso', 'border-sky-400/20 bg-sky-400/10 text-sky-200'],
  COMPLETED: ['Completada', 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'],
  CANCELLED: ['Cancelada', 'border-red-400/20 bg-red-400/10 text-red-200'],
  SCHEDULED: ['Programada', 'border-sky-400/20 bg-sky-400/10 text-sky-200'],
  CONVERTED: ['Convertida en orden', 'border-brand/20 bg-brand/10 text-brand'],
  AWAITING_METHOD: ['Método pendiente', 'border-amber-400/20 bg-amber-400/10 text-amber-200'],
  PENDING_CONFIRMATION: ['Pendiente de confirmación', 'border-amber-400/20 bg-amber-400/10 text-amber-200'],
  CONFIRMED: ['Pagado', 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'],
  active: ['Activo', 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'],
  inactive: ['Inactivo', 'border-outline bg-surface-secondary text-muted'],
}

function StatusBadge({ status }) {
  const [label, tone] = STATUS[status] ?? [status, 'border-outline bg-surface-secondary text-muted']
  return <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>{label}</span>
}

export default StatusBadge