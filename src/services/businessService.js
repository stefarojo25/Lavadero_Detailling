import { localDateInput } from '../lib/formatters.js'

const STORAGE_KEY = 'lavadero-business-data-v1'
const BUSINESS_ID = 'business-demo-01'

function isoDate(offset = 0, hour = 10) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

function localDate(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return localDateInput(date)
}

function makeId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`
}

function makeConsultationCode(vehicles) {
  const existingCodes = new Set(vehicles.map((vehicle) => vehicle.consultationCode).filter(Boolean))
  let code
  do {
    const randomBytes = new Uint8Array(4)
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(randomBytes)
    else randomBytes.forEach((_, index) => { randomBytes[index] = Math.floor(Math.random() * 10) })
    code = Array.from(randomBytes, (byte) => String(byte % 10)).join('')
  } while (existingCodes.has(code))
  return code
}

function migrateVehicleCodes(vehicles, defaults) {
  const usedVehicles = []
  return vehicles.map((vehicle) => {
    const defaultCode = defaults.find((item) => item.id === vehicle.id)?.consultationCode
    const requestedCode = vehicle.consultationCode || defaultCode
    const consultationCode = /^\d{4}$/.test(requestedCode) && !usedVehicles.some((item) => item.consultationCode === requestedCode) ? requestedCode : makeConsultationCode(usedVehicles)
    const migratedVehicle = { ...vehicle, consultationCode }
    usedVehicles.push(migratedVehicle)
    return migratedVehicle
  })
}

function addActivity(data, type, description, referenceId = null) {
  return [{ id: makeId('activity'), type, description, referenceId, business_id: BUSINESS_ID, createdAt: new Date().toISOString() }, ...data.activity].slice(0, 80)
}

export function createInitialBusinessData() {
  const inventory = [
    { id: 'item-001', business_id: BUSINESS_ID, name: 'Shampoo Premium', category: 'Químicos', unit: 'ml', stock: 4900, minStock: 1000, cost: 32000, active: true },
    { id: 'item-002', business_id: BUSINESS_ID, name: 'Desengrasante', category: 'Químicos', unit: 'ml', stock: 1950, minStock: 500, cost: 18000, active: true },
    { id: 'item-003', business_id: BUSINESS_ID, name: 'Cera líquida', category: 'Protección', unit: 'ml', stock: 1980, minStock: 400, cost: 45000, active: true },
    { id: 'item-004', business_id: BUSINESS_ID, name: 'Paño de microfibra', category: 'Accesorios', unit: 'unidades', stock: 40, minStock: 10, cost: 9000, active: true },
  ]
  const services = [
    { id: 'service-wash', business_id: BUSINESS_ID, name: 'Lavado premium', category: 'Lavado', description: 'Lavado exterior con espuma activa y secado a mano.', price: 18000, durationMinutes: 45, recipe: [{ inventoryItemId: 'item-001', quantity: 100 }, { inventoryItemId: 'item-002', quantity: 50 }, { inventoryItemId: 'item-003', quantity: 20 }], active: true },
    { id: 'service-interior', business_id: BUSINESS_ID, name: 'Limpieza interior', category: 'Interior', description: 'Aspirado y limpieza detallada de superficies interiores.', price: 32000, durationMinutes: 90, recipe: [{ inventoryItemId: 'item-001', quantity: 60 }, { inventoryItemId: 'item-002', quantity: 80 }, { inventoryItemId: 'item-004', quantity: 1 }], active: true },
    { id: 'service-detail', business_id: BUSINESS_ID, name: 'Detailing completo', category: 'Detailing', description: 'Limpieza profunda y acabado interior y exterior.', price: 85000, durationMinutes: 240, recipe: [{ inventoryItemId: 'item-001', quantity: 200 }, { inventoryItemId: 'item-002', quantity: 120 }, { inventoryItemId: 'item-003', quantity: 80 }, { inventoryItemId: 'item-004', quantity: 2 }], active: true },
    { id: 'service-protection', business_id: BUSINESS_ID, name: 'Protección cerámica', category: 'Protección', description: 'Tratamiento de protección para pintura y acabados.', price: 145000, durationMinutes: 300, recipe: [{ inventoryItemId: 'item-003', quantity: 150 }, { inventoryItemId: 'item-004', quantity: 2 }], active: true },
  ]
  const clients = [
    { id: 'client-001', business_id: BUSINESS_ID, firstName: 'Lucía', lastName: 'Ramírez', phone: '300 456 7812', address: 'Carrera 12 #45-18', active: true, createdAt: isoDate(-48) },
    { id: 'client-002', business_id: BUSINESS_ID, firstName: 'Mateo', lastName: 'Gómez', phone: '310 223 9045', address: 'Calle 86 #14-20', active: true, createdAt: isoDate(-32) },
    { id: 'client-003', business_id: BUSINESS_ID, firstName: 'Valentina', lastName: 'Torres', phone: '315 670 2210', address: 'Avenida 7 #102-31', active: true, createdAt: isoDate(-14) },
  ]
  const vehicles = [
    { id: 'vehicle-001', business_id: BUSINESS_ID, clientId: 'client-001', plate: 'KLM482', type: 'Carro', brand: 'Mazda', model: 'CX-30', color: 'Gris', consultationCode: '8427', observations: '', active: true },
    { id: 'vehicle-002', business_id: BUSINESS_ID, clientId: 'client-001', plate: 'TRQ719', type: 'Moto', brand: 'Yamaha', model: 'MT-03', color: 'Azul', consultationCode: '5192', observations: '', active: true },
    { id: 'vehicle-003', business_id: BUSINESS_ID, clientId: 'client-002', plate: 'HJP305', type: 'Camioneta', brand: 'Toyota', model: 'Fortuner', color: 'Negro', consultationCode: '9364', observations: '', active: true },
    { id: 'vehicle-004', business_id: BUSINESS_ID, clientId: 'client-003', plate: 'NVS618', type: 'Carro', brand: 'Renault', model: 'Duster', color: 'Blanco', consultationCode: '4182', observations: '', active: true },
  ]
  const employees = [
    { id: 'employee-001', business_id: BUSINESS_ID, name: 'Andrés Molina', email: 'andres@lavadero.demo', role: 'employee', active: true, joinedAt: isoDate(-180) },
    { id: 'employee-002', business_id: BUSINESS_ID, name: 'Camila Rojas', email: 'camila@lavadero.demo', role: 'employee', active: true, joinedAt: isoDate(-120) },
  ]
  const completedAt = isoDate(0, 9)
  const orders = [
    { id: 'order-001', business_id: BUSINESS_ID, number: 'ORD-001', clientId: 'client-001', vehicleId: 'vehicle-001', serviceId: 'service-wash', employeeId: 'employee-001', price: 18000, status: 'COMPLETED', paymentMethod: 'cash', paymentStatus: 'CONFIRMED', paymentId: 'payment-001', recipeSnapshot: services[0].recipe, initialConditionNotes: '', initialConditionPhotos: [], inventoryConsumedAt: completedAt, createdAt: completedAt, startedAt: completedAt, completedAt },
    { id: 'order-002', business_id: BUSINESS_ID, number: 'ORD-002', clientId: 'client-002', vehicleId: 'vehicle-003', serviceId: 'service-interior', employeeId: 'employee-002', price: 32000, status: 'IN_PROGRESS', paymentMethod: null, paymentStatus: null, paymentId: null, recipeSnapshot: services[1].recipe, initialConditionNotes: '', initialConditionPhotos: [], inventoryConsumedAt: null, createdAt: isoDate(0, 10), startedAt: isoDate(0, 10), completedAt: null },
    { id: 'order-003', business_id: BUSINESS_ID, number: 'ORD-003', clientId: 'client-003', vehicleId: 'vehicle-004', serviceId: 'service-detail', employeeId: 'employee-001', price: 85000, status: 'PENDING', paymentMethod: null, paymentStatus: null, paymentId: null, recipeSnapshot: services[2].recipe, initialConditionNotes: '', initialConditionPhotos: [], inventoryConsumedAt: null, createdAt: isoDate(0, 11), startedAt: null, completedAt: null },
    { id: 'order-004', business_id: BUSINESS_ID, number: 'ORD-004', clientId: 'client-001', vehicleId: 'vehicle-002', serviceId: 'service-wash', employeeId: 'employee-002', price: 18000, status: 'CANCELLED', paymentMethod: null, paymentStatus: null, paymentId: null, recipeSnapshot: services[0].recipe, initialConditionNotes: '', initialConditionPhotos: [], inventoryConsumedAt: null, createdAt: isoDate(-1, 15), startedAt: null, completedAt: null },
  ]
  const payments = [{ id: 'payment-001', business_id: BUSINESS_ID, orderId: 'order-001', amount: 18000, method: 'cash', status: 'CONFIRMED', confirmedAt: completedAt, createdAt: completedAt }]
  return {
    business: { id: BUSINESS_ID, name: 'Lavadero Detailing', phone: '601 555 0180', email: 'hola@lavaderodetailing.co', address: 'Calle 82 #11-42, Bogotá', description: 'Centro especializado en lavado y detailing vehicular.', logoUrl: '', active: true, business_id: BUSINESS_ID },
    clients,
    vehicles,
    services,
    employees,
    orders,
    payments,
    manualTransactions: [],
    inventory,
    inventoryMovements: services[0].recipe.map((line) => ({ id: makeId('movement'), business_id: BUSINESS_ID, orderId: 'order-001', itemId: line.inventoryItemId, quantity: line.quantity, type: 'consumption', createdAt: completedAt })),
    appointments: [
      { id: 'appointment-001', business_id: BUSINESS_ID, clientId: 'client-001', vehicleId: 'vehicle-001', serviceId: 'service-wash', employeeId: 'employee-001', date: localDate(1), time: '08:00', status: 'SCHEDULED', orderId: null, createdAt: isoDate() },
      { id: 'appointment-002', business_id: BUSINESS_ID, clientId: 'client-002', vehicleId: 'vehicle-003', serviceId: 'service-detail', employeeId: 'employee-002', date: localDate(1), time: '10:00', status: 'SCHEDULED', orderId: null, createdAt: isoDate() },
    ],
    activity: [
      { id: 'activity-001', business_id: BUSINESS_ID, type: 'payment', description: 'Pago de ORD-001 registrado', referenceId: 'payment-001', createdAt: completedAt },
      { id: 'activity-002', business_id: BUSINESS_ID, type: 'order_completed', description: 'ORD-001 completada', referenceId: 'order-001', createdAt: completedAt },
      { id: 'activity-003', business_id: BUSINESS_ID, type: 'order_started', description: 'ORD-002 iniciada', referenceId: 'order-002', createdAt: isoDate(0, 10) },
      { id: 'activity-004', business_id: BUSINESS_ID, type: 'client_created', description: 'Cliente Valentina Torres registrado', referenceId: 'client-003', createdAt: isoDate(-14) },
    ],
    orderSequence: 5,
  }
}

export function loadBusinessData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (stored?.business?.business_id === BUSINESS_ID && Array.isArray(stored.orders) && Array.isArray(stored.clients)) {
      const defaults = createInitialBusinessData()
      return {
        ...defaults,
        ...stored,
        inventory: migrateInventoryItems(stored.inventory, defaults.inventory),
        clients: stored.clients.map((client) => Object.fromEntries(Object.entries(client).filter(([key]) => !['document', 'email'].includes(key)))),
        vehicles: migrateVehicleCodes(stored.vehicles ?? defaults.vehicles, defaults.vehicles),
        services: (stored.services ?? defaults.services).map((service) => ({ ...service, recipe: Array.isArray(service.recipe) ? service.recipe : defaults.services.find((item) => item.id === service.id)?.recipe ?? [] })),
        orders: stored.orders.map((order) => ({
          ...order,
          recipeSnapshot: Array.isArray(order.recipeSnapshot) ? order.recipeSnapshot : defaults.services.find((item) => item.id === order.serviceId)?.recipe ?? [],
          initialConditionNotes: order.initialConditionNotes?.trim() ?? '',
          initialConditionPhotos: Array.isArray(order.initialConditionPhotos) ? order.initialConditionPhotos : [],
          inventoryConsumedAt: order.inventoryConsumedAt ?? (order.status === 'COMPLETED' ? order.completedAt ?? null : null),
          paymentStatus: order.paymentStatus ?? (order.paymentId ? 'CONFIRMED' : order.status === 'COMPLETED' ? 'PENDING_CONFIRMATION' : null),
        })),
        payments: (stored.payments ?? defaults.payments).map((payment) => ({ status: 'CONFIRMED', confirmedAt: payment.createdAt, ...payment })),
        manualTransactions: Array.isArray(stored.manualTransactions) ? stored.manualTransactions : [],
        appointments: Array.isArray(stored.appointments) ? stored.appointments : defaults.appointments,
        inventoryMovements: Array.isArray(stored.inventoryMovements) ? stored.inventoryMovements : [],
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  return createInitialBusinessData()
}

export function persistBusinessData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetBusinessData() {
  localStorage.removeItem(STORAGE_KEY)
  return createInitialBusinessData()
}

function withActivity(data, nextData, type, description, referenceId) {
  return { ...nextData, activity: addActivity(data, type, description, referenceId) }
}

function requireValue(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') throw new Error(`${label} es obligatorio.`)
}

function requireAdmin(actor) {
  if (actor?.role !== 'admin') throw new Error('Esta acción requiere permisos de administrador.')
}

function requireStaff(actor) {
  if (!actor || !['admin', 'employee'].includes(actor.role)) throw new Error('No tienes permisos para realizar esta acción.')
}

function requireRole(actor, roles, action) {
  if (!actor || !roles.includes(actor.role)) throw new Error(`No tienes permisos para ${action}.`)
}

function requireEmployee(actor, employeeId) {
  if (actor?.role !== 'employee' || actor.employeeId !== employeeId) throw new Error('Solo puedes gestionar órdenes asignadas a tu cuenta.')
}

function requireUnique(items, field, value, label, excludeId) {
  if (items.some((item) => item.id !== excludeId && String(item[field] ?? '').toLowerCase() === String(value).toLowerCase())) throw new Error(`Ya existe ${label} con ese dato.`)
}

function migrateInventoryItems(items, defaults) {
  if (!Array.isArray(items)) return defaults
  const legacySeeds = { 'QUI-001': 'item-001', 'ACC-014': 'item-004', 'PRO-008': 'item-003' }
  if (!items.some((item) => !item.unit || item.category === 'General')) return items
  const oldSeeds = new Map(items.flatMap((item) => legacySeeds[item.sku] ? [[legacySeeds[item.sku], item]] : []))
  const migratedDefaults = defaults.map((item) => {
    const oldItem = oldSeeds.get(item.id)
    return oldItem ? { ...item, active: oldItem.active ?? item.active } : item
  })
  const customItems = items.filter((item) => !legacySeeds[item.sku]).map((item) => ({ ...item, category: item.category === 'General' ? 'Otros' : item.category ?? 'Otros', unit: item.unit ?? 'unidades' }))
  return [...migratedDefaults, ...customItems]
}

function splitClientName(values) {
  const completeName = String(values.fullName ?? [values.firstName, values.lastName].filter(Boolean).join(' ')).trim().replace(/\s+/g, ' ')
  const [firstName = '', ...lastNameParts] = completeName.split(' ')
  return { firstName, lastName: lastNameParts.join(' ') }
}

function buildVehicle(data, clientId, values, currentVehicle = null) {
  requireValue(clientId, 'El cliente')
  requireValue(values.plate, 'La placa')
  requireValue(values.type, 'El tipo de vehículo')
  requireValue(values.brand, 'La marca')
  requireValue(values.model, 'El modelo')
  if (!['Moto', 'Carro', 'Camioneta'].includes(values.type)) throw new Error('Selecciona Moto, Carro o Camioneta.')
  if (!data.clients.some((item) => item.id === clientId && item.active)) throw new Error('Selecciona un cliente activo.')
  const plate = values.plate.trim().toUpperCase()
  requireUnique(data.vehicles, 'plate', plate, 'un vehículo', currentVehicle?.id)
  return {
    ...values,
    id: currentVehicle?.id ?? makeId('vehicle'),
    business_id: BUSINESS_ID,
    clientId,
    plate,
    consultationCode: currentVehicle?.consultationCode ?? makeConsultationCode(data.vehicles),
    observations: values.observations?.trim() ?? currentVehicle?.observations ?? '',
    active: values.active ?? true,
  }
}

export function createClient(data, values, vehicleValues = [], actor) {
  requireStaff(actor)
  const name = splitClientName(values)
  requireValue(name.firstName, 'El nombre completo')
  requireValue(values.phone, 'El teléfono')
  const client = { ...name, phone: values.phone.trim(), address: values.address?.trim() ?? '', whatsapp: values.whatsapp?.trim() ?? '', observations: values.observations?.trim() ?? '', id: makeId('client'), business_id: BUSINESS_ID, active: values.active ?? true, createdAt: new Date().toISOString() }
  const createdVehicles = []
  for (const vehicleValuesItem of vehicleValues) {
    const currentData = { ...data, clients: [client, ...data.clients], vehicles: [...createdVehicles, ...data.vehicles] }
    createdVehicles.push(buildVehicle(currentData, client.id, vehicleValuesItem))
  }
  const nextData = withActivity(data, { ...data, clients: [client, ...data.clients], vehicles: [...createdVehicles, ...data.vehicles] }, 'client_created', `Cliente ${client.firstName} ${client.lastName}`.trim() + ' registrado', client.id)
  return createdVehicles.reduce((result, vehicle) => ({ ...result, activity: addActivity(result, 'vehicle_created', `Vehículo ${vehicle.plate} registrado`, vehicle.id) }), nextData)
}

export function updateClient(data, id, values, actor) {
  requireAdmin(actor)
  const current = data.clients.find((item) => item.id === id)
  if (!current) throw new Error('No se encontró el cliente.')
  const name = splitClientName(values)
  requireValue(name.firstName, 'El nombre completo')
  requireValue(values.phone, 'El teléfono')
  const update = { ...name, phone: values.phone.trim(), address: values.address?.trim() ?? '', whatsapp: values.whatsapp?.trim() ?? current.whatsapp ?? '', observations: values.observations?.trim() ?? current.observations ?? '', active: values.active ?? current.active }
  return { ...data, clients: data.clients.map((item) => item.id === id ? { ...item, ...update, business_id: BUSINESS_ID } : item) }
}

export function deleteClient(data, id, actor) {
  requireAdmin(actor)
  if (data.vehicles.some((item) => item.clientId === id) || data.orders.some((item) => item.clientId === id)) throw new Error('No se puede eliminar: el cliente tiene vehículos u órdenes asociados. Puedes desactivarlo.')
  return { ...data, clients: data.clients.filter((item) => item.id !== id) }
}

export function createVehicle(data, values, actor) {
  requireStaff(actor)
  const vehicle = buildVehicle(data, values.clientId, values)
  return withActivity(data, { ...data, vehicles: [vehicle, ...data.vehicles] }, 'vehicle_created', `Vehículo ${vehicle.plate} registrado`, vehicle.id)
}

export function updateVehicle(data, id, values, actor) {
  requireAdmin(actor)
  const current = data.vehicles.find((item) => item.id === id)
  if (!current) throw new Error('No se encontró el vehículo.')
  const vehicle = buildVehicle(data, values.clientId ?? current.clientId, values, current)
  return { ...data, vehicles: data.vehicles.map((item) => item.id === id ? vehicle : item) }
}

export function deleteVehicle(data, id, actor) {
  requireAdmin(actor)
  if (data.orders.some((item) => item.vehicleId === id)) throw new Error('No se puede eliminar: el vehículo tiene órdenes asociadas. Puedes desactivarlo.')
  return { ...data, vehicles: data.vehicles.filter((item) => item.id !== id) }
}

export function saveService(data, values, id, actor) {
  requireAdmin(actor)
  requireValue(values.name, 'El nombre')
  requireValue(values.category, 'La categoría')
  const price = Number(values.price)
  const durationMinutes = Number(values.durationMinutes)
  if (!Number.isFinite(price) || price < 0) throw new Error('El precio debe ser un número válido.')
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1) throw new Error('La duración debe ser mayor a cero.')
  if (id && !data.services.some((item) => item.id === id)) throw new Error('No se encontró el servicio.')
  const seenItems = new Set()
  const recipe = (values.recipe ?? []).filter((item) => item.inventoryItemId && item.quantity !== '' && item.quantity !== undefined).map((item) => {
    const inventoryItem = data.inventory.find((candidate) => candidate.id === item.inventoryItemId && candidate.active)
    const quantity = Number(item.quantity)
    if (!inventoryItem) throw new Error('La receta contiene un insumo inactivo o inexistente.')
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Indica una cantidad mayor a cero para ${inventoryItem.name}.`)
    if (seenItems.has(item.inventoryItemId)) throw new Error(`El insumo ${inventoryItem.name} ya está en la receta.`)
    seenItems.add(item.inventoryItemId)
    return { inventoryItemId: item.inventoryItemId, quantity }
  })
  const service = { ...values, id: id ?? makeId('service'), business_id: BUSINESS_ID, price, durationMinutes, recipe, active: Boolean(values.active) }
  if (id) return { ...data, services: data.services.map((item) => item.id === id ? service : item) }
  return { ...data, services: [service, ...data.services] }
}

