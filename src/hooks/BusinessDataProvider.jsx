import { useEffect, useRef, useState } from 'react'
import { BusinessDataContext } from './businessDataContext.js'
import { useAuth } from '../features/auth/useAuth.js'
import { isActivePrincipal } from '../features/auth/accessControl.js'
import * as service from '../services/businessService.js'
import { readPhotoFile as readStoredPhotoFile, removePhotoFile, storePhotoFile, validatePhotoFile } from '../services/photoStorage.js'

export function BusinessDataProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(service.loadBusinessData)
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
    service.persistBusinessData(data)
  }, [data])

  function run(operation, ...args) {
    const currentData = dataRef.current
    if (!isActivePrincipal(currentData, user)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
    const nextData = operation(currentData, ...args)
    dataRef.current = nextData
    setData(nextData)
    return nextData
  }

  async function uploadPhoto(file, details) {
    const currentData = dataRef.current
    if (!isActivePrincipal(currentData, user)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
    validatePhotoFile(file)
    const candidate = service.preparePhotoRecord(currentData, { ...details, file }, user)
    let stored = false
    try {
      await storePhotoFile(candidate.storageKey, file)
      stored = true
      const latestData = dataRef.current
      if (!isActivePrincipal(latestData, user)) throw new Error('La sesión dejó de ser válida durante la carga de la fotografía.')
      const photo = service.preparePhotoRecord(latestData, { ...details, file, id: candidate.id }, user)
      const nextData = { ...latestData, photos: [photo, ...(latestData.photos ?? [])] }
      service.persistBusinessData(nextData)
      dataRef.current = nextData
      setData(nextData)
      return photo
    } catch (error) {
      if (stored) await removePhotoFile(candidate.storageKey).catch(() => {})
      throw error
    }
  }

  function listPhotos(filters) {
    return service.listPhotos(dataRef.current, filters, user)
  }

  async function readPhotoFile(id) {
    service.getPhoto(dataRef.current, id, user)
    return readStoredPhotoFile(id)
  }

  async function removePhoto(id) {
    const currentData = dataRef.current
    if (!isActivePrincipal(currentData, user)) throw new Error('La sesión ya no es válida o la cuenta está inactiva. Inicia sesión nuevamente.')
    const nextData = service.deletePhoto(currentData, id, user)
    service.persistBusinessData(nextData)
    dataRef.current = nextData
    setData(nextData)
    await removePhotoFile(id).catch(() => {})
  }

  function runAndCleanRemovedPhotos(operation, ...args) {
    const currentData = dataRef.current
    const photoIds = (currentData.photos ?? []).map((photo) => photo.id)
    const nextData = run(operation, ...args)
    const retainedIds = new Set((nextData.photos ?? []).map((photo) => photo.id))
    photoIds.filter((id) => !retainedIds.has(id)).forEach((id) => removePhotoFile(id).catch(() => {}))
    return nextData
  }

  const value = {
    data,
    createClient: (values, vehicles = []) => run(service.createClient, values, vehicles, user),
    updateClient: (id, values) => run(service.updateClient, id, values, user),
    deleteClient: (id) => run(service.deleteClient, id, user),
    createVehicle: (values) => run(service.createVehicle, values, user),
    updateVehicle: (id, values) => run(service.updateVehicle, id, values, user),
    deleteVehicle: (id) => runAndCleanRemovedPhotos(service.deleteVehicle, id, user),
    createAppointment: (values) => run(service.createAppointment, values, user),
    updateAppointment: (id, values) => run(service.updateAppointment, id, values, user),
    cancelAppointment: (id) => run(service.cancelAppointment, id, user),
    transitionAppointment: (id, status) => run(service.transitionAppointment, id, status, user),
    saveService: (values, id) => run(service.saveService, values, id, user),
    saveEmployee: (values, id) => run(service.saveEmployee, values, id, user),
    createOrder: (values) => run(service.createOrder, values, user),
    updateOrder: (id, values) => runAndCleanRemovedPhotos(service.updateOrder, id, values, user),
    deleteOrder: (id) => runAndCleanRemovedPhotos(service.deleteOrder, id, user),
    transitionOrder: (id, status) => run(service.transitionOrder, id, status, user),
    declarePaymentMethod: (orderId, method) => run(service.declarePaymentMethod, orderId, method, user),
    confirmPayment: (orderId) => run(service.confirmPayment, orderId, user),
    createManualCashMovement: (values) => run(service.createManualCashMovement, values, user),
    saveInventoryItem: (values, id) => run(service.saveInventoryItem, values, id, user),
    registerInventoryEntry: (values) => run(service.registerInventoryEntry, values, user),
    uploadPhoto,
    listPhotos,
    readPhotoFile,
    deletePhoto: removePhoto,
    updateBusiness: (values) => run(service.updateBusiness, values, user),
    resetDemoData: () => {
      if (!isActivePrincipal(data, user) || user.role !== 'admin') throw new Error('Esta acción requiere una sesión activa de administrador.')
      ;(dataRef.current.photos ?? []).forEach((photo) => removePhotoFile(photo.id).catch(() => {}))
      const nextData = service.resetBusinessData()
      dataRef.current = nextData
      setData(nextData)
    },
  }

  return <BusinessDataContext.Provider value={value}>{children}</BusinessDataContext.Provider>
}
