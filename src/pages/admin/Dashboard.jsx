import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTxStore, useNotifStore, useStockStore } from '../../store'
import { GURU_LIST, QUOTA_MIN, MONTHS, PRODUCTS, formatRp, formatDate } from '../../utils/data'

export default function AdminDashboard() {
  const { transactions, fetch } = useTxStore()
  const { unread } = useNotifStore()
  const { stock } = useStockStore()
  const navigate = useNavigate()
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())

  useEffect(() => { fetch() }, [])

  const txMonth = transactions.filter(t => {
    const d = new Date(t.createdAt)
    return d.getMonth() === selMonth && d.getFullYear() === selYear && t.status === 'selesai'
  })
  const pendapatan = txMonth.reduce((s, t) => s + t.total, 0)

  const guruSudah = GURU_LIST.filter(g => {
    const total = transactions
      .filter(t => t.guruId === g.id && new Date(t.createdAt).getMonth() === selMonth && new Date(t.createdAt).getFullYear() === selYear && t.status === 'selesai')
      .reduce((s, t) => s + t.total, 0)
    return total >= QUOTA_MIN
  }).length

  const stokHabis = PRODUCTS.filter(p => (stock[p.id] ?? p.stock) <= 0).length
  const cashTotal = txMonth.filter(t => t.method === 'cash').reduce((s, t) => s + t.total, 0)
  const potongTotal = txMonth.filter(t => t.method === 'potong_gaji').reduce((s, t) => s + t.total, 0)
  const payTotal = cashTotal + potongTotal || 1

  const stats = [
    { icon: '💰', label: 'Pendapatan Bulan Ini', val: formatRp(pendapatan), sub: `${MONTHS[selMonth]} ${selYear}`, color: 'bg-cyan-50' },
    { icon: '👥', label: 'Guru Quota Terpenuhi', val: `${guruSudah}/${GURU_LIST.length}`, sub: `${((guruSudah / GURU_LIST.length) * 100).toFixed(0)}% terpenuhi`, color: 'bg-emerald-50' },
    { icon: '📋', label: 'Transaksi Bulan Ini', val: txMonth.length, sub: `${transactions.length} total`, color: 'bg-sky-50' },
    { icon: '🔔', label: 'Notif Belum Dibaca', val: unread, sub: 'real-time', color: 'bg-amber-50', action: () => {} },
  ]

  const recent = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filter */}
      <div className="card flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-500">📅 Filter:</span>
        <select className="input w-36" value={selMonth} onChange={e => setSelMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select className="input w-24" value={selYear} onChange={e => setSelYear(+e.target.value)}>
          {[selYear - 1, selYear, selYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-600">Real-time aktif</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid-auto mb-5">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            onClick={s.action} className={`card card-hover ${s.color} ${s.action ? 'cursor-pointer' : ''}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xl font-extrabold text-gray-800">{s.val}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quota */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">👨‍🏫 Status Quota Guru</h3>
            <span className="badge badge-cyan">{MONTHS[selMonth]}</span>
          </div>
          <div className="flex justify-around mb-4">
            <div className="text-center">
              <div className="text-4xl font-black text-emerald-500">{guruSudah}</div>
              <p className="text-xs text-gray-400 mt-1">Sudah ≥100rb</p>
            </div>
            <div className="w-px bg-sky-100" />
            <div className="text-center">
              <div className="text-4xl font-black text-red-400">{GURU_LIST.length - guruSudah}</div>
              <p className="text-xs text-gray-400 mt-1">Belum Cukup</p>
            </div>
          </div>
          <div className="progress-track h-3 mb-2">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(guruSudah / GURU_LIST.length * 100).toFixed(0)}%` }} transition={{ duration: 0.8 }} className="progress-fill" />
          </div>
          <p className="text-xs text-gray-400 text-center">{(guruSudah / GURU_LIST.length * 100).toFixed(0)}% guru sudah memenuhi quota</p>
          <button className="btn-secondary w-full justify-center mt-4 text-xs" onClick={() => navigate('/admin/guru')}>Lihat Detail →</button>
        </div>

        {/* Metode bayar */}
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">💳 Metode Pembayaran</h3>
          {[
            { label: '💵 Tunai', val: cashTotal, pct: ((cashTotal / payTotal) * 100).toFixed(0) },
            { label: '💳 Potong Gaji', val: potongTotal, pct: ((potongTotal / payTotal) * 100).toFixed(0) },
          ].map((m, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-gray-600">{m.label}</span>
                <span className="font-bold text-cyan-700">{formatRp(m.val)}</span>
              </div>
              <div className="progress-track">
                <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.8, delay: i * 0.2 }} className="progress-fill" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{m.pct}% dari total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaksi terbaru */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800">🕐 Transaksi Terbaru</h3>
          <button className="btn-secondary btn-sm" onClick={() => navigate('/admin/transaksi')}>Lihat Semua</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Guru</th><th>Total</th><th>Metode</th><th>Tanggal</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(tx => (
                <tr key={tx.id}>
                  <td className="font-bold text-cyan-600 text-xs">{tx.id}</td>
                  <td><p className="font-semibold text-xs">{tx.guruName}</p><p className="text-[10px] text-gray-400">{tx.mapel}</p></td>
                  <td className="font-bold text-cyan-700">{formatRp(tx.total)}</td>
                  <td><span className={`badge ${tx.method === 'cash' ? 'badge-blue' : 'badge-cyan'}`}>{tx.method === 'cash' ? '💵' : '💳'} {tx.method === 'cash' ? 'Tunai' : 'Potong Gaji'}</span></td>
                  <td className="text-xs text-gray-400">{formatDate(tx.createdAt)}</td>
                  <td><span className={`badge ${tx.status === 'selesai' ? 'badge-green' : 'badge-yellow'}`}>{tx.status === 'selesai' ? '✅' : '⏳'} {tx.status}</span></td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Belum ada transaksi</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