export function saveEmployee(data, values, id, actor) {
  requireAdmin(actor)
  requireValue(values.name, 'El nombre')
  requireValue(values.email, 'El correo')
  requireUnique(data.employees, 'email', values.email, 'un empleado', id)
  const employee = { ...values, id: id ?? makeId('employee'), business_id: BUSINESS_ID, role: 'employee', active: Boolean(values.active), joinedAt: values.joinedAt || new Date().toISOString() }
  if (id) return { ...data, employees: data.employees.map((item) => item.id === id ? employee : item) }
  return { ...data, employees: [employee, ...data.employees] }
}

function validateAppointment(data, values, excludedId = null) {
  const { clientId, vehicleId, serviceId, employeeId, date, time } = values
  for (const [value, label] of [[clientId, 'El cliente'], [vehicleId, 'El vehículo'], [serviceId, 'El servicio'], [employeeId, 'El trabajador'], [date, 'La fecha'], [time, 'La hora']]) requireValue(value, label)
  const client = data.clients.find((item) => item.id === clientId && item.active)
  const vehicle = data.vehicles.find((item) => item.id === vehicleId && item.clientId === clientId && item.active)
  const service = data.services.find((item) => item.id === serviceId && item.active)
  const employee = data.employees.find((item) => item.id === employeeId && item.active)
  if (!client || !vehicle || !service || !employee) throw new Error('Verifica que cliente, vehículo, servicio y trabajador estén activos y relacionados.')
  const start = new Date(`${date}T${time}:00`)
  if (Number.isNaN(start.getTime())) throw new Error('La fecha u hora de la cita no es válida.')
  if (start.getTime() < Date.now()) throw new Error('La cita debe programarse para una hora futura.')
  const end = start.getTime() + service.durationMinutes * 60_000
  const overlaps = data.appointments.some((appointment) => {
    if (appointment.id === excludedId || appointment.employeeId !== employeeId || appointment.date !== date || appointment.status !== 'SCHEDULED') return false
    const otherStart = new Date(`${appointment.date}T${appointment.time}:00`).getTime()
    const otherService = data.services.find((item) => item.id === appointment.serviceId)
    const otherEnd = otherStart + (otherService?.durationMinutes ?? 0) * 60_000
    return start.getTime() < otherEnd && end > otherStart
  })
  if (overlaps) throw new Error('Ese trabajador ya tiene una cita durante ese horario.')
  return { client, vehicle, service, employee }
}

