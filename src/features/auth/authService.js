import { resolveActivePrincipal } from './accessControl.js'
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_ID, DEMO_EMPLOYEE_ID, DEMO_EMPLOYEE_LOGIN, ROLE_ADMIN, ROLE_EMPLOYEE } from './authConstants.js'

const ITERATIONS = 120000
const DEMO_ADMIN = {
  id: DEMO_ADMIN_ID,
  email: DEMO_ADMIN_EMAIL,
  name: 'Andrés Molina',
  role: ROLE_ADMIN,
  active: true,
  passwordSalt: 'lavadero-demo-admin-salt-v1',
  passwordHash: '0a245d096c8ff342a89cba5f58fb55b2a99b8b28585d28b786d73cd2c3e1c658',
}
const DEMO_EMPLOYEE = {
  email: DEMO_EMPLOYEE_LOGIN,
  employeeId: DEMO_EMPLOYEE_ID,
  passwordSalt: 'lavadero-demo-employee-salt-v1',
  passwordHash: '3ac7bb2592d487f9054a5c5db15ce24af8045814343d440fe140446227dce7b4',
}

function hexFromBuffer(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function randomSalt() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Este navegador no permite proteger credenciales locales.')
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function derivePasswordHash(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('Este navegador no permite proteger credenciales locales.')
  const key = await globalThis.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  return hexFromBuffer(bits)
}

export async function hashEmployeePassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) throw new Error('La contraseña temporal debe tener entre 8 y 128 caracteres.')
  const passwordSalt = randomSalt()
  return { passwordSalt, passwordHash: await derivePasswordHash(password, passwordSalt), credentialStatus: 'temporary' }
}

export async function verifyPassword(password, credential) {
  if (typeof password !== 'string' || !credential?.passwordSalt || !credential?.passwordHash) return false
  const actual = await derivePasswordHash(password, credential.passwordSalt)
  return actual === credential.passwordHash
}

export async function verifyActiveCredential(password, account) {
  return account?.active === true && verifyPassword(password, account)
}

function makePrincipal(data, account) {
  const principal = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
    business_id: data.business.business_id,
    active: account.active,
    employeeId: account.employeeId ?? null,
  }
  return resolveActivePrincipal(data, principal)
}

export async function authenticateUser(data, email, password) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  if (!normalizedEmail || !password || !data?.business?.business_id || data.business.active === false) throw new Error('Correo o contraseña incorrectos.')

  if (normalizedEmail === DEMO_ADMIN.email) {
    if (!(await verifyActiveCredential(password, DEMO_ADMIN))) throw new Error('Correo o contraseña incorrectos.')
    const principal = makePrincipal(data, { ...DEMO_ADMIN, business_id: data.business.business_id })
    if (!principal) throw new Error('La cuenta no está activa para este negocio.')
    return principal
  }

  if (normalizedEmail === DEMO_EMPLOYEE.email) {
    const employee = data.employees.find((item) => item.id === DEMO_EMPLOYEE.employeeId && item.business_id === data.business.business_id && item.role === ROLE_EMPLOYEE && item.active)
    if (!employee || !(await verifyActiveCredential(password, { ...DEMO_EMPLOYEE, active: employee.active }))) throw new Error('Correo o contraseña incorrectos.')
    const principal = makePrincipal(data, { ...employee, id: employee.id, role: ROLE_EMPLOYEE, employeeId: employee.id, business_id: data.business.business_id, active: employee.active })
    if (!principal) throw new Error('La cuenta de empleado no está activa en este negocio.')
    return principal
  }

  const employee = data.employees.find((item) => item.email?.trim().toLowerCase() === normalizedEmail && item.business_id === data.business.business_id && item.role === ROLE_EMPLOYEE)
  if (!employee || !(await verifyActiveCredential(password, employee))) throw new Error('Correo o contraseña incorrectos.')
  const principal = makePrincipal(data, { ...employee, id: employee.id, employeeId: employee.id, business_id: employee.business_id })
  if (!principal) throw new Error('La cuenta de empleado no está activa en este negocio.')
  return principal
}

export function validateStoredSession(data, storedPrincipal) {
  return resolveActivePrincipal(data, storedPrincipal)
}
