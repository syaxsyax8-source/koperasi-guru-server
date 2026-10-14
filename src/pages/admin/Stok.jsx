import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useStockStore } from '../../store'
import { PRODUCTS, formatRp } from '../../utils/data'

export default function AdminStok() {
  const { stock, fetchStock, updateStock, restock } = useStockStore()
  const [q, setQ] = useState('')
  const [editVals, setEditVals] = useState({})

  useEffect(() => { fetchStock() }, [])

  const filtered = PRODUCTS.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase())
  )

  const handleUpdate = async (id) => {
    const val = parseInt(editVals[id] ?? stock[id] ?? 0)
    await updateStock(id, val)
    toast.success('Stok diperbarui!')
  }

  const handleRestock = async (id, name) => {
    await restock(id, 50)
    toast.success(`${name}: +50 unit ditambahkan`)
  }

  const habis = PRODUCTS.filter(p => (stock[p.id] ?? p.stock) <= 0).length
  const terbatas = PRODUCTS.filter(p => { const s = stock[p.id] ?? p.stock; return s > 0 && s <= 10 }).length

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">📦 Manajemen Stok</h1>
          <p className="text-sm text-gray-400">{PRODUCTS.length} produk terdaftar</p>
        </div>
        <input className="input w-52" placeholder="🔍 Cari produk..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card bg-emerald-50">
          <p className="text-2xl font-black text-emerald-700">{PRODUCTS.length - habis - terbatas}</p>
          <p className="text-xs text-gray-400 mt-1">✅ Stok Cukup</p>
        </div>
        <div className="card bg-amber-50">
          <p className="text-2xl font-black text-amber-600">{terbatas}</p>
          <p className="text-xs text-gray-400 mt-1">⚠️ Stok Terbatas</p>
        </div>
        <div className="card bg-red-50">
          <p className="text-2xl font-black text-red-500">{habis}</p>
          <p className="text-xs text-gray-400 mt-1">❌ Stok Habis</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const cur = stock[p.id] ?? p.stock
              const val = editVals[p.id] ?? cur
              return (
                <tr key={p.id}>
                  <td className="text-gray-300 text-xs">{i + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <img src={p.img} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=60' }} />
                      <div>
                        <p className="font-semibold text-xs">{p.name}</p>
                        <p className="text-[10px] text-gray-400">/{p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-cyan">{p.category}</span></td>
                  <td className="font-bold text-cyan-700">{formatRp(p.price)}</td>
                  <td>
                    <input
                      type="number" min={0}
                      value={val}
                      onChange={e => setEditVals(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onBlur={() => handleUpdate(p.id)}
                      className="w-20 px-2 py-1.5 border-[1.5px] border-sky-200 rounded-lg text-sm font-bold text-center focus:border-sky-400 outline-none"
                    />
                  </td>
                  <td>
                    <span className={`badge ${cur > 10 ? 'badge-green' : cur > 0 ? 'badge-yellow' : 'badge-red'}`}>
                      {cur > 10 ? '✅ Cukup' : cur > 0 ? '⚠️ Terbatas' : '❌ Habis'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-success btn-sm" onClick={() => handleRestock(p.id, p.name)}>
                      +50 Restok
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