export function createAppointment(data, values, actor) {
  requireAdmin(actor)
  const { client, vehicle, service, employee } = validateAppointment(data, values)
  const appointment = { ...values, id: makeId('appointment'), business_id: BUSINESS_ID, status: 'SCHEDULED', orderId: null, createdAt: new Date().toISOString() }
  const nextData = { ...data, appointments: [appointment, ...data.appointments] }
  return withActivity(data, nextData, 'appointment_created', `Cita ${appointment.date} ${appointment.time} · ${client.firstName} ${client.lastName} · ${vehicle.plate} · ${service.name} · ${employee.name}`, appointment.id)
}

export function updateAppointment(data, id, values, actor) {
  requireAdmin(actor)
  const appointment = data.appointments.find((item) => item.id === id)
  if (!appointment || appointment.status !== 'SCHEDULED') throw new Error('Solo se pueden editar citas programadas.')
  const relations = validateAppointment(data, values, id)
  return withActivity(data, { ...data, appointments: data.appointments.map((item) => item.id === id ? { ...item, ...values, business_id: BUSINESS_ID } : item) }, 'appointment_updated', `Cita reprogramada para ${values.date} ${values.time} · ${relations.employee.name}`, id)
}

export function cancelAppointment(data, id, actor) {
  requireAdmin(actor)
  const appointment = data.appointments.find((item) => item.id === id)
  if (!appointment || appointment.status !== 'SCHEDULED') throw new Error('Esta cita ya no se puede cancelar.')
  return withActivity(data, { ...data, appointments: data.appointments.map((item) => item.id === id ? { ...item, status: 'CANCELLED' } : item) }, 'appointment_cancelled', `Cita del ${appointment.date} ${appointment.time} cancelada`, id)
}

