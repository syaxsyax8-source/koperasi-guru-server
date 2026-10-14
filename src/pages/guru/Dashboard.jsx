import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore, useTxStore, useCartStore } from '../../store'
import { QUOTA_MIN, MONTHS, formatRp, formatDate } from '../../utils/data'

export default function GuruDashboard() {
  const user = useAuthStore(s => s.user)
  const { transactions, fetchByGuru } = useTxStore()
  const cartCount = useCartStore(s => s.items.reduce((s, i) => s + i.qty, 0))
  const navigate = useNavigate()
  const now = new Date()
  const m = now.getMonth(), y = now.getFullYear()

  useEffect(() => { if (user?.id) fetchByGuru(user.id) }, [user?.id])

  const monthTotal = transactions
    .filter(t => t.guruId === user?.id && t.status === 'selesai' && new Date(t.createdAt).getMonth() === m && new Date(t.createdAt).getFullYear() === y)
    .reduce((s, t) => s + t.total, 0)
  const pct = Math.min(100, (monthTotal / QUOTA_MIN) * 100)
  const remaining = Math.max(0, QUOTA_MIN - monthTotal)
  const recent = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Quota Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-grad-main rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-4 bottom-0 text-7xl opacity-20 select-none">🏪</div>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">📅 {MONTHS[m]} {y}</p>
        <h2 className="text-2xl font-extrabold mt-1">Halo, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-white/80 text-sm mt-1">Status quota belanja bulan ini</p>
        <div className="text-3xl font-black mt-4">{formatRp(monthTotal)}</div>
        <div className="text-white/70 text-sm">dari target {formatRp(QUOTA_MIN)}</div>
        <div className="mt-4 bg-white/25 rounded-full h-2.5 overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-white rounded-full" />
        </div>
        <p className="mt-2 text-sm text-white/85">
          {remaining > 0 ? `⚠️ Masih kurang ${formatRp(remaining)} lagi` : '🎉 Quota bulan ini sudah terpenuhi!'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="stats-grid-auto mb-5">
        {[
          { icon: '💰', label: 'Belanja Bulan Ini', val: formatRp(monthTotal), color: 'bg-cyan-50' },
          { icon: '🛒', label: 'Item Keranjang', val: cartCount, color: 'bg-sky-50', action: () => navigate('/guru/keranjang') },
          { icon: '📋', label: 'Total Transaksi', val: transactions.length, color: 'bg-teal-50' },
          { icon: monthTotal >= QUOTA_MIN ? '✅' : '⏳', label: 'Status Quota', val: monthTotal >= QUOTA_MIN ? 'Terpenuhi' : 'Belum', color: monthTotal >= QUOTA_MIN ? 'bg-emerald-50' : 'bg-amber-50' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            onClick={s.action} className={`card card-hover ${s.color} ${s.action ? 'cursor-pointer' : ''}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-lg font-extrabold text-gray-800">{s.val}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">⚡ Aksi Cepat</h3>
          <div className="space-y-2">
            <button className="btn-primary w-full justify-center" onClick={() => navigate('/guru/katalog')}>🛍️ Belanja Sekarang</button>
            <button className="btn-secondary w-full justify-center" onClick={() => navigate('/guru/riwayat')}>📋 Lihat Riwayat</button>
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">🕐 Transaksi Terakhir</h3>
          {recent.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">Belum ada transaksi</p> : (
            <div className="space-y-2">
              {recent.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-sky-50 last:border-0">
                  <span className="text-xl">{tx.method === 'cash' ? '💵' : '💳'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{tx.id}</p>
                    <p className="text-[11px] text-gray-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className="text-sm font-bold text-cyan-700">{formatRp(tx.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
