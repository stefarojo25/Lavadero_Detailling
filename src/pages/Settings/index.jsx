import { useState } from 'react'
import { Save } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useAuth } from '../../features/auth/useAuth.js'
import { useBusinessData } from '../../hooks/useBusinessData.js'

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

function settingsForm(business) {
  return {
    name: business.name ?? '',
    active: business.active ?? true,
    phone: business.phone ?? '',
    whatsapp: business.whatsapp ?? '',
    email: business.email ?? '',
    address: business.address ?? '',
    description: business.description ?? '',
    socials: { instagram: '', facebook: '', tiktok: '', ...(business.socials ?? {}) },
    hours: Object.fromEntries(DAYS.map(({ key }) => [key, { open: false, openTime: '08:00', closeTime: '18:00', ...(business.hours?.[key] ?? {}) }])),
  }
}

function SettingsPage() {
  const { data, updateBusiness } = useBusinessData()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [form, setForm] = useState(() => settingsForm(data.business))
  const [feedback, setFeedback] = useState(null)

  function submit(event) {
    event.preventDefault()
    try {
      if (!isAdmin) throw new Error('Solo el administrador puede modificar la configuración.')
      updateBusiness(form)
      setFeedback({ type: 'success', message: 'Información del negocio guardada.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function updateSocial(network, value) {
    setForm((current) => ({ ...current, socials: { ...current.socials, [network]: value } }))
  }

  function updateHours(day, field, value) {
    setForm((current) => ({ ...current, hours: { ...current.hours, [day]: { ...current.hours[day], [field]: value } } }))
  }

  return (
    <div className="space-y-6">
      <div><p className="text-sm text-muted">Perfil del negocio activo</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Mi negocio</h2><p className="mt-2 text-sm text-muted">La información se guarda localmente junto con los datos de demostración.</p></div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      {!isAdmin && <p role="status" className="rounded-lg border border-outline bg-surface px-4 py-3 text-sm text-muted">La configuración solo puede modificarla un administrador.</p>}
      <form onSubmit={submit} className="space-y-6 rounded-xl border border-outline bg-surface p-4 sm:p-6">
        <div className="flex items-center gap-4 border-b border-outline pb-6"><div className="grid size-20 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10" aria-label="Logotipo del sistema"><span className="size-5 rounded-full bg-brand shadow-[0_0_16px_var(--app-accent)]" /></div><div><p className="font-medium text-foreground">Logotipo del sistema</p><p className="mt-1 text-sm text-muted">Imagen fija de la aplicación.</p></div></div>
        <fieldset disabled={!isAdmin} className="min-w-0 space-y-6">
          <section className="space-y-4"><h3 className="text-sm font-semibold text-foreground">Información del negocio</h3><div className="grid gap-4 sm:grid-cols-2"><TextField id="business-name" label="Nombre del negocio" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required maxLength={120} /><SelectField id="business-active" label="Estado" value={String(form.active)} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField><TextField id="business-address" label="Dirección" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} maxLength={180} /><TextField id="business-phone" label="Teléfono" type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} maxLength={40} /><TextField id="business-whatsapp" label="WhatsApp" type="tel" value={form.whatsapp} onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))} maxLength={40} /><TextField id="business-email" label="Correo electrónico" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={120} /><div className="sm:col-span-2"><label htmlFor="business-description" className="mb-2 block text-sm font-medium text-foreground">Descripción</label><textarea id="business-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={500} className="w-full resize-y rounded-lg border border-outline bg-surface px-3.5 py-3 text-sm text-foreground outline-none focus:border-brand" /></div></div></section>
          <section className="space-y-4 border-t border-outline pt-5"><div><h3 className="text-sm font-semibold text-foreground">Redes sociales</h3><p className="mt-1 text-xs text-muted">Agrega los enlaces que quieras mostrar públicamente.</p></div><div className="grid gap-4 sm:grid-cols-2"><TextField id="business-instagram" label="Instagram" placeholder="https://instagram.com/tu-negocio" value={form.socials.instagram} onChange={(event) => updateSocial('instagram', event.target.value)} maxLength={240} /><TextField id="business-facebook" label="Facebook" placeholder="https://facebook.com/tu-negocio" value={form.socials.facebook} onChange={(event) => updateSocial('facebook', event.target.value)} maxLength={240} /><TextField id="business-tiktok" label="TikTok" placeholder="https://tiktok.com/@tu-negocio" value={form.socials.tiktok} onChange={(event) => updateSocial('tiktok', event.target.value)} maxLength={240} /></div></section>
          <section className="space-y-4 border-t border-outline pt-5"><div><h3 className="text-sm font-semibold text-foreground">Horario de atención</h3><p className="mt-1 text-xs text-muted">Configura una jornada por día.</p></div><div className="space-y-2">{DAYS.map(({ key, label }) => { const schedule = form.hours[key]; return <div key={key} className="grid gap-3 rounded-lg border border-outline bg-canvas p-3 sm:grid-cols-[1fr_1fr_1fr]"><label className="flex items-center gap-2 text-sm font-medium text-foreground"><input type="checkbox" checked={schedule.open} onChange={(event) => updateHours(key, 'open', event.target.checked)} className="size-4 accent-brand" />{label}</label><TextField id={`hours-${key}-open`} label="Apertura" type="time" value={schedule.openTime} onChange={(event) => updateHours(key, 'openTime', event.target.value)} required={schedule.open} disabled={!schedule.open} /><TextField id={`hours-${key}-close`} label="Cierre" type="time" value={schedule.closeTime} onChange={(event) => updateHours(key, 'closeTime', event.target.value)} required={schedule.open} disabled={!schedule.open} /></div> })}</div></section>
        </fieldset>
        {isAdmin && <div className="flex justify-end border-t border-outline pt-4"><Button type="submit"><Save size={16} />Guardar cambios</Button></div>}
      </form>
    </div>
  )
}

export default SettingsPage