export function createOrder(data, values, actor) {
  requireRole(actor, ['admin', 'employee'], 'crear órdenes')
  const { clientId, vehicleId, serviceId, employeeId, appointmentId, paymentMethod, date } = values
  for (const [value, label] of [[clientId, 'El cliente'], [vehicleId, 'El vehículo'], [serviceId, 'El servicio'], [employeeId, 'El trabajador'], [date, 'La fecha']]) requireValue(value, label)
  const client = data.clients.find((item) => item.id === clientId && item.active)
  const vehicle = data.vehicles.find((item) => item.id === vehicleId && item.clientId === clientId && item.active)
  const service = data.services.find((item) => item.id === serviceId && item.active)
  const employee = data.employees.find((item) => item.id === employeeId && item.active)
  if (!client || !vehicle || !service || !employee) throw new Error('Verifica que cliente, vehículo, servicio y trabajador estén activos y ligados.')
  if (actor.role === 'employee') requireEmployee(actor, employeeId)
  const price = actor.role === 'admin' && values.price !== undefined && values.price !== '' ? Number(values.price) : service.price
  if (!Number.isFinite(price) || price < 0) throw new Error('El precio de la orden no es válido.')
  if (paymentMethod !== undefined && paymentMethod !== null && !['cash', 'transfer'].includes(paymentMethod)) throw new Error('El método de pago debe ser Efectivo o Transferencia.')
  const createdAt = new Date(`${date}T00:00:00`).toISOString()
  if (Number.isNaN(new Date(createdAt).getTime())) throw new Error('La fecha de la orden no es válida.')
  const initialConditionNotes = String(values.initialConditionNotes ?? '').trim()
  const initialConditionPhotos = Array.isArray(values.initialConditionPhotos) ? values.initialConditionPhotos.map((photo) => ({ ...photo, id: photo.id ?? makeId('photo'), capturedAt: photo.capturedAt ?? new Date().toISOString(), description: photo.description?.trim() ?? '', position: photo.position?.trim() ?? '' })) : []
  const sequence = data.orderSequence ?? data.orders.length + 1
  const paymentStatus = paymentMethod ? 'PENDING_CONFIRMATION' : null
  const order = { id: makeId('order'), business_id: BUSINESS_ID, number: `ORD-${String(sequence).padStart(3, '0')}`, clientId, vehicleId, serviceId, employeeId, appointmentId: appointmentId ?? null, price, status: 'PENDING', paymentMethod: paymentMethod ?? null, paymentStatus, paymentId: null, recipeSnapshot: service.recipe.map((item) => ({ ...item })), initialConditionNotes, initialConditionPhotos, inventoryConsumedAt: null, createdAt, startedAt: null, completedAt: null }
  return { ...withActivity(data, { ...data, orders: [order, ...data.orders], orderSequence: sequence + 1 }, 'order_created', `${order.number} creada para ${client.firstName} ${client.lastName}`, order.id) }
}

