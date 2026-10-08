import { useState } from 'react'
import { Building2, ImagePlus, Save } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import TextField from '../../components/ui/TextField.jsx'
import { useBusinessData } from '../../hooks/useBusinessData.js'

function SettingsPage() {
  const { data, updateBusiness } = useBusinessData()
  const [form, setForm] = useState({ ...data.business })
  const [feedback, setFeedback] = useState(null)

  function submit(event) {
    event.preventDefault()
    try {
      updateBusiness(form)
      setFeedback({ type: 'success', message: 'Información del negocio guardada.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  function loadLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 512 * 1024) {
      setFeedback({ type: 'error', message: 'Selecciona una imagen de hasta 512 KB.' })
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, logoUrl: String(reader.result) }))
    reader.onerror = () => setFeedback({ type: 'error', message: 'No se pudo leer el archivo seleccionado.' })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div><p className="text-sm text-muted">Perfil del negocio activo</p><h2 className="mt-1 text-2xl font-semibold text-foreground">Mi negocio</h2><p className="mt-2 text-sm text-muted">La información se guarda localmente junto con los datos de demostración.</p></div>
      {feedback && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}
      <form onSubmit={submit} className="space-y-6 rounded-xl border border-outline bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-5 border-b border-outline pb-6 sm:flex-row sm:items-center"><div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-outline bg-surface-secondary text-muted">{form.logoUrl ? <img src={form.logoUrl} alt="Logo del negocio" className="size-full object-cover" /> : <Building2 size={28} />}</div><div><p className="font-medium text-foreground">Logotipo</p><p className="mt-1 text-sm text-muted">Imagen cuadrada, máximo 512 KB.</p><label className="mt-3 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-outline bg-canvas px-3 text-sm font-medium text-foreground hover:border-brand/50"><ImagePlus size={15} />Elegir imagen<input type="file" accept="image/*" onChange={loadLogo} className="sr-only" /></label></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><TextField id="business-name" label="Nombre del negocio" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required maxLength={120} /><SelectField id="business-active" label="Estado" value={String(form.active)} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'true' }))}><option value="true">Activo</option><option value="false">Inactivo</option></SelectField><TextField id="business-phone" label="Teléfono" type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} maxLength={40} /><TextField id="business-email" label="Correo electrónico" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} maxLength={120} /><div className="sm:col-span-2"><TextField id="business-address" label="Dirección" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} maxLength={180} /></div><div className="sm:col-span-2"><label htmlFor="business-description" className="mb-2 block text-sm font-medium text-foreground">Descripción</label><textarea id="business-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={500} className="w-full resize-y rounded-lg border border-outline bg-surface px-3.5 py-3 text-sm text-foreground outline-none focus:border-brand" /></div></div>
        <div className="flex justify-end border-t border-outline pt-4"><Button type="submit"><Save size={16} />Guardar cambios</Button></div>
      </form>
    </div>
  )
}

export default SettingsPage

