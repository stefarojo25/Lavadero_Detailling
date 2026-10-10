import { useEffect, useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE, validatePhotoFile } from '../../services/photoStorage.js'

function PhotoGallery({ label, photos, readFile, onSave, onDelete, canUpload, canDelete }) {
  const [selected, setSelected] = useState(null)
  const [loadedPhotos, setLoadedPhotos] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const urls = []
    async function loadPhotos() {
      const result = await Promise.all(photos.map(async (photo) => {
        try {
          const file = await readFile(photo.id)
          if (!file) return { photo, error: 'El archivo local ya no está disponible.' }
          const url = URL.createObjectURL(file)
          urls.push(url)
          return { photo, url }
        } catch {
          return { photo, error: 'No se pudo leer el archivo local.' }
        }
      }))
      if (!cancelled) setLoadedPhotos(result)
      else urls.forEach((url) => URL.revokeObjectURL(url))
    }
    loadPhotos()
    return () => {
      cancelled = true
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos, readFile])

  useEffect(() => () => {
    if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl)
  }, [selected])

  function selectFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      validatePhotoFile(file)
      setSelected({ file, previewUrl: URL.createObjectURL(file) })
      setError('')
    } catch (validationError) {
      setError(validationError.message)
    }
  }

  function cancelSelection() {
    setSelected(null)
    setError('')
  }

  async function saveSelection() {
    if (!selected || saving) return
    setSaving(true)
    setError('')
    try {
      await onSave(selected.file)
      setSelected(null)
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar la fotografía.')
    } finally {
      setSaving(false)
    }
  }

  const accept = ALLOWED_PHOTO_TYPES.join(',')

  return (
    <section className="min-w-0 rounded-lg border border-outline bg-canvas p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground">{label}</h4>
        {canUpload && !selected && <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline bg-surface px-2.5 text-xs font-medium text-foreground hover:border-brand/50"><ImagePlus size={14} />Agregar<input type="file" accept={accept} onChange={selectFile} className="sr-only" /></label>}
      </div>
      <p className="mt-1 text-[11px] text-muted">JPEG, PNG o WEBP · máximo {Math.round(MAX_PHOTO_SIZE / (1024 * 1024))} MB</p>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
      {selected && <div className="mt-3 overflow-hidden rounded-md border border-brand/30"><img src={selected.previewUrl} alt={`Vista previa: ${selected.file.name}`} className="aspect-4/3 w-full bg-surface-secondary object-cover" /><p className="truncate px-2 py-1.5 text-xs text-muted">Pendiente de guardar · {selected.file.name}</p><div className="flex justify-end gap-2 p-2 pt-0"><Button type="button" variant="secondary" onClick={cancelSelection}><X size={14} />Cancelar</Button><Button type="button" onClick={saveSelection} disabled={saving}>{saving ? 'Guardando…' : 'Guardar foto'}</Button></div></div>}
      {!selected && loadedPhotos.length > 0 && <ul className="mt-3 grid grid-cols-2 gap-2">{loadedPhotos.map(({ photo, url, error: loadError }) => <li key={photo.id} className="relative overflow-hidden rounded-md border border-outline">{url ? <img src={url} alt={photo.fileName || label} className="aspect-4/3 w-full bg-surface-secondary object-cover" /> : <div className="grid aspect-4/3 place-items-center bg-surface-secondary p-2 text-center text-xs text-muted">{loadError}</div>}{canDelete && <Button type="button" variant="secondary" onClick={() => onDelete(photo.id)} className="absolute right-1 top-1 grid size-8 place-items-center p-0" aria-label={`Eliminar ${photo.fileName || 'fotografía'}`} title="Eliminar fotografía"><Trash2 size={14} /></Button>}<p className="truncate px-2 py-1 text-[11px] text-muted">{photo.fileName}</p></li>)}</ul>}
      {!selected && loadedPhotos.length === 0 && <p className="mt-2 text-xs text-muted">Sin fotografías guardadas.</p>}
    </section>
  )
}

export default PhotoGallery