export function updateOrder(data, id, values, actor) {
  requireAdmin(actor)
  const order = data.orders.find((item) => item.id === id)
  if (!order || ['COMPLETED', 'CANCELLED'].includes(order.status)) throw new Error('Solo se puede corregir una orden pendiente o en proceso.')
  const allowedFields = ['clientId', 'vehicleId', 'serviceId', 'employeeId', 'price', 'initialConditionNotes', 'initialConditionPhotos']
  const updatedValues = Object.fromEntries(Object.entries(values).filter(([key]) => allowedFields.includes(key)))
  const nextOrder = { ...order, ...updatedValues, price: updatedValues.price === undefined ? order.price : Number(updatedValues.price) }
  if (!Number.isFinite(nextOrder.price) || nextOrder.price < 0) throw new Error('El precio de la orden no es válido.')
  return withActivity(data, { ...data, orders: data.orders.map((item) => item.id === id ? nextOrder : item) }, 'order_updated', `${order.number} corregida`, id)
}

export function deleteOrder(data, id, actor) {
  requireAdmin(actor)
  const order = data.orders.find((item) => item.id === id)
  if (!order) throw new Error('No se encontró la orden.')
  if (order.paymentId || order.paymentStatus === 'CONFIRMED') throw new Error('No se puede eliminar una orden con pago confirmado.')
  if (order.inventoryConsumedAt) {
    const restoredInventory = order.recipeSnapshot.map((line) => {
      const item = data.inventory.find((candidate) => candidate.id === line.inventoryItemId)
      return item ? { ...item, stock: item.stock + line.quantity } : item
    }).filter(Boolean)
    const inventory = data.inventory.map((item) => {
      const restoration = restoredInventory.find((candidate) => candidate.id === item.id)
      return restoration ? { ...item, stock: restoration.stock } : item
    })
    const inventoryMovements = data.inventoryMovements.filter((movement) => movement.orderId !== id)
    const nextData = { ...data, inventory, inventoryMovements, orders: data.orders.filter((item) => item.id !== id) }
    return withActivity(nextData, nextData, 'order_deleted', `${order.number} eliminada`, id)
  }
  return withActivity(data, { ...data, orders: data.orders.filter((item) => item.id !== id) }, 'order_deleted', `${order.number} eliminada`, id)
}

export function createOrderFromAppointment(data, appointmentId, actor) {
  requireRole(actor, ['admin', 'employee'], 'convertir citas en órdenes')
  const appointment = data.appointments.find((item) => item.id === appointmentId && item.status === 'SCHEDULED')
  if (!appointment) throw new Error('La cita ya fue convertida o cancelada.')
  if (new Date(`${appointment.date}T${appointment.time}:00`).getTime() > Date.now()) throw new Error('La cita todavía no llega a su hora programada.')
  if (actor.role === 'employee' && appointment.employeeId !== actor.employeeId) throw new Error('Solo puedes convertir citas asignadas a tu cuenta.')
  const service = data.services.find((item) => item.id === appointment.serviceId)
  const created = createOrder(data, { ...appointment, appointmentId, price: service?.price }, actor)
  const order = created.orders[0]
  return withActivity(created, { ...created, appointments: created.appointments.map((item) => item.id === appointmentId ? { ...item, status: 'CONVERTED', orderId: order.id } : item) }, 'appointment_converted', `${appointment.date} ${appointment.time} convertida en ${order.number}`, appointmentId)
}

export function transitionOrder(data, id, status, actor) {
  const order = data.orders.find((item) => item.id === id)
  if (!order) throw new Error('No se encontró la orden.')
  if (actor?.role === 'employee' && (!actor.employeeId || order.employeeId !== actor.employeeId)) throw new Error('Solo puedes actualizar órdenes asignadas a ti.')
  if (!['admin', 'employee'].includes(actor?.role)) throw new Error('No tienes permisos para actualizar órdenes.')
  const transitions = { PENDING: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] }
  if (!transitions[order.status]?.includes(status)) throw new Error(`No se permite cambiar de ${order.status} a ${status}.`)
  const timestamp = new Date().toISOString()
  let inventory = data.inventory
  let inventoryMovements = data.inventoryMovements
  if (status === 'COMPLETED' && !order.inventoryConsumedAt) {
    const recipe = order.recipeSnapshot ?? data.services.find((item) => item.id === order.serviceId)?.recipe ?? []
    const requirements = recipe.map((line) => ({ line, item: inventory.find((entry) => entry.id === line.inventoryItemId) }))
    const shortage = requirements.find(({ line, item }) => !item || !item.active || item.stock < line.quantity)
    if (shortage) {
      const name = shortage.item?.name ?? 'Insumo eliminado'
      const unit = shortage.item?.unit ?? 'unidades'
      const available = shortage.item?.stock ?? 0
      throw new Error(`Stock insuficiente de ${name} para completar este servicio. Necesario: ${shortage.line.quantity} ${unit}; disponible: ${available} ${unit}.`)
    }
    inventory = data.inventory.map((item) => {
      const consumption = requirements.find(({ line }) => line.inventoryItemId === item.id)
      return consumption ? { ...item, stock: item.stock - consumption.line.quantity } : item
    })
    inventoryMovements = [...inventoryMovements, ...requirements.map(({ line }) => ({ id: makeId('movement'), business_id: BUSINESS_ID, orderId: order.id, itemId: line.inventoryItemId, quantity: line.quantity, type: 'consumption', createdAt: timestamp }))]
  }
  const updated = { ...order, status, ...(status === 'IN_PROGRESS' ? { startedAt: timestamp } : {}), ...(status === 'COMPLETED' ? { completedAt: timestamp, inventoryConsumedAt: timestamp, paymentStatus: 'AWAITING_METHOD' } : {}) }
  const nextData = { ...data, inventory, inventoryMovements, orders: data.orders.map((item) => item.id === id ? updated : item) }
  const client = data.clients.find((item) => item.id === order.clientId)
  const label = status === 'IN_PROGRESS' ? 'iniciada' : status === 'COMPLETED' ? 'completada' : 'cancelada'
  return withActivity(data, nextData, status === 'IN_PROGRESS' ? 'order_started' : status === 'COMPLETED' ? 'order_completed' : 'order_cancelled', `${order.number} ${label}${client ? ` · ${client.firstName} ${client.lastName}` : ''}`, id)
}

