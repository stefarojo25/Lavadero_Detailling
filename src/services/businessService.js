import { addCommercialDays, commercialDateInput, commercialDateTimeTimestamp, isValidCommercialDate, localDateInput } from '../lib/formatters.js'
import { normalizePlate } from '../lib/search.js'
import { resolveActivePrincipal } from '../features/auth/accessControl.js'
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE } from './photoStorage.js'

const STORAGE_KEY = 'lavadero-business-data-v1'
const BUSINESS_ID = 'business-demo-01'
const BUSINESS_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function defaultBusinessHours() {
  return Object.fromEntries(BUSINESS_DAYS.map((day) => [day, { open: false, openTime: '08:00', closeTime: '18:00' }]))
}

function isoDate(offset = 0, hour = 10) {
  const date = localDate(offset)
  const timestamp = commercialDateTimeTimestamp(date, `${String(hour).padStart(2, '0')}:00`)
  return Number.isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp).toISOString()
}

function localDate(offset = 0) {
  return addCommercialDays(commercialDateInput(), offset)
}

function makeId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`
}

function makeOrderConsultationCode(orders, businessId) {
  const existingCodes = new Set(orders
    .filter((order) => order.business_id === businessId && order.status !== 'CANCELLED')
    .map((order) => order.consultationCode)
    .filter((code) => /^\d{4}$/.test(String(code ?? ''))))
  if (existingCodes.size >= 10000) throw new Error('No hay códigos de consulta disponibles para nuevas órdenes.')

  let code
  do {
    if (globalThis.crypto?.getRandomValues) {
      const randomValues = new Uint16Array(1)
      do globalThis.crypto.getRandomValues(randomValues)
      while (randomValues[0] >= 60000)
      code = String(randomValues[0] % 10000).padStart(4, '0')
    } else {
      code = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    }
  } while (existingCodes.has(code))
  return code
}

function removeLegacyVehicleCodes(vehicles) {
  return vehicles.map((vehicle) => {
    const cleanedVehicle = { ...vehicle }
    delete cleanedVehicle.consultationCode
    return cleanedVehicle
  })
}

function migrateLegacyVehicleCodesToOrders(orders, vehicles, businessId) {
  const migratedOrders = orders.map((order) => ({ ...order }))
  const usedCodes = new Set(migratedOrders
    .filter((order) => order.business_id === businessId && order.status !== 'CANCELLED')
    .map((order) => order.consultationCode)
    .filter((code) => /^\d{4}$/.test(String(code ?? ''))))

  for (const vehicle of vehicles) {
    const legacyCode = String(vehicle.consultationCode ?? '')
    if (!/^\d{4}$/.test(legacyCode) || usedCodes.has(legacyCode)) continue
    const vehicleBusinessId = vehicle.business_id ?? businessId
    if (vehicleBusinessId !== businessId) continue
    const targetOrder = migratedOrders
      .filter((order) => order.business_id === businessId && order.vehicleId === vehicle.id && order.status !== 'CANCELLED' && !/^\d{4}$/.test(String(order.consultationCode ?? '')))
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))[0]
    if (!targetOrder) continue
    targetOrder.consultationCode = legacyCode
    usedCodes.add(legacyCode)
  }
  return migratedOrders
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
    { id: 'vehicle-001', business_id: BUSINESS_ID, clientId: 'client-001', plate: 'KLM482', type: 'Carro', brand: 'Mazda', model: 'CX-30', color: 'Gris', observations: '', active: true },
    { id: 'vehicle-002', business_id: BUSINESS_ID, clientId: 'client-001', plate: 'TRQ719', type: 'Moto', brand: 'Yamaha', model: 'MT-03', color: 'Azul', observations: '', active: true },
    { id: 'vehicle-003', business_id: BUSINESS_ID, clientId: 'client-002', plate: 'HJP305', type: 'Camioneta', brand: 'Toyota', model: 'Fortuner', color: 'Negro', observations: '', active: true },
    { id: 'vehicle-004', business_id: BUSINESS_ID, clientId: 'client-003', plate: 'NVS618', type: 'Carro', brand: 'Renault', model: 'Duster', color: 'Blanco', observations: '', active: true },
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
    business: { id: BUSINESS_ID, name: 'Lavadero Detailing', phone: '601 555 0180', whatsapp: '', email: 'hola@lavaderodetailing.co', address: 'Calle 82 #11-42, Bogotá', description: 'Centro especializado en lavado y detailing vehicular.', socials: { instagram: '', facebook: '', tiktok: '' }, hours: defaultBusinessHours(), logoUrl: '', active: true, business_id: BUSINESS_ID },
    clients,
    vehicles,
    services,
    employees,
    orders,
    payments,
    manualTransactions: [],
    inventory,
    inventoryMovements: services[0].recipe.map((line) => ({ id: makeId('movement'), business_id: BUSINESS_ID, orderId: 'order-001', itemId: line.inventoryItemId, quantity: line.quantity, type: 'consumption', createdAt: completedAt })),
    photos: [],
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
        business: {
          ...defaults.business,
          ...stored.business,
          id: BUSINESS_ID,
          business_id: BUSINESS_ID,
          socials: { ...defaults.business.socials, ...(stored.business?.socials ?? {}) },
          hours: Object.fromEntries(BUSINESS_DAYS.map((day) => [day, { ...defaults.business.hours[day], ...(stored.business?.hours?.[day] ?? {}) }])),
        },
        inventory: migrateInventoryItems(stored.inventory, defaults.inventory),
        clients: stored.clients.map((client) => Object.fromEntries(Object.entries(client).filter(([key]) => !['document', 'email'].includes(key)))),
        vehicles: removeLegacyVehicleCodes(stored.vehicles ?? defaults.vehicles),
        services: (stored.services ?? defaults.services).map((service) => ({ ...service, recipe: Array.isArray(service.recipe) ? service.recipe : defaults.services.find((item) => item.id === service.id)?.recipe ?? [] })),
        orders: migrateLegacyVehicleCodesToOrders(stored.orders.map((order) => ({
          ...order,
          recipeSnapshot: Array.isArray(order.recipeSnapshot) ? order.recipeSnapshot : defaults.services.find((item) => item.id === order.serviceId)?.recipe ?? [],
          initialConditionNotes: order.initialConditionNotes?.trim() ?? '',
          initialConditionPhotos: [],
          inventoryConsumedAt: order.inventoryConsumedAt ?? (order.status === 'COMPLETED' ? order.completedAt ?? null : null),
          paymentStatus: order.paymentStatus ?? (order.paymentId ? 'CONFIRMED' : order.status === 'COMPLETED' ? 'PENDING_CONFIRMATION' : null),
        })), stored.vehicles ?? defaults.vehicles, BUSINESS_ID),
        payments: (stored.payments ?? defaults.payments).map((payment) => ({ status: 'CONFIRMED', confirmedAt: payment.createdAt, ...payment })),
        manualTransactions: Array.isArray(stored.manualTransactions) ? stored.manualTransactions : [],
        appointments: Array.isArray(stored.appointments) ? stored.appointments : defaults.appointments,
        inventoryMovements: Array.isArray(stored.inventoryMovements) ? stored.inventoryMovements : [],
        photos: Array.isArray(stored.photos) ? stored.photos.filter((photo) => photo?.business_id === BUSINESS_ID && photo?.storageKey === photo?.id && photo?.url === null) : [],
        // Older releases saved only preview metadata with url:null. Since the file
        // itself was never persisted, those entries are intentionally not exposed as saved photos.
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

function requireAdmin(data, actor) {
  if (!resolveActivePrincipal(data, actor)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
  if (actor.role !== 'admin') throw new Error('Esta acción requiere permisos de administrador.')
}

function requireStaff(data, actor) {
  if (!resolveActivePrincipal(data, actor)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
}

function requireRole(data, actor, roles, action) {
  if (!resolveActivePrincipal(data, actor)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
  if (!roles.includes(actor.role)) throw new Error(`No tienes permisos para ${action}.`)
}

function requireEmployee(actor, employeeId) {
  if (actor?.role !== 'employee' || actor.employeeId !== employeeId) throw new Error('Solo puedes gestionar órdenes asignadas a tu cuenta.')
}

function assertPhotoRelation(data, { vehicleId, orderId = null }, actor) {
  requireRole(data, actor, ['admin', 'employee'], 'gestionar fotografías')
  const businessId = data.business.business_id
  const vehicle = data.vehicles.find((item) => item.id === vehicleId && item.business_id === businessId)
  if (!vehicle) throw new Error('El vehículo no existe en este negocio.')
  const client = data.clients.find((item) => item.id === vehicle.clientId && item.business_id === businessId)
  if (!client) throw new Error('El vehículo no tiene un cliente válido en este negocio.')
  if (!orderId) {
    if (actor.role !== 'admin') throw new Error('Solo Admin puede administrar fotografías generales de vehículos.')
    return { vehicle, order: null }
  }
  const order = data.orders.find((item) => item.id === orderId && item.business_id === businessId)
  if (!order || order.vehicleId !== vehicle.id || order.clientId !== client.id) throw new Error('La orden y el vehículo no pertenecen a la misma relación de este negocio.')
  if (actor.role === 'employee') requireEmployee(actor, order.employeeId)
  return { vehicle, order }
}

function assertPhotoRecordAccess(data, photo, actor) {
  if (!photo || photo.business_id !== data.business.business_id || photo.storageKey !== photo.id || photo.url !== null) throw new Error('No se encontró la fotografía en este negocio.')
  return assertPhotoRelation(data, photo, actor)
}

export function preparePhotoRecord(data, values, actor) {
  const relation = assertPhotoRelation(data, values, actor)
  const file = values.file
  if (!file || !ALLOWED_PHOTO_TYPES.includes(file.type)) throw new Error('Formato no permitido. Usa JPEG, PNG o WEBP.')
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PHOTO_SIZE) throw new Error('La fotografía debe pesar más de 0 y hasta 10 MB.')
  const orderId = relation.order?.id ?? null
  const type = orderId ? 'order' : 'vehicle'
  const stage = values.stage
  if (!(orderId ? ['before', 'during', 'after'] : ['general']).includes(stage)) throw new Error('La etapa no corresponde al tipo de fotografía.')
  const id = values.id ?? makeId('photo')
  const photo = {
    id, business_id: data.business.business_id, vehicleId: relation.vehicle.id, orderId, type, stage,
    fileName: String(file.name ?? 'fotografia').slice(0, 180), mimeType: file.type, size: file.size,
    url: null, storageKey: id, description: String(values.description ?? '').trim().slice(0, 200),
    position: String(values.position ?? '').trim().slice(0, 100), createdAt: new Date().toISOString(), createdBy: actor.id,
  }
  return photo
}

export function listPhotos(data, filters, actor) {
  if (!filters || (!filters.vehicleId && !filters.orderId)) throw new Error('Indica el vehículo o la orden para consultar fotografías.')
  const order = filters.orderId ? data.orders.find((item) => item.id === filters.orderId && item.business_id === data.business.business_id) : null
  if (filters.orderId && !order) throw new Error('La orden no existe en este negocio.')
  if (order && filters.vehicleId && filters.vehicleId !== order.vehicleId) throw new Error('La fotografía no coincide con el vehículo de la orden.')
  const relation = assertPhotoRelation(data, { ...filters, vehicleId: filters.vehicleId ?? order?.vehicleId }, actor)
  return (data.photos ?? []).filter((photo) => {
    if (photo.business_id !== data.business.business_id || photo.vehicleId !== relation.vehicle.id) return false
    if (relation.order) return photo.type === 'order' && photo.orderId === relation.order.id && (!filters.stage || photo.stage === filters.stage)
    return photo.type === 'vehicle' && photo.orderId === null && photo.stage === 'general'
  })
}

export function getPhoto(data, id, actor) {
  const photo = (data.photos ?? []).find((item) => item.id === id && item.business_id === data.business.business_id)
  assertPhotoRecordAccess(data, photo, actor)
  return photo
}

export function deletePhoto(data, id, actor) {
  requireAdmin(data, actor)
  const photo = (data.photos ?? []).find((item) => item.id === id && item.business_id === data.business.business_id)
  assertPhotoRecordAccess(data, photo, actor)
  return { ...data, photos: data.photos.filter((item) => item.id !== photo.id) }
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
  const normalizedPlate = normalizePlate(plate)
  const currentBusinessId = data.business?.business_id ?? BUSINESS_ID
  const duplicatePlate = data.vehicles.some((vehicle) => {
    const belongsToBusiness = vehicle.business_id === currentBusinessId || (!vehicle.business_id && currentBusinessId === BUSINESS_ID)
    return belongsToBusiness && vehicle.id !== currentVehicle?.id && normalizePlate(vehicle.plate) === normalizedPlate
  })
  if (duplicatePlate) throw new Error('Ya existe un vehículo con esa placa en este negocio.')
  const vehicleValues = { ...values }
  delete vehicleValues.consultationCode
  return {
    ...vehicleValues,
    id: currentVehicle?.id ?? makeId('vehicle'),
    business_id: BUSINESS_ID,
    clientId,
    plate,
    observations: values.observations?.trim() ?? currentVehicle?.observations ?? '',
    active: values.active ?? true,
  }
}

export function createClient(data, values, vehicleValues = [], actor) {
  requireStaff(data, actor)
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
  requireAdmin(data, actor)
  const current = data.clients.find((item) => item.id === id)
  if (!current) throw new Error('No se encontró el cliente.')
  const name = splitClientName(values)
  requireValue(name.firstName, 'El nombre completo')
  requireValue(values.phone, 'El teléfono')
  const update = { ...name, phone: values.phone.trim(), address: values.address?.trim() ?? '', whatsapp: values.whatsapp?.trim() ?? current.whatsapp ?? '', observations: values.observations?.trim() ?? current.observations ?? '', active: values.active ?? current.active }
  return { ...data, clients: data.clients.map((item) => item.id === id ? { ...item, ...update, business_id: BUSINESS_ID } : item) }
}

export function deleteClient(data, id, actor) {
  requireAdmin(data, actor)
  if (data.vehicles.some((item) => item.clientId === id) || data.orders.some((item) => item.clientId === id)) throw new Error('No se puede eliminar: el cliente tiene vehículos u órdenes asociados. Puedes desactivarlo.')
  return { ...data, clients: data.clients.filter((item) => item.id !== id) }
}

export function createVehicle(data, values, actor) {
  requireStaff(data, actor)
  const vehicle = buildVehicle(data, values.clientId, values)
  return withActivity(data, { ...data, vehicles: [vehicle, ...data.vehicles] }, 'vehicle_created', `Vehículo ${vehicle.plate} registrado`, vehicle.id)
}

export function updateVehicle(data, id, values, actor) {
  requireAdmin(data, actor)
  const current = data.vehicles.find((item) => item.id === id)
  if (!current) throw new Error('No se encontró el vehículo.')
  const vehicle = buildVehicle(data, values.clientId ?? current.clientId, values, current)
  return { ...data, vehicles: data.vehicles.map((item) => item.id === id ? vehicle : item) }
}

export function deleteVehicle(data, id, actor) {
  requireAdmin(data, actor)
  if (data.orders.some((item) => item.vehicleId === id)) throw new Error('No se puede eliminar: el vehículo tiene órdenes asociadas. Puedes desactivarlo.')
  return { ...data, vehicles: data.vehicles.filter((item) => item.id !== id), photos: (data.photos ?? []).filter((photo) => photo.vehicleId !== id) }
}

export function saveService(data, values, id, actor) {
  requireAdmin(data, actor)
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
  requireAdmin(data, actor)
  const businessId = data.business?.business_id ?? BUSINESS_ID
  const current = id ? data.employees.find((item) => item.id === id && item.business_id === businessId) : null
  if (id && !current) throw new Error('No se encontró el empleado en este negocio.')
  const name = String(values.name ?? '').trim()
  const email = String(values.email ?? '').trim().toLowerCase()
  requireValue(name, 'El nombre')
  requireValue(email, 'El correo')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo del empleado no tiene un formato válido.')
  requireUnique(data.employees.filter((item) => item.business_id === businessId), 'email', email, 'un empleado', id)
  const credential = values.credential
  const credentialProvided = Boolean(credential)
  if (!current && !credentialProvided) throw new Error('Define una contraseña temporal para el nuevo empleado.')
  if (credentialProvided && (!credential.passwordSalt || !/^[a-f\d]{64}$/i.test(credential.passwordHash ?? ''))) throw new Error('Las credenciales temporales del empleado no son válidas.')
  const active = values.active === undefined ? current?.active ?? true : values.active === true || values.active === 'true'
  const employee = {
    id: current?.id ?? makeId('employee'),
    business_id: businessId,
    name,
    email,
    role: 'employee',
    active,
    joinedAt: current?.joinedAt ?? values.joinedAt ?? new Date().toISOString(),
    passwordSalt: credential?.passwordSalt ?? current?.passwordSalt,
    passwordHash: credential?.passwordHash ?? current?.passwordHash,
    credentialStatus: credential?.credentialStatus ?? current?.credentialStatus ?? 'temporary',
  }
  if (current) return { ...data, employees: data.employees.map((item) => item.id === id ? employee : item) }
  return { ...data, employees: [employee, ...data.employees] }
}

function requireAppointmentActor(data, actor, appointment = null) {
  requireRole(data, actor, ['admin', 'employee'], 'gestionar agenda')
  requireValue(actor.email, 'La sesión del usuario')
  requireValue(actor.business_id, 'El negocio del usuario')
  const businessId = data.business?.business_id ?? BUSINESS_ID
  if (actor.business_id !== businessId) throw new Error('No tienes acceso a las citas de este negocio.')
  if (appointment && (appointment.business_id ?? businessId) !== actor.business_id) throw new Error('No se encontró la cita en este negocio.')
  return businessId
}

function validateAppointment(data, values, businessId, excludedId = null) {
  const { clientId, vehicleId, serviceId, employeeId, date, time } = values
  for (const [value, label] of [[clientId, 'El cliente'], [vehicleId, 'El vehículo'], [serviceId, 'El servicio'], [employeeId, 'El trabajador'], [date, 'La fecha'], [time, 'La hora']]) requireValue(value, label)
  const belongsToBusiness = (item) => item.business_id === businessId
  const client = data.clients.find((item) => item.id === clientId && belongsToBusiness(item) && item.active)
  const vehicle = data.vehicles.find((item) => item.id === vehicleId && belongsToBusiness(item) && item.clientId === clientId && item.active)
  const service = data.services.find((item) => item.id === serviceId && belongsToBusiness(item) && item.active)
  const employee = data.employees.find((item) => item.id === employeeId && belongsToBusiness(item) && item.active)
  if (!client || !vehicle || !service || !employee) throw new Error('Verifica que cliente, vehículo, servicio y trabajador estén activos y relacionados.')
  const start = commercialDateTimeTimestamp(date, time)
  if (Number.isNaN(start)) throw new Error('La fecha u hora de la cita no es válida.')
  if (start < Date.now()) throw new Error('La cita debe programarse para una hora futura.')
  const end = start + service.durationMinutes * 60_000
  const overlaps = data.appointments.some((appointment) => {
    if (appointment.business_id !== businessId || appointment.id === excludedId || appointment.employeeId !== employeeId || appointment.date !== date || appointment.status !== 'SCHEDULED') return false
    const otherStart = commercialDateTimeTimestamp(appointment.date, appointment.time)
    if (Number.isNaN(otherStart)) return false
    const otherService = data.services.find((item) => item.id === appointment.serviceId && belongsToBusiness(item))
    const otherEnd = otherStart + (otherService?.durationMinutes ?? 0) * 60_000
    return start < otherEnd && end > otherStart
  })
  if (overlaps) throw new Error('Ese trabajador ya tiene una cita durante ese horario.')
  return { client, vehicle, service, employee }
}

export function createAppointment(data, values, actor) {
  requireAdmin(data, actor)
  const businessId = requireAppointmentActor(data, actor)
  const allowedFields = ['clientId', 'vehicleId', 'serviceId', 'employeeId', 'date', 'time', 'observations']
  const appointmentValues = Object.fromEntries(Object.entries(values).filter(([key]) => allowedFields.includes(key)))
  const { client, vehicle, service, employee } = validateAppointment(data, appointmentValues, businessId)
  const appointment = { ...appointmentValues, observations: String(appointmentValues.observations ?? '').trim(), id: makeId('appointment'), business_id: businessId, status: 'SCHEDULED', orderId: null, createdAt: new Date().toISOString() }
  const nextData = { ...data, appointments: [appointment, ...data.appointments] }
  return withActivity(data, nextData, 'appointment_created', `Cita ${appointment.date} ${appointment.time} · ${client.firstName} ${client.lastName} · ${vehicle.plate} · ${service.name} · ${employee.name}`, appointment.id)
}

export function updateAppointment(data, id, values, actor) {
  requireAdmin(data, actor)
  const businessId = requireAppointmentActor(data, actor)
  const appointment = data.appointments.find((item) => item.id === id && (item.business_id ?? businessId) === businessId)
  if (!appointment) throw new Error('No se encontró la cita en este negocio.')
  requireAppointmentActor(data, actor, appointment)
  if (appointment.status !== 'SCHEDULED') throw new Error('Solo se pueden editar citas programadas.')
  const allowedFields = ['clientId', 'vehicleId', 'serviceId', 'employeeId', 'date', 'time', 'observations']
  const appointmentValues = Object.fromEntries(Object.entries(values).filter(([key]) => allowedFields.includes(key)))
  const nextAppointment = { ...appointment, ...appointmentValues, observations: String(appointmentValues.observations ?? appointment.observations ?? '').trim() }
  const relations = validateAppointment(data, nextAppointment, businessId, id)
  return withActivity(data, { ...data, appointments: data.appointments.map((item) => item.id === id ? nextAppointment : item) }, 'appointment_updated', `Cita reprogramada para ${nextAppointment.date} ${nextAppointment.time} · ${relations.employee.name}`, id)
}

export function transitionAppointment(data, id, status, actor) {
  const businessId = requireAppointmentActor(data, actor)
  const appointment = data.appointments.find((item) => item.id === id && (item.business_id ?? businessId) === businessId)
  if (!appointment) throw new Error('No se encontró la cita en este negocio.')
  requireAppointmentActor(data, actor, appointment)
  if (actor.role === 'employee') {
    const assignedEmployee = data.employees.find((employee) => employee.id === actor.employeeId && employee.business_id === businessId && employee.active)
    if (!assignedEmployee || appointment.employeeId !== actor.employeeId) throw new Error('Solo puedes actualizar citas asignadas a tu usuario.')
    if (status === 'CANCELLED') throw new Error('Solo el administrador puede cancelar citas.')
  }
  const transitions = { SCHEDULED: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['COMPLETED'], COMPLETED: [], CANCELLED: [] }
  if (!transitions[appointment.status]?.includes(status)) throw new Error(`No se permite cambiar una cita de ${appointment.status} a ${status}.`)
  const nextAppointment = { ...appointment, status }
  const descriptions = { IN_PROGRESS: 'iniciada', COMPLETED: 'completada', CANCELLED: 'cancelada' }
  return withActivity(data, { ...data, appointments: data.appointments.map((item) => item.id === id ? nextAppointment : item) }, `appointment_${status.toLowerCase()}`, `Cita del ${appointment.date} ${appointment.time} ${descriptions[status]}`, id)
}

export function cancelAppointment(data, id, actor) {
  return transitionAppointment(data, id, 'CANCELLED', actor)
}

export function createOrder(data, values, actor) {
  requireRole(data, actor, ['admin', 'employee'], 'crear órdenes')
  const businessId = data.business.business_id
  if (!businessId) throw new Error('No se pudo determinar el negocio de la orden.')
  const { clientId, vehicleId, serviceId, employeeId, appointmentId, paymentMethod, date } = values
  for (const [value, label] of [[clientId, 'El cliente'], [vehicleId, 'El vehículo'], [serviceId, 'El servicio'], [employeeId, 'El trabajador'], [date, 'La fecha']]) requireValue(value, label)
  const client = data.clients.find((item) => item.id === clientId && item.business_id === businessId && item.active)
  const vehicle = data.vehicles.find((item) => item.id === vehicleId && item.business_id === businessId && item.clientId === clientId && item.active)
  const service = data.services.find((item) => item.id === serviceId && item.business_id === businessId && item.active)
  const employee = data.employees.find((item) => item.id === employeeId && item.business_id === businessId && item.active)
  if (!client || !vehicle || !service || !employee) throw new Error('Verifica que cliente, vehículo, servicio y trabajador estén activos y ligados.')
  if (actor.role === 'employee') requireEmployee(actor, employeeId)
  const price = actor.role === 'admin' && values.price !== undefined && values.price !== '' ? Number(values.price) : service.price
  if (!Number.isFinite(price) || price < 0) throw new Error('El precio de la orden no es válido.')
  if (paymentMethod !== undefined && paymentMethod !== null && !['cash', 'transfer'].includes(paymentMethod)) throw new Error('El método de pago debe ser Efectivo o Transferencia.')
  if (!isValidCommercialDate(date)) throw new Error('La fecha de la orden no es válida.')
  const createdAt = new Date().toISOString()
  const initialConditionNotes = String(values.initialConditionNotes ?? '').trim()
  // Photo files are persisted separately in IndexedDB. The legacy inline field remains empty.
  const initialConditionPhotos = []
  const sequence = data.orderSequence ?? data.orders.length + 1
  const paymentStatus = paymentMethod ? 'PENDING_CONFIRMATION' : null
  const order = { id: makeId('order'), business_id: businessId, number: `ORD-${String(sequence).padStart(3, '0')}`, clientId, vehicleId, serviceId, employeeId, appointmentId: appointmentId ?? null, price, status: 'PENDING', paymentMethod: paymentMethod ?? null, paymentStatus, paymentId: null, consultationCode: makeOrderConsultationCode(data.orders, businessId), recipeSnapshot: service.recipe.map((item) => ({ ...item })), initialConditionNotes, initialConditionPhotos, inventoryConsumedAt: null, date, createdAt, startedAt: null, completedAt: null }
  return { ...withActivity(data, { ...data, orders: [order, ...data.orders], orderSequence: sequence + 1 }, 'order_created', `${order.number} creada para ${client.firstName} ${client.lastName}`, order.id) }
}

export function updateOrder(data, id, values, actor) {
  requireAdmin(data, actor)
  const order = data.orders.find((item) => item.id === id)
  if (!order) throw new Error('No se encontró la orden.')
  const allowedFields = ['clientId', 'vehicleId', 'serviceId', 'employeeId', 'price', 'initialConditionNotes']
  const updatedValues = Object.fromEntries(Object.entries(values).filter(([key]) => allowedFields.includes(key)))
  const serviceChanged = updatedValues.serviceId !== undefined && updatedValues.serviceId !== order.serviceId
  if (updatedValues.vehicleId && updatedValues.vehicleId !== order.vehicleId && (data.photos ?? []).some((photo) => photo.orderId === id)) throw new Error('Elimina primero las fotografías de esta orden antes de cambiar el vehículo para evitar asociarlas al vehículo incorrecto.')
  if (serviceChanged && order.inventoryConsumedAt) throw new Error('No se puede cambiar el servicio después de consumir inventario.')
  if (['COMPLETED', 'CANCELLED'].includes(order.status)) throw new Error('Solo se puede corregir una orden pendiente o en proceso.')
  const nextOrder = { ...order, ...updatedValues, price: updatedValues.price === undefined ? order.price : Number(updatedValues.price) }
  const client = data.clients.find((item) => item.id === nextOrder.clientId && item.active)
  const vehicle = data.vehicles.find((item) => item.id === nextOrder.vehicleId && item.clientId === nextOrder.clientId && item.active)
  const service = data.services.find((item) => item.id === nextOrder.serviceId && item.active)
  const employee = data.employees.find((item) => item.id === nextOrder.employeeId && item.active)
  if (!client || !vehicle || !service || !employee) throw new Error('Verifica que cliente, vehículo, servicio y trabajador estén activos y ligados.')
  if (serviceChanged) nextOrder.recipeSnapshot = service.recipe.map((item) => ({ ...item }))
  if (!Number.isFinite(nextOrder.price) || nextOrder.price < 0) throw new Error('El precio de la orden no es válido.')
  return withActivity(data, { ...data, orders: data.orders.map((item) => item.id === id ? nextOrder : item) }, 'order_updated', `${order.number} corregida`, id)
}

export function deleteOrder(data, id, actor) {
  requireAdmin(data, actor)
  const order = data.orders.find((item) => item.id === id)
  if (!order) throw new Error('No se encontró la orden.')
  if (order.inventoryConsumedAt != null) throw new Error('No se puede eliminar la orden: el servicio ya consumió inventario.')
  if (order.paymentId || order.paymentStatus === 'CONFIRMED') throw new Error('No se puede eliminar una orden con pago confirmado.')
  return withActivity(data, { ...data, orders: data.orders.filter((item) => item.id !== id), photos: (data.photos ?? []).filter((photo) => photo.orderId !== id) }, 'order_deleted', `${order.number} eliminada`, id)
}

export function transitionOrder(data, id, status, actor) {
  if (!resolveActivePrincipal(data, actor)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
  const order = data.orders.find((item) => item.id === id)
  if (!order) throw new Error('No se encontró la orden.')
  if (actor?.role === 'employee' && (!actor.employeeId || order.employeeId !== actor.employeeId)) throw new Error('Solo puedes actualizar órdenes asignadas a ti.')
  if (!['admin', 'employee'].includes(actor?.role)) throw new Error('No tienes permisos para actualizar órdenes.')
  if (status === 'CANCELLED' && actor.role !== 'admin') throw new Error('Solo el administrador puede cancelar órdenes.')
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
  const updated = { ...order, status, ...(status === 'IN_PROGRESS' ? { startedAt: timestamp } : {}), ...(status === 'COMPLETED' ? { completedAt: timestamp, inventoryConsumedAt: timestamp, paymentStatus: ['cash', 'transfer'].includes(order.paymentMethod) ? 'PENDING_CONFIRMATION' : 'AWAITING_METHOD' } : {}) }
  const nextData = { ...data, inventory, inventoryMovements, orders: data.orders.map((item) => item.id === id ? updated : item) }
  const client = data.clients.find((item) => item.id === order.clientId)
  const label = status === 'IN_PROGRESS' ? 'iniciada' : status === 'COMPLETED' ? 'completada' : 'cancelada'
  return withActivity(data, nextData, status === 'IN_PROGRESS' ? 'order_started' : status === 'COMPLETED' ? 'order_completed' : 'order_cancelled', `${order.number} ${label}${client ? ` · ${client.firstName} ${client.lastName}` : ''}`, id)
}

export function declarePaymentMethod(data, orderId, method, actor) {
  if (!resolveActivePrincipal(data, actor)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
  const order = data.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'COMPLETED') throw new Error('Solo se pueden registrar pagos de órdenes completadas.')
  if (actor?.role === 'employee' && (!actor.employeeId || order.employeeId !== actor.employeeId)) throw new Error('Solo puedes declarar pagos de órdenes asignadas a ti.')
  if (!['admin', 'employee'].includes(actor?.role)) throw new Error('No tienes permisos para declarar pagos.')
  if (order.paymentStatus === 'CONFIRMED' || order.paymentId || data.payments.some((item) => item.orderId === orderId)) throw new Error('Esta orden ya tiene un pago confirmado.')
  if (!['cash', 'transfer'].includes(method)) throw new Error('Selecciona efectivo o transferencia.')
  return withActivity(data, { ...data, orders: data.orders.map((item) => item.id === orderId ? { ...item, paymentMethod: method, paymentStatus: 'PENDING_CONFIRMATION' } : item) }, 'payment_declared', `${order.number}: método de pago indicado (${method === 'cash' ? 'efectivo' : 'transferencia'}), pendiente de confirmación`, orderId)
}

export function confirmPayment(data, orderId, actor) {
  requireAdmin(data, actor)
  const order = data.orders.find((item) => item.id === orderId)
  if (!order || order.status !== 'COMPLETED') throw new Error('Solo se pueden confirmar pagos de órdenes completadas.')
  if (order.paymentStatus !== 'PENDING_CONFIRMATION' || !['cash', 'transfer'].includes(order.paymentMethod)) throw new Error('La orden aún no tiene un método de pago declarado pendiente de confirmación.')
  if (order.paymentId || data.payments.some((item) => item.orderId === orderId)) throw new Error('Esta orden ya tiene un pago confirmado.')
  const confirmedBy = actor.id ?? actor.userId ?? actor.email
  requireValue(confirmedBy, 'El identificador del administrador que confirma el pago')
  const timestamp = new Date().toISOString()
  const confirmation = { confirmedBy: String(confirmedBy).trim(), confirmedAt: timestamp }
  const payment = { id: makeId('payment'), business_id: BUSINESS_ID, orderId, amount: order.price, method: order.paymentMethod, status: 'CONFIRMED', ...confirmation, createdAt: timestamp }
  const nextData = { ...data, payments: [payment, ...data.payments], orders: data.orders.map((item) => item.id === orderId ? { ...item, paymentId: payment.id, paymentStatus: 'CONFIRMED', ...confirmation } : item) }
  return withActivity(data, nextData, 'payment', `Pago de ${order.number} confirmado`, payment.id)
}

export function saveInventoryItem(data, values, id, actor) {
  requireAdmin(data, actor)
  requireValue(values.name, 'El nombre')
  requireValue(values.category, 'La categoría')
  requireValue(values.unit, 'La unidad')
  if (values.sku?.trim()) requireUnique(data.inventory, 'sku', values.sku.trim(), 'un insumo', id)
  const minStock = Number(values.minStock)
  const cost = Number(values.cost)
  if ([minStock, cost].some((value) => !Number.isFinite(value) || value < 0)) throw new Error('Mínimo y costo deben ser números iguales o mayores a cero.')
  const currentItem = id ? data.inventory.find((item) => item.id === id) : null
  if (id && !currentItem) throw new Error('No se encontró el insumo.')
  const stock = currentItem ? currentItem.stock : 0
  const item = { ...values, id: id ?? makeId('item'), business_id: BUSINESS_ID, stock, minStock, cost, active: Boolean(values.active) }
  if (id) return { ...data, inventory: data.inventory.map((current) => current.id === id ? item : current) }
  return { ...data, inventory: [item, ...data.inventory] }
}

export function registerInventoryEntry(data, values, actor) {
  requireAdmin(data, actor)
  requireValue(values.itemId, 'El insumo')
  requireValue(values.quantity, 'La cantidad')
  requireValue(values.unit, 'La unidad')
  requireValue(values.date, 'La fecha de entrada')

  const item = data.inventory.find((candidate) => candidate.id === values.itemId)
  if (!item) throw new Error('El insumo seleccionado no existe.')
  if (String(values.unit) !== String(item.unit)) throw new Error('La unidad de entrada debe coincidir con la unidad del insumo.')

  const quantity = Number(values.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('La cantidad debe ser un número mayor que cero.')
  if (!isValidCommercialDate(values.date)) throw new Error('La fecha de entrada no es válida.')
  if (values.date > commercialDateInput()) throw new Error('La fecha de entrada no puede ser futura.')

  const costTotal = values.costTotal === undefined || String(values.costTotal).trim() === '' ? null : Number(values.costTotal)
  if (costTotal !== null && (!Number.isFinite(costTotal) || costTotal < 0)) throw new Error('El costo total debe ser igual o mayor que cero.')

  const entry = {
    id: makeId('movement'),
    business_id: BUSINESS_ID,
    type: 'entry',
    itemId: item.id,
    itemName: item.name,
    quantity,
    unit: item.unit,
    date: values.date,
    costTotal,
    supplier: values.supplier?.trim() ?? '',
    notes: values.notes?.trim() ?? '',
    createdBy: actor.name ?? actor.email,
    createdAt: new Date().toISOString(),
  }
  const nextData = {
    ...data,
    inventory: data.inventory.map((candidate) => candidate.id === item.id ? { ...candidate, stock: Number(candidate.stock) + quantity } : candidate),
    inventoryMovements: [entry, ...data.inventoryMovements],
  }
  return withActivity(data, nextData, 'inventory_entry', `Entrada de ${quantity} ${item.unit} de ${item.name}`, entry.id)
}

export function updateBusiness(data, values, actor) {
  requireAdmin(data, actor)
  const allowedFields = ['name', 'address', 'phone', 'whatsapp', 'email', 'description', 'active']
  const editableValues = Object.fromEntries(Object.entries(values).filter(([key]) => allowedFields.includes(key)))
  const name = values.name ?? data.business.name
  requireValue(name, 'El nombre del negocio')
  if (values.name !== undefined) editableValues.name = String(values.name).trim()

  if (values.email !== undefined) {
    const email = String(values.email).trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo electrónico no tiene un formato válido.')
    editableValues.email = email
  }
  for (const field of ['address', 'phone', 'whatsapp', 'description']) {
    if (values[field] !== undefined) editableValues[field] = String(values[field] ?? '').trim()
  }

  if (values.socials !== undefined) {
    if (!values.socials || typeof values.socials !== 'object' || Array.isArray(values.socials)) throw new Error('Las redes sociales no tienen un formato válido.')
    const socialKeys = ['instagram', 'facebook', 'tiktok']
    editableValues.socials = {
      ...(data.business.socials ?? {}),
      ...Object.fromEntries(socialKeys.map((key) => [key, String(values.socials[key] ?? '').trim()])),
    }
  }

  if (values.hours !== undefined) {
    if (!values.hours || typeof values.hours !== 'object' || Array.isArray(values.hours)) throw new Error('El horario no tiene un formato válido.')
    const mergedHours = { ...defaultBusinessHours(), ...(data.business.hours ?? {}) }
    for (const day of BUSINESS_DAYS) {
      if (values.hours[day] !== undefined) mergedHours[day] = { ...mergedHours[day], ...values.hours[day] }
      const schedule = mergedHours[day]
      if (typeof schedule.open !== 'boolean') throw new Error('Indica si cada día está abierto o cerrado.')
      if (schedule.open) {
        const isValidTime = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value ?? ''))
        if (!isValidTime(schedule.openTime) || !isValidTime(schedule.closeTime) || schedule.openTime >= schedule.closeTime) {
          throw new Error('Los días abiertos deben tener horas válidas y la apertura debe ser anterior al cierre.')
        }
      }
    }
    editableValues.hours = mergedHours
  }

  return { ...data, business: { ...data.business, ...editableValues, id: BUSINESS_ID, business_id: BUSINESS_ID } }
}

export function getDashboardMetrics(data, date = new Date()) {
  const today = localDateInput(date)
  const todayOrders = data.orders.filter((order) => (order.date ?? localDateInput(order.createdAt)) === today)
  const todayPayments = data.payments.filter((payment) => localDateInput(payment.confirmedAt ?? payment.createdAt) === today)
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

export function getPublicVehicleStatus(data, { plate, code }) {
  const normalizedPlate = normalizePlate(plate)
  if (!normalizedPlate) throw new Error('Ingresa la placa del vehículo.')

  const businessId = data.business?.business_id ?? BUSINESS_ID
  const vehicle = data.vehicles.find((item) => item.business_id === businessId && item.active && normalizePlate(item.plate) === normalizedPlate)
  if (!vehicle) throw new Error('Vehículo no encontrado. Verifica la placa ingresada.')
  if (!/^\d{4}$/.test(String(code ?? ''))) {
    throw new Error('Código de consulta incorrecto. Verifica los datos e inténtalo nuevamente.')
  }

  const matchingOrder = data.orders.find((order) => (
    order.business_id === businessId
    && order.vehicleId === vehicle.id
    && order.status !== 'CANCELLED'
    && String(order.consultationCode) === String(code)
  ))
  if (!matchingOrder) throw new Error('Código de consulta incorrecto. Verifica los datos e inténtalo nuevamente.')

  const publicStatuses = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', COMPLETED: 'Listo para retirar' }
  const statusLabel = publicStatuses[matchingOrder.status]
  const service = statusLabel ? data.services.find((item) => item.business_id === businessId && item.id === matchingOrder.serviceId) : null

  return {
    vehicle: {
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      type: vehicle.type,
    },
    service: statusLabel ? {
      name: service?.name ?? 'Servicio no disponible',
      status: statusLabel,
      entryDate: matchingOrder.createdAt,
    } : null,
  }
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
  requireAdmin(data, actor)
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
  if (!isValidCommercialDate(values.date)) throw new Error('La fecha no es válida.')
  const timestamp = new Date().toISOString()
  const transaction = { id: makeId('cash'), business_id: BUSINESS_ID, type: values.type, category: values.category, description: values.description.trim(), amount, paymentMethod: values.paymentMethod, date: values.date, notes: values.notes?.trim() ?? '', source: 'manual', createdBy: actor.email ?? actor.name, createdAt: timestamp }
  const nextData = { ...data, manualTransactions: [transaction, ...(data.manualTransactions ?? [])] }
  return withActivity(data, nextData, 'cash_movement', `Movimiento manual: ${transaction.description}`, transaction.id)
}
