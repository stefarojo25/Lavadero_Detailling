import { Link, Outlet } from 'react-router-dom'
import { ROUTES } from '../app/routes.js'

function PublicLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-canvas text-foreground">
      <header className="flex h-16 shrink-0 items-center border-b border-outline px-4 sm:px-6">
        <Link to={ROUTES.PUBLIC_VEHICLE} className="flex items-center gap-3 rounded-md focus-visible:outline-offset-4" aria-label="Lavadero Detailing, página pública">
          <span className="grid size-9 place-items-center rounded-lg border border-brand/25 bg-brand/10" aria-hidden="true"><span className="size-2.5 rounded-full bg-brand" /></span>
          <span className="text-sm font-semibold tracking-wide">Lavadero Detailing</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"><div className="w-full max-w-lg"><Outlet /></div></main>
    </div>
  )
}

export default PublicLayout