export function declarePaymentMethod(data, orderId, method, actor) {
  const order = data.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'COMPLETED') throw new Error('Solo se pueden registrar pagos de órdenes completadas.')
  if (actor?.role === 'employee' && (!actor.employeeId || order.employeeId !== actor.employeeId)) throw new Error('Solo puedes declarar pagos de órdenes asignadas a ti.')
  if (!['admin', 'employee'].includes(actor?.role)) throw new Error('No tienes permisos para declarar pagos.')
  if (order.paymentStatus === 'CONFIRMED' || order.paymentId || data.payments.some((item) => item.orderId === orderId)) throw new Error('Esta orden ya tiene un pago confirmado.')
  if (!['cash', 'transfer'].includes(method)) throw new Error('Selecciona efectivo o transferencia.')
  return withActivity(data, { ...data, orders: data.orders.map((item) => item.id === orderId ? { ...item, paymentMethod: method, paymentStatus: 'PENDING_CONFIRMATION' } : item) }, 'payment_declared', `${order.number}: método de pago indicado (${method === 'cash' ? 'efectivo' : 'transferencia'}), pendiente de confirmación`, orderId)
}

export function confirmPayment(data, orderId, actor) {
  requireAdmin(actor)
  const order = data.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'COMPLETED') throw new Error('Solo se pueden confirmar pagos de órdenes completadas.')
  if (order.paymentStatus !== 'PENDING_CONFIRMATION' || !['cash', 'transfer'].includes(order.paymentMethod)) throw new Error('La orden aún no tiene un método de pago declarado pendiente de confirmación.')
  if (order.paymentId || data.payments.some((item) => item.orderId === orderId)) throw new Error('Esta orden ya tiene un pago confirmado.')
  const timestamp = new Date().toISOString()
  const payment = { id: makeId('payment'), business_id: BUSINESS_ID, orderId, amount: order.price, method: order.paymentMethod, status: 'CONFIRMED', confirmedAt: timestamp, createdAt: timestamp }
  const nextData = { ...data, payments: [payment, ...data.payments], orders: data.orders.map((item) => item.id === orderId ? { ...item, paymentId: payment.id, paymentStatus: 'CONFIRMED' } : item) }
  return withActivity(data, nextData, 'payment', `Pago de ${order.number} confirmado`, payment.id)
}

