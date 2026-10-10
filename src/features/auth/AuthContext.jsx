import { useEffect, useState } from 'react'
import { AuthContext } from './authContext.js'
import { loadBusinessData } from '../../services/businessService.js'
import { authenticateUser, validateStoredSession } from './authService.js'

const SESSION_KEY = 'lavadero-mock-session'
function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY) ?? 'null')
    const principal = validateStoredSession(loadBusinessData(), session)
    if (principal) return principal
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    return null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== 'lavadero-business-data-v1' && event.key !== SESSION_KEY) return
      if (event.key === SESSION_KEY) {
        setUser(readSession)
        return
      }
      setUser((current) => {
        if (!current) return null
        const principal = validateStoredSession(loadBusinessData(), current)
        if (!principal) {
          localStorage.removeItem(SESSION_KEY)
          sessionStorage.removeItem(SESSION_KEY)
        }
        return principal
      })
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  async function login({ email, password, remember }) {
    const nextUser = await authenticateUser(loadBusinessData(), email, password)
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}
