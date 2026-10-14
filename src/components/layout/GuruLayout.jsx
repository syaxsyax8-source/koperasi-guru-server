import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useCartStore } from '../../store'
import { useGuruSocket } from '../../hooks/useSocket'

const MENU = [
  { to: '/guru', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/guru/katalog', label: 'Katalog', icon: '🛍️' },
  { to: '/guru/keranjang', label: 'Keranjang', icon: '🛒', badge: true },
  { to: '/guru/riwayat', label: 'Riwayat', icon: '📋' },
  { to: '/guru/profil', label: 'Profil', icon: '👤' },
]
const BOTTOM_NAV = MENU.slice(0, 5)

// Hook: sembunyikan bottom nav saat scroll down, tampilkan saat scroll up / tap
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const currentY = window.scrollY
        // Sembunyikan kalau scroll ke bawah > 40px dari posisi terakhir
        if (currentY > lastY.current + 8 && currentY > 60) {
          setHidden(true)
        } else if (currentY < lastY.current - 4) {
          setHidden(false)
        }
        lastY.current = currentY
        ticking.current = false
      })
    }

    // Tap / click di mana saja → tampilkan kembali
    const onTap = () => setHidden(false)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('touchstart', onTap, { passive: true })
    window.addEventListener('click', onTap, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTap)
      window.removeEventListener('click', onTap)
    }
  }, [])

  return hidden
}

export default function GuruLayout() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const cartCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.qty, 0))
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navHidden = useHideOnScroll()

  useGuruSocket(user?.id)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex min-h-screen bg-sky-50">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR (hanya desktop / tablet landscape) ── */}
      <aside className={`
        bg-grad-sidebar fixed top-0 left-0 bottom-0 w-64 z-50
        flex flex-col shadow-xl
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/15">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-md flex-shrink-0">🏪</div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">Koperasi Guru</h2>
            <p className="text-white/60 text-[11px] mt-0.5">Digital Cooperative</p>
          </div>
        </div>

        {/* User */}
        <div className="mx-3 my-3 p-3 bg-white/10 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-cyan-700 font-bold text-base flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-[13px] truncate">{user?.name}</p>
            <p className="text-white/60 text-[11px] truncate">Guru {user?.mapel}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {MENU.map(m => (
            <NavLink
              key={m.to} to={m.to} end={m.end}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg w-6 text-center flex-shrink-0">{m.icon}</span>
              <span className="flex-1 text-sm">{m.label === 'Katalog' ? 'Katalog Produk' : m.label}</span>
              {m.badge && cartCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/70 text-[13px] font-medium hover:bg-red-500/20 hover:text-white transition-all">
            🚪 <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-sky-100 px-3 sm:px-5 py-3 flex items-center gap-3 shadow-sm">
          {/* Hamburger — hanya mobile/tablet */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-sky-50 active:bg-sky-100 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <div className="space-y-1.5 w-5">
              <span className="block w-full h-0.5 bg-gray-500 rounded" />
              <span className="block w-full h-0.5 bg-gray-500 rounded" />
              <span className="block w-full h-0.5 bg-gray-500 rounded" />
            </div>
          </button>

          {/* Brand mobile */}
          <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">🏪</span>
            <span className="font-bold text-gray-800 text-sm truncate">Koperasi Guru</span>
          </div>
          <div className="hidden lg:flex flex-1" />

          {/* Cart icon */}
          <button
            onClick={() => navigate('/guru/keranjang')}
            className="relative p-2 rounded-xl hover:bg-sky-50 text-xl flex-shrink-0"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-sky-50 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-grad-main flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:block max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
          </div>
        </header>

        {/* Page content — padding bawah besar di mobile (buat bottom nav) */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 main-page-content min-w-0">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* ── BOTTOM NAVIGATION (mobile & tablet only, hidden on lg) ── */}
      <nav className={`bottom-nav ${navHidden ? 'nav-hidden' : ''}`}>
        {BOTTOM_NAV.map(m => (
          <NavLink
            key={m.to} to={m.to} end={m.end}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="relative">
              <span className="nav-icon">{m.icon}</span>
              {m.badge && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span>{m.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
