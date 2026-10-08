import { useState } from 'react'
import { AuthContext } from './authContext.js'
import { businessId } from '../../services/businessService.js'

const SESSION_KEY = 'lavadero-mock-session'
const DEMO_CREDENTIALS = {
  'admin@lavadero.demo': { password: 'admin123', role: 'admin', name: 'Andrés Molina', employeeId: null },
  'employee@lavadero.demo': { password: 'employee123', role: 'employee', name: 'Camila Rojas', employeeId: 'employee-002' },
}

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY) ?? 'null')
    return session && ['admin', 'employee'].includes(session.role) ? session : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  function login({ email, password, remember }) {
    const normalizedEmail = email.trim().toLowerCase()
    const credential = DEMO_CREDENTIALS[normalizedEmail]
    if (!credential || password !== credential.password) {
      throw new Error('Correo o contraseña incorrectos.')
    }
    const nextUser = {
      email: normalizedEmail,
      name: credential.name,
      role: credential.role,
      business_id: businessId(),
      employeeId: credential.employeeId,
    }
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}