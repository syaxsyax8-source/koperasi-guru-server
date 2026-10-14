import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useTxStore } from '../../store'
import { MONTHS, formatRp } from '../../utils/data'

export default function AdminLaporan() {
  const { transactions, fetch } = useTxStore()
  const now = new Date()
  const [selYear, setSelYear] = useState(now.getFullYear())

  useEffect(() => { fetch() }, [])

  const monthlyData = MONTHS.map((label, mi) => {
    const txs = transactions.filter(t => {
      const d = new Date(t.createdAt)
      return d.getMonth() === mi && d.getFullYear() === selYear && t.status === 'selesai'
    })
    const pendapatan = txs.reduce((s, t) => s + t.total, 0)
    const txCount = txs.length
    const guruAktif = new Set(txs.map(t => t.guruId)).size
    return { label: label.substring(0, 3), fullLabel: label, pendapatan, txCount, guruAktif }
  })

  const totalPendapatan = monthlyData.reduce((s, d) => s + d.pendapatan, 0)
  const totalTx = monthlyData.reduce((s, d) => s + d.txCount, 0)
  const bulanAktif = monthlyData.filter(d => d.pendapatan > 0).length
  const bulanTerbaik = monthlyData.reduce((a, b) => a.pendapatan > b.pendapatan ? a : b)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-sky-100 rounded-xl p-3 shadow-lg text-sm">
          <p className="font-bold text-gray-700 mb-1">{label}</p>
          <p className="text-cyan-700 font-semibold">{formatRp(payload[0]?.value || 0)}</p>
          {payload[1] && <p className="text-gray-400">{payload[1].value} transaksi</p>}
        </div>
      )
    }
    return null
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">📈 Laporan Keuangan</h1>
          <p className="text-sm text-gray-400">Analisis pendapatan & kinerja koperasi</p>
        </div>
        <select className="input w-28" value={selYear} onChange={e => setSelYear(+e.target.value)}>
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary stats */}
      <div className="stats-grid-auto mb-5">
        {[
          { icon: '💰', label: `Total Pendapatan ${selYear}`, val: formatRp(totalPendapatan), color: 'bg-cyan-50' },
          { icon: '🏆', label: 'Bulan Terbaik', val: bulanTerbaik.fullLabel, sub: formatRp(bulanTerbaik.pendapatan), color: 'bg-amber-50' },
          { icon: '📋', label: 'Total Transaksi', val: totalTx, color: 'bg-sky-50' },
          { icon: '📊', label: 'Rata-rata/Bulan Aktif', val: bulanAktif > 0 ? formatRp(Math.round(totalPendapatan / bulanAktif)) : '-', color: 'bg-emerald-50' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`card ${s.color}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-lg font-extrabold text-gray-800">{s.val}</div>
            {s.sub && <div className="text-xs text-cyan-600 font-semibold">{s.sub}</div>}
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">📊 Pendapatan Per Bulan — {selYear}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pendapatan" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart transaksi */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">📉 Jumlah Transaksi Per Bulan</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip formatter={(v) => [v, 'Transaksi']} />
            <Line type="monotone" dataKey="txCount" stroke="#0891b2" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table */}
      <div className="card overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-4">📋 Detail Per Bulan</h3>
        <table className="data-table">
          <thead>
            <tr><th>Bulan</th><th>Pendapatan</th><th>Transaksi</th><th>Guru Aktif</th><th>Rata-rata/Guru</th></tr>
          </thead>
          <tbody>
            {monthlyData.map((d, i) => (
              <tr key={i} className={i === now.getMonth() && selYear === now.getFullYear() ? 'bg-cyan-50 font-semibold' : ''}>
                <td>
                  {d.fullLabel}
                  {i === now.getMonth() && selYear === now.getFullYear() && (
                    <span className="badge badge-cyan ml-2">Bulan ini</span>
                  )}
                </td>
                <td className="font-bold text-cyan-700">{d.pendapatan > 0 ? formatRp(d.pendapatan) : '-'}</td>
                <td>{d.txCount || '-'}</td>
                <td>{d.guruAktif || '-'}</td>
                <td>{d.guruAktif > 0 ? formatRp(Math.round(d.pendapatan / d.guruAktif)) : '-'}</td>
              </tr>
            ))}
            <tr className="bg-sky-50 font-extrabold">
              <td>TOTAL {selYear}</td>
              <td className="text-cyan-700">{formatRp(totalPendapatan)}</td>
              <td>{totalTx}</td>
              <td>—</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
