import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTxStore } from '../../store'
import { MONTHS, formatRp, formatDate } from '../../utils/data'

export default function AdminTransaksi() {
  const { transactions, fetch } = useTxStore()
  const now = new Date()
  const [selMonth, setSelMonth] = useState(-1)
  const [selMethod, setSelMethod] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => { fetch() }, [])

  const filtered = [...transactions]
    .filter(t => {
      const d = new Date(t.createdAt)
      const matchMonth = selMonth < 0 || d.getMonth() === selMonth
      const matchMethod = !selMethod || t.method === selMethod
      const matchQ = !q || t.guruName.toLowerCase().includes(q.toLowerCase()) || t.id.toLowerCase().includes(q.toLowerCase())
      return matchMonth && matchMethod && matchQ
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const total = filtered.reduce((s, t) => s + t.total, 0)

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">📋 Semua Transaksi</h1>
          <p className="text-sm text-gray-400">{filtered.length} transaksi ditemukan</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input w-36" value={selMonth} onChange={e => setSelMonth(+e.target.value)}>
            <option value={-1}>Semua Bulan</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="input w-36" value={selMethod} onChange={e => setSelMethod(e.target.value)}>
            <option value="">Semua Metode</option>
            <option value="cash">Tunai</option>
            <option value="potong_gaji">Potong Gaji</option>
          </select>
          <input className="input w-44" placeholder="🔍 Cari guru / ID..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Nilai', val: formatRp(total), color: 'bg-cyan-50' },
          { label: 'Jumlah Transaksi', val: filtered.length, color: 'bg-sky-50' },
          { label: 'Sudah Selesai', val: filtered.filter(t => t.status === 'selesai').length, color: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className={`card ${s.color}`}>
            <p className="text-xl font-black text-gray-800">{s.val}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Guru</th><th>Produk</th><th>Total</th><th>Metode</th><th>Tanggal</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filtered.map((tx, i) => (
              <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                <td className="font-bold text-cyan-600 text-xs">{tx.id}</td>
                <td>
                  <p className="font-semibold text-xs">{tx.guruName}</p>
                  <p className="text-[10px] text-gray-400">{tx.mapel}</p>
                </td>
                <td className="text-xs text-gray-500 max-w-[160px]">
                  <p className="truncate">{tx.items?.map(i => `${i.name}×${i.qty}`).join(', ')}</p>
                </td>
                <td className="font-bold text-cyan-700">{formatRp(tx.total)}</td>
                <td>
                  <span className={`badge ${tx.method === 'cash' ? 'badge-blue' : 'badge-cyan'}`}>
                    {tx.method === 'cash' ? '💵 Tunai' : '💳 Potong Gaji'}
                  </span>
                </td>
                <td className="text-xs text-gray-400 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                <td>
                  <span className={`badge ${tx.status === 'selesai' ? 'badge-green' : 'badge-yellow'}`}>
                    {tx.status === 'selesai' ? '✅ Selesai' : '⏳ Pending'}
                  </span>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Tidak ada transaksi ditemukan</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
