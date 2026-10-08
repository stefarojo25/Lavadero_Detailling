import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header.jsx'
import MobileNavigation from '../components/layout/MobileNavigation.jsx'
import Sidebar from '../components/layout/Sidebar.jsx'

function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-canvas text-foreground">
      <div className="hidden h-full shrink-0 lg:block"><Sidebar /></div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main id="main-content" tabIndex="-1" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-28 lg:px-8 lg:pb-8"><div className="mx-auto w-full max-w-screen-2xl"><Outlet /></div></main>
      </div>
      <MobileNavigation />
      {menuOpen && <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación"><button type="button" className="absolute inset-0 cursor-default bg-black/70" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" /><div className="relative h-full"><Sidebar mobile onClose={() => setMenuOpen(false)} onNavigate={() => setMenuOpen(false)} /></div></div>}
    </div>
  )
}

export default DashboardLayout

