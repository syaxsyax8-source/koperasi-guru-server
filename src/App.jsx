import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import LoginPage from './pages/LoginPage'
import GuruLayout from './components/layout/GuruLayout'
import AdminLayout from './components/layout/AdminLayout'
import GuruDashboard from './pages/guru/Dashboard'
import GuruKatalog from './pages/guru/Katalog'
import GuruKeranjang from './pages/guru/Keranjang'
import GuruRiwayat from './pages/guru/Riwayat'
import GuruProfil from './pages/guru/Profil'
import AdminDashboard from './pages/admin/Dashboard'
import AdminGuru from './pages/admin/Guru'
import AdminTransaksi from './pages/admin/Transaksi'
import AdminStok from './pages/admin/Stok'
import AdminLaporan from './pages/admin/Laporan'

function ProtectedRoute({ children, role }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/guru'} replace />
  return children
}

export default function App() {
  const user = useAuthStore(s => s.user)

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/guru'} /> : <LoginPage />} />

      {/* Guru routes */}
      <Route path="/guru" element={<ProtectedRoute role="guru"><GuruLayout /></ProtectedRoute>}>
        <Route index element={<GuruDashboard />} />
        <Route path="katalog" element={<GuruKatalog />} />
        <Route path="keranjang" element={<GuruKeranjang />} />
        <Route path="riwayat" element={<GuruRiwayat />} />
        <Route path="profil" element={<GuruProfil />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="guru" element={<AdminGuru />} />
        <Route path="transaksi" element={<AdminTransaksi />} />
        <Route path="stok" element={<AdminStok />} />
        <Route path="laporan" element={<AdminLaporan />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/guru') : '/login'} />} />
    </Routes>
  )
}
