import { useEffect, useState } from 'react'
import { useTxStore } from '../../store'
import { GURU_LIST, QUOTA_MIN, MONTHS, formatRp } from '../../utils/data'

export default function AdminGuru() {
  const { transactions, fetch } = useTxStore()
  const now = new Date()
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetch() }, [])

  const getTotal = (guruId) => transactions
    .filter(t => t.guruId === guruId && new Date(t.createdAt).getMonth() === selMonth && new Date(t.createdAt).getFullYear() === selYear && t.status === 'selesai')
    .reduce((s, t) => s + t.total, 0)

  let gurus = GURU_LIST.map(g => {
    const total = getTotal(g.id)
    const txCount = transactions.filter(t => t.guruId === g.id && new Date(t.createdAt).getMonth() === selMonth && new Date(t.createdAt).getFullYear() === selYear).length
    return { ...g, total, txCount, pct: Math.min(100, (total / QUOTA_MIN) * 100) }
  })
  if (q) gurus = gurus.filter(g => g.name.toLowerCase().includes(q.toLowerCase()) || g.mapel.toLowerCase().includes(q.toLowerCase()))
  if (filterStatus === 'done') gurus = gurus.filter(g => g.total >= QUOTA_MIN)
  else if (filterStatus === 'partial') gurus = gurus.filter(g => g.total > 0 && g.total < QUOTA_MIN)
  else if (filterStatus === 'none') gurus = gurus.filter(g => g.total === 0)

  const sudah = GURU_LIST.filter(g => getTotal(g.id) >= QUOTA_MIN).length

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">👨‍🏫 Data Guru</h1>
          <p className="text-sm text-gray-400">{sudah}/{GURU_LIST.length} guru sudah memenuhi quota</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input w-36" value={selMonth} onChange={e => setSelMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="input w-24" value={selYear} onChange={e => setSelYear(+e.target.value)}>
            {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input className="input w-44" placeholder="🔍 Cari guru..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {[['all','Semua'],['done','✅ Terpenuhi'],['partial','⚠️ Sebagian'],['none','❌ Belum']].map(([key, label]) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === key ? 'bg-grad-main text-white' : 'bg-white border border-sky-200 text-gray-500 hover:border-sky-400'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>#</th><th>Nama Guru</th><th>Mapel</th><th>Transaksi</th><th>Total Belanja</th><th>Progress</th><th>Status</th></tr></thead>
          <tbody>
            {gurus.map((g, i) => (
              <tr key={g.id}>
                <td className="text-gray-300 text-xs">{i + 1}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-grad-main flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{g.name.charAt(0)}</div>
                    <div><p className="font-semibold text-xs">{g.name}</p><p className="text-[10px] text-gray-400">{g.id}</p></div>
                  </div>
                </td>
                <td className="text-xs">{g.mapel}</td>
                <td className="text-center"><span className="badge badge-blue">{g.txCount}</span></td>
                <td className="font-bold text-cyan-700">{formatRp(g.total)}</td>
                <td className="min-w-[120px]">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${g.pct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{g.pct.toFixed(0)}%</p>
                </td>
                <td>
                  <span className={`badge ${g.total >= QUOTA_MIN ? 'badge-green' : g.total > 0 ? 'badge-yellow' : 'badge-red'}`}>
                    {g.total >= QUOTA_MIN ? '✅ Terpenuhi' : g.total > 0 ? '⚠️ Sebagian' : '❌ Belum'}
                  </span>
                </td>
              </tr>
            ))}
            {gurus.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