export function saveInventoryItem(data, values, id, actor) {
  requireAdmin(actor)
  requireValue(values.name, 'El nombre')
  requireValue(values.category, 'La categoría')
  requireValue(values.unit, 'La unidad')
  if (values.sku?.trim()) requireUnique(data.inventory, 'sku', values.sku.trim(), 'un insumo', id)
  const stock = Number(values.stock)
  const minStock = Number(values.minStock)
  const cost = Number(values.cost)
  if ([stock, minStock, cost].some((value) => !Number.isFinite(value) || value < 0)) throw new Error('Stock, mínimo y costo deben ser números iguales o mayores a cero.')
  const item = { ...values, id: id ?? makeId('item'), business_id: BUSINESS_ID, stock, minStock, cost, active: Boolean(values.active) }
  if (id) return { ...data, inventory: data.inventory.map((current) => current.id === id ? item : current) }
  return { ...data, inventory: [item, ...data.inventory] }
}

export function updateBusiness(data, values, actor) {
  requireAdmin(actor)
  requireValue(values.name, 'El nombre del negocio')
  return { ...data, business: { ...data.business, ...values, id: BUSINESS_ID, business_id: BUSINESS_ID } }
}

export function getDashboardMetrics(data, date = new Date()) {
  const today = localDateInput(date)
  const todayOrders = data.orders.filter((order) => localDateInput(order.createdAt) === today)
  const todayPayments = data.payments.filter((payment) => localDateInput(payment.createdAt) === today)
  const attendedClientIds = new Set(todayOrders.filter((order) => order.status !== 'CANCELLED').map((order) => order.clientId))
  const attendedVehicleIds = new Set(todayOrders.filter((order) => order.status !== 'CANCELLED').map((order) => order.vehicleId))
  return {
    todayServices: { total: todayOrders.length, pending: todayOrders.filter((item) => item.status === 'PENDING').length, inProgress: todayOrders.filter((item) => item.status === 'IN_PROGRESS').length, completed: todayOrders.filter((item) => item.status === 'COMPLETED').length },
    todayAppointments: data.appointments.filter((item) => item.date === today && item.status === 'SCHEDULED').length,
    todayRevenue: todayPayments.reduce((sum, item) => sum + item.amount, 0),
    todayPaymentCount: todayPayments.length,
    clients: data.clients.length,
    clientsAttended: attendedClientIds.size,
    vehicles: data.vehicles.length,
    vehiclesAttended: attendedVehicleIds.size,
    orders: { pending: data.orders.filter((item) => item.status === 'PENDING').length, inProgress: data.orders.filter((item) => item.status === 'IN_PROGRESS').length, completed: data.orders.filter((item) => item.status === 'COMPLETED').length, cancelled: data.orders.filter((item) => item.status === 'CANCELLED').length },
  }
}

export function getOrderRelations(data, order) {
  return { client: data.clients.find((item) => item.id === order.clientId), vehicle: data.vehicles.find((item) => item.id === order.vehicleId), service: data.services.find((item) => item.id === order.serviceId), employee: data.employees.find((item) => item.id === order.employeeId), payment: data.payments.find((item) => item.id === order.paymentId) }
}

export function businessId() {
  return BUSINESS_ID
}

export function employeeIdByEmail(email) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  return loadBusinessData().employees.find((employee) => employee.active && employee.email.toLowerCase() === normalizedEmail)?.id ?? null
}

const CASH_CATEGORIES = ['Venta/ingreso adicional', 'Compra de insumos', 'Compra de productos', 'Gastos operativos', 'Mantenimiento', 'Inversión', 'Transporte', 'Otros']

export function createManualCashMovement(data, values, actor) {
  requireAdmin(actor)
  requireValue(values.type, 'El tipo de movimiento')
  requireValue(values.category, 'La categoría')
  requireValue(values.description, 'El concepto')
  requireValue(values.paymentMethod, 'El método de pago')
  requireValue(values.date, 'La fecha')
  const amount = Number(values.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('El valor debe ser mayor que cero.')
  if (!['income', 'expense'].includes(values.type)) throw new Error('Selecciona ingreso o egreso.')
  if (!CASH_CATEGORIES.includes(values.category)) throw new Error('Selecciona una categoría válida.')
  if (!['cash', 'transfer'].includes(values.paymentMethod)) throw new Error('Selecciona efectivo o transferencia.')
  if (Number.isNaN(new Date(`${values.date}T12:00:00`).getTime())) throw new Error('La fecha no es válida.')
  const timestamp = new Date().toISOString()
  const transaction = { id: makeId('cash'), business_id: BUSINESS_ID, type: values.type, category: values.category, description: values.description.trim(), amount, paymentMethod: values.paymentMethod, date: values.date, notes: values.notes?.trim() ?? '', source: 'manual', createdBy: actor.email ?? actor.name, createdAt: timestamp }
  const nextData = { ...data, manualTransactions: [transaction, ...(data.manualTransactions ?? [])] }
  return withActivity(data, nextData, 'cash_movement', `Movimiento manual: ${transaction.description}`, transaction.id)
}
