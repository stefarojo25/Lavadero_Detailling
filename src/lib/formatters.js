const currencyFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

export function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : 'Sin fecha'
}

export function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : 'Sin fecha'
}

export function localDateInput(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function fullName(client) {
  return [client?.firstName, client?.lastName].filter(Boolean).join(' ') || 'Cliente sin nombre'
}

export function vehicleName(vehicle) {
  if (!vehicle) return 'Vehículo no disponible'
  return `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`
}