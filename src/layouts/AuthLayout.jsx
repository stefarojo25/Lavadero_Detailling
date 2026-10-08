import { Droplets } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { ROUTES } from '../app/routes.js'

function AuthLayout() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#0F172A] px-4 py-8 text-[#F8FAFC]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(37,99,235,0.17),transparent_58%),radial-gradient(ellipse_at_12%_85%,rgba(59,130,246,0.07),transparent_40%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(rgba(203,213,225,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.12)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_at_center,black,transparent_82%)]" />
      <div className="relative my-auto flex w-full max-w-105 flex-col items-center">
        <Link to={ROUTES.LOGIN} aria-label="Lavadero Detailing" className="grid size-16 place-items-center rounded-2xl border border-blue-400/25 bg-[#111827]/90 text-blue-400 shadow-[0_12px_36px_rgba(37,99,235,0.2)] focus-visible:outline-offset-4">
          <Droplets size={30} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <h1 className="mt-6 max-w-97.5 text-center text-2xl font-semibold leading-tight text-[#F8FAFC] sm:text-[26px]">Sistema de Gestión para Lavaderos y Centros de Detailing</h1>
        <p className="mt-3 text-center text-sm leading-5 text-[#94A3B8]">Ingresa con tu cuenta para administrar tu operación.</p>
        <div className="mt-8 w-full">
          <Outlet />
        </div>
        <p className="mt-6 max-w-sm text-center text-xs leading-5 text-[#94A3B8]">Software premium para centros de detailing y lavaderos de vehículos.</p>
        <p className="mt-2 text-center text-[11px] leading-4 text-[#94A3B8]/75">Acceso de demostración · No se conecta a servicios externos</p>
      </div>
    </main>
  )
}

export default AuthLayout
