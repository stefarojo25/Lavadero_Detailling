import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_ID, ROLE_ADMIN, ROLE_EMPLOYEE, VALID_ROLES } from './authConstants.js'

export function resolveActivePrincipal(data, principal) {
  const businessId = data?.business?.business_id
  if (!principal || !VALID_ROLES.includes(principal.role) || principal.active !== true || !principal.id || !principal.email || !businessId || principal.business_id !== businessId || data.business.active === false) return null

  if (principal.role === ROLE_ADMIN) {
    if (principal.id !== DEMO_ADMIN_ID || principal.email.toLowerCase() !== DEMO_ADMIN_EMAIL || principal.employeeId) return null
    return { id: DEMO_ADMIN_ID, email: DEMO_ADMIN_EMAIL, name: principal.name, role: ROLE_ADMIN, business_id: businessId, active: true, employeeId: null }
  }

  if (principal.role === ROLE_EMPLOYEE) {
    const employee = data.employees.find((item) => item.id === principal.id && item.business_id === businessId)
    if (!employee || employee.role !== ROLE_EMPLOYEE || !employee.active || employee.email.toLowerCase() !== principal.email.toLowerCase() || principal.employeeId !== employee.id) return null
    return { id: employee.id, email: employee.email, name: employee.name, role: ROLE_EMPLOYEE, business_id: businessId, active: true, employeeId: employee.id }
  }

  return null
}

export function isActivePrincipal(data, principal) {
  return Boolean(resolveActivePrincipal(data, principal))
}
