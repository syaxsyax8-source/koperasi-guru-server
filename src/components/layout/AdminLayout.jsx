import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useNotifStore } from '../../store'
import { useAdminSocket } from '../../hooks/useSocket'
import { formatTime } from '../../utils/data'

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/guru', label: 'Data Guru', icon: '👨‍🏫' },
  { to: '/admin/transaksi', label: 'Transaksi', icon: '📋' },
  { to: '/admin/stok', label: 'Stok', icon: '📦' },
  { to: '/admin/laporan', label: 'Laporan', icon: '📈' },
]

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
        if (currentY > lastY.current + 8 && currentY > 60) setHidden(true)
        else if (currentY < lastY.current - 4) setHidden(false)
        lastY.current = currentY
        ticking.current = false
      })
    }
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

export default function AdminLayout() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { notifications, unread, fetch: fetchNotifs, markRead, markAllRead, listenRealtime, stopListening } = useNotifStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const navHidden = useHideOnScroll()

  useAdminSocket()

  useEffect(() => {
    // Firebase real-time listener — notif masuk otomatis saat guru checkout
    listenRealtime()
    return () => stopListening()
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex min-h-screen bg-sky-50">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <aside className={`
        bg-grad-sidebar fixed top-0 left-0 bottom-0 w-64 z-50
        flex flex-col shadow-xl
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/15">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-md flex-shrink-0">🏪</div>
          <div>
            <h2 className="text-white font-bold text-sm">Koperasi Guru</h2>
            <p className="text-white/60 text-[11px] mt-0.5">Panel Administrator</p>
          </div>
        </div>

        <div className="mx-3 my-3 p-3 bg-white/10 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">👑</div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-[13px] truncate">{user?.name}</p>
            <p className="text-white/60 text-[11px]">Administrator</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {MENU.map(m => (
            <NavLink
              key={m.to} to={m.to} end={m.end}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg w-6 text-center flex-shrink-0">{m.icon}</span>
              <span className="flex-1 text-sm">
                {m.label === 'Data Guru' ? 'Data Guru' :
                 m.label === 'Transaksi' ? 'Semua Transaksi' :
                 m.label === 'Stok' ? 'Manajemen Stok' :
                 m.label === 'Laporan' ? 'Laporan Keuangan' : m.label}
              </span>
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

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-sky-100 px-3 sm:px-5 py-3 flex items-center gap-3 shadow-sm">
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
            <span className="font-bold text-gray-800 text-sm truncate">Admin Panel</span>
          </div>
          <div className="hidden lg:flex flex-1" />

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg flex-shrink-0">
            <div className="live-dot" />
            <span className="text-xs font-semibold text-emerald-600">Live</span>
          </div>

          {/* Notification Bell */}
          <div className="relative flex-shrink-0" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifs() }}
              className="relative p-2 rounded-xl hover:bg-sky-50 text-xl transition-colors"
            >
              🔔
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 border-2 border-white"
                >
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </button>

            {/* Notif Dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden z-50"
                  style={{ width: 'min(320px, calc(100vw - 24px))' }}
                >
                  <div className="px-4 py-3 border-b border-sky-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-sm">Notifikasi Real-Time</h3>
                    <div className="flex items-center gap-2">
                      <div className="live-dot" />
                      <button onClick={markAllRead} className="text-xs text-cyan-600 font-semibold hover:underline">Baca semua</button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-sky-50">
                    {notifications.length === 0 && (
                      <div className="py-8 text-center text-gray-400 text-sm">Belum ada notifikasi</div>
                    )}
                    {notifications.slice(0, 20).map(n => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        onClick={() => { markRead(n.id); setNotifOpen(false); navigate('/admin/transaksi') }}
                        className={`px-4 py-3 cursor-pointer hover:bg-sky-50 transition-colors ${!n.read ? 'bg-cyan-50/60' : ''}`}
                      >
                        <div className="flex gap-3 items-start">
                          <span className="text-lg mt-0.5 flex-shrink-0">🛒</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold text-gray-800 ${!n.read ? 'text-cyan-700' : ''}`}>{n.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 mt-1.5" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-50 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold">👑</div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:block">Admin</span>
          </div>
        </header>

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

      {/* ── BOTTOM NAV (mobile & tablet only) ── */}
      <nav className={`bottom-nav ${navHidden ? 'nav-hidden' : ''}`}>
        {MENU.map(m => (
          <NavLink
            key={m.to} to={m.to} end={m.end}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{m.icon}</span>
            <span>{m.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
