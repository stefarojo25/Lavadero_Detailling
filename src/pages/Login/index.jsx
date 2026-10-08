import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import './login.css'
import { ROUTES } from '../../app/routes.js'
import Button from '../../components/ui/Button.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    try {
      login({ email: email.trim(), password, remember })
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <section aria-label="Inicio de sesión" className="rounded-[18px] border border-white/12 bg-[#111827]/85 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.42)] backdrop-blur-xl sm:p-7">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          id="email"
          label="Correo"
          type="email"
          autoComplete="username"
          placeholder="tucorreo@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={120}
          icon={<Mail size={17} />}
          inputClassName="login-control rounded-xl border-white/10 bg-[#1E293B] text-[#F8FAFC] placeholder:text-[#94A3B8]"
        />
        <TextField
          id="password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          maxLength={128}
          icon={<Lock size={16} />}
          endAdornment={(
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="grid size-8 place-items-center rounded-lg text-[#94A3B8] transition hover:bg-[#334155] hover:text-[#F8FAFC]" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          )}
          inputClassName="login-control rounded-xl border-white/10 bg-[#1E293B] text-[#F8FAFC] placeholder:text-[#94A3B8]"
        />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-[#CBD5E1]">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-[#3B82F6]" />
            Recordarme en este dispositivo
          </label>
          <button type="button" onClick={() => setNotice('La recuperación no está habilitada en el acceso de demostración.')} className="text-left font-medium text-blue-300 transition hover:text-blue-200">¿Olvidaste tu contraseña?</button>
        </div>
        {notice && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-3 text-sm text-red-200">{notice}</p>}
        <Button type="submit" className="mt-2 min-h-12 w-full rounded-xl bg-linear-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-[15px] shadow-[0_8px_26px_rgba(37,99,235,0.32)] transition-all hover:brightness-110 active:scale-[0.99]">
          Iniciar sesión <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#94A3B8]">o</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <Link to={ROUTES.PUBLIC_VEHICLE} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#CBD5E1]/15 bg-[#111827]/50 px-4 text-sm font-medium text-[#F8FAFC] transition hover:border-[#3B82F6]/60 hover:bg-[#1E293B] focus-visible:outline-offset-2">
        <Search size={17} aria-hidden="true" />
        Consultar estado del vehículo
      </Link>
      <p className="mt-5 text-center text-xs leading-5 text-[#94A3B8]">Modo demo: admin@lavadero.demo / admin123 o employee@lavadero.demo / employee123.</p>
    </section>
  )
}

export default LoginPage

