import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useTxStore } from '../../store'
import { QUOTA_MIN, MONTHS, formatRp } from '../../utils/data'

export default function GuruProfil() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { transactions, fetchByGuru } = useTxStore()
  const navigate = useNavigate()
  const now = new Date()

  useEffect(() => { if (user?.id) fetchByGuru(user.id) }, [user?.id])

  const selesai = transactions.filter(t => t.guruId === user?.id && t.status === 'selesai')
  const monthTotal = selesai
    .filter(t => new Date(t.createdAt).getMonth() === now.getMonth() && new Date(t.createdAt).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + t.total, 0)
  const allTotal = selesai.reduce((s, t) => s + t.total, 0)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="max-w-lg animate-fade-in space-y-5">
      {/* Avatar card */}
      <div className="card text-center py-8">
        <div className="w-20 h-20 bg-grad-main rounded-full flex items-center justify-center text-4xl font-black text-white mx-auto mb-4 shadow-lg shadow-cyan-200">
          {user?.name?.charAt(0)}
        </div>
        <h2 className="text-xl font-extrabold text-gray-800">{user?.name}</h2>
        <p className="text-gray-400 text-sm mt-1">Guru {user?.mapel}</p>
        <span className="badge badge-cyan mt-2">ID: {user?.id}</span>
      </div>

      {/* Stats */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">📊 Statistik Belanja</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: `Bulan ${MONTHS[now.getMonth()]}`, val: formatRp(monthTotal), color: 'bg-cyan-50' },
            { label: 'Total Transaksi', val: selesai.length, color: 'bg-sky-50' },
            { label: 'Total Belanja', val: formatRp(allTotal), color: 'bg-teal-50' },
            { label: 'Status Quota', val: monthTotal >= QUOTA_MIN ? '✅ Terpenuhi' : '⏳ Belum', color: monthTotal >= QUOTA_MIN ? 'bg-emerald-50' : 'bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.color} rounded-xl p-4 text-center`}>
              <p className="font-extrabold text-gray-800 text-base">{s.val}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info akun */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">👤 Informasi Akun</h3>
        {[
          ['Nama Lengkap', user?.name],
          ['Mata Pelajaran', user?.mapel],
          ['Username', user?.user],
          ['ID Guru', user?.id],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5 border-b border-sky-50 last:border-0">
            <span className="text-sm text-gray-400">{k}</span>
            <span className="text-sm font-semibold text-gray-700">{v}</span>
          </div>
        ))}
        <button className="btn-danger w-full justify-center mt-4" onClick={handleLogout}>🚪 Keluar</button>
      </div>
    </div>
  )
}
