const currencyFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', year: 'numeric' })
const businessDateTimeFormatter = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const commercialTimeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export function isValidCommercialDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
  if (!match) return false
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0)
}

export function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : 'Sin fecha'
}

export function formatDateTime(value) {
  return formatCommercialDateTime(value)
}

export function localDateInput(value = new Date()) {
  return commercialDateInput(value)
}

export function commercialDateInput(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return isValidCommercialDate(value) ? value : ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]))
  return `${fields.year}-${fields.month}-${fields.day}`
}

export function addCommercialDays(value, amount) {
  if (!isValidCommercialDate(value) || !Number.isFinite(Number(amount))) return ''
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + Math.trunc(Number(amount))))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function commercialDateTimeTimestamp(date, time = '00:00') {
  if (!isValidCommercialDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(time))) return Number.NaN
  return Date.parse(`${date}T${time}:00-05:00`)
}

export function commercialTimeInput(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : commercialTimeFormatter.format(date)
}

export function commercialDateRange(days, currentDate = new Date()) {
  const endDate = commercialDateInput(currentDate)
  const [year, month, day] = endDate.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day - Math.max(1, Number(days) || 1) + 1))
  const startDate = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`
  return { startDate, endDate }
}

export function formatCommercialDateTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Sin fecha'
  return businessDateTimeFormatter.format(new Date(value))
}

export function fullName(client) {
  return [client?.firstName, client?.lastName].filter(Boolean).join(' ') || 'Cliente sin nombre'
}

export function vehicleName(vehicle) {
  if (!vehicle) return 'Vehículo no disponible'
  return `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`
}
