import { useEffect } from 'react'
import { X } from 'lucide-react'

function Modal({ title, description, children, onClose, wide = false }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`my-auto w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden rounded-xl border border-outline bg-surface shadow-2xl`}>
        <header className="flex items-start justify-between gap-4 border-b border-outline px-5 py-4 sm:px-6">
          <div className="min-w-0"><h2 id="dialog-title" className="text-lg font-semibold text-foreground">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-secondary hover:text-foreground" aria-label="Cerrar ventana"><X size={18} /></button>
        </header>
        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto p-5 sm:p-6">{children}</div>
      </section>
    </div>
  )
}

export default Modal