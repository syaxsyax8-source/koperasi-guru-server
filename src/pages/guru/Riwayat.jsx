import { useEffect, useState } from 'react'
import { useAuthStore, useTxStore } from '../../store'
import { QUOTA_MIN, MONTHS, formatRp, formatDate } from '../../utils/data'

export default function GuruRiwayat() {
  const user = useAuthStore(s => s.user)
  const { transactions, fetchByGuru } = useTxStore()
  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth())
  const [filterYear] = useState(now.getFullYear())

  useEffect(() => { if (user?.id) fetchByGuru(user.id) }, [user?.id])

  const filtered = transactions
    .filter(t => {
      const d = new Date(t.createdAt)
      return t.guruId === user?.id &&
        d.getMonth() === filterMonth &&
        d.getFullYear() === filterYear
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const periodTotal = filtered.reduce((s, t) => s + t.total, 0)

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">📋 Riwayat Belanja</h1>
          <p className="text-sm text-gray-400">{transactions.length} transaksi total</p>
        </div>
        <select className="input w-auto" value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m} {filterYear}</option>)}
        </select>
      </div>

      {/* Period summary */}
      <div className="card bg-grad-card mb-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-500">Total Belanja {MONTHS[filterMonth]}</p>
            <p className="text-2xl font-black text-cyan-700">{formatRp(periodTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{filtered.length} transaksi</p>
            <span className={`badge ${periodTotal >= QUOTA_MIN ? 'badge-green' : 'badge-yellow'} mt-1`}>
              {periodTotal >= QUOTA_MIN ? '✅ Quota Terpenuhi' : '⚠️ Belum Cukup'}
            </span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-semibold">Belum ada transaksi bulan ini</p>
          <p className="text-sm mt-1">Coba pilih bulan lain atau mulai belanja!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => (
            <div key={tx.id} className="card flex items-start gap-4 hover:border-sky-200 transition-colors">
              <span className="text-2xl mt-1">{tx.method === 'cash' ? '💵' : '💳'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-cyan-700 text-sm">{tx.id}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {tx.items?.map(i => `${i.name} ×${i.qty}`).join(' · ')}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {formatDate(tx.createdAt)} · {tx.method === 'cash' ? 'Tunai' : 'Potong Gaji'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-cyan-700">{formatRp(tx.total)}</p>
                <span className={`badge ${tx.status === 'selesai' ? 'badge-green' : 'badge-yellow'} mt-1`}>
                  {tx.status === 'selesai' ? '✅ Selesai' : '⏳ Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
