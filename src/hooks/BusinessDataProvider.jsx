import { useEffect, useState } from 'react'
import { BusinessDataContext } from './businessDataContext.js'
import { useAuth } from '../features/auth/useAuth.js'
import * as service from '../services/businessService.js'

export function BusinessDataProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(service.loadBusinessData)

  useEffect(() => {
    service.persistBusinessData(data)
  }, [data])

  function run(operation, ...args) {
    const nextData = operation(data, ...args)
    setData(nextData)
    return nextData
  }

  const value = {
    data,
    createClient: (values, vehicles = []) => run(service.createClient, values, vehicles, user),
    updateClient: (id, values) => run(service.updateClient, id, values, user),
    deleteClient: (id) => run(service.deleteClient, id, user),
    createVehicle: (values) => run(service.createVehicle, values, user),
    updateVehicle: (id, values) => run(service.updateVehicle, id, values, user),
    deleteVehicle: (id) => run(service.deleteVehicle, id, user),
    createAppointment: (values) => run(service.createAppointment, values, user),
    updateAppointment: (id, values) => run(service.updateAppointment, id, values, user),
    cancelAppointment: (id) => run(service.cancelAppointment, id, user),
    createOrderFromAppointment: (id) => run(service.createOrderFromAppointment, id, user),
    saveService: (values, id) => run(service.saveService, values, id, user),
    saveEmployee: (values, id) => run(service.saveEmployee, values, id, user),
    createOrder: (values) => run(service.createOrder, values, user),
    updateOrder: (id, values) => run(service.updateOrder, id, values, user),
    deleteOrder: (id) => run(service.deleteOrder, id, user),
    transitionOrder: (id, status) => run(service.transitionOrder, id, status, user),
    declarePaymentMethod: (orderId, method) => run(service.declarePaymentMethod, orderId, method, user),
    confirmPayment: (orderId) => run(service.confirmPayment, orderId, user),
    createManualCashMovement: (values) => run(service.createManualCashMovement, values, user),
    saveInventoryItem: (values, id) => run(service.saveInventoryItem, values, id, user),
    updateBusiness: (values) => run(service.updateBusiness, values, user),
    resetDemoData: () => setData(service.resetBusinessData()),
  }

  return <BusinessDataContext.Provider value={value}>{children}</BusinessDataContext.Provider>
}
