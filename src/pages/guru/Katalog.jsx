import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useCartStore, useStockStore } from '../../store'
import { PRODUCTS, CATEGORIES, formatRp } from '../../utils/data'

export default function GuruKatalog() {
  const { items, addItem } = useCartStore()
  const { stock, fetchStock } = useStockStore()
  const [cat, setCat] = useState('Semua')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchStock() }, [])

  const filtered = PRODUCTS.filter(p =>
    (cat === 'Semua' || p.category === cat) &&
    (!q || p.name.toLowerCase().includes(q.toLowerCase()))
  )

  const addToCart = (p) => {
    if ((stock[p.id] ?? p.stock) <= 0) { toast.error('Stok habis!'); return }
    addItem(p)
    toast.success(`${p.name} ditambahkan! 🛒`)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div><h1 className="text-xl font-extrabold text-gray-800">🛍️ Katalog Produk</h1>
          <p className="text-sm text-gray-400">Produk sembako & kebutuhan pokok</p></div>
        <input className="input sm:w-56" placeholder="🔍 Cari produk..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${cat === c ? 'bg-grad-main text-white' : 'bg-white border border-sky-200 text-gray-500 hover:border-sky-400'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="product-grid">
        {filtered.map((p, i) => {
          const inStock = (stock[p.id] ?? p.stock)
          const inCart = items.find(x => x.productId === p.id)?.qty || 0
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              onClick={() => setSelected(p)}>
              <img src={p.img} alt={p.name} className="w-full h-32 object-cover" loading="lazy"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=60' }} />
              <div className="p-3">
                <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wide">{p.category}</p>
                <p className="text-xs font-bold text-gray-800 mt-1 leading-tight">{p.name}</p>
                <p className="text-sm font-extrabold text-cyan-700 mt-2">{formatRp(p.price)}</p>
                <p className={`text-[10px] mt-1 ${inStock > 10 ? 'text-gray-400' : inStock > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                  {inStock > 0 ? `Stok: ${inStock}` : '❌ Habis'}
                </p>
                <button onClick={e => { e.stopPropagation(); addToCart(p) }} disabled={inStock <= 0}
                  className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold bg-grad-main text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                  {inCart > 0 ? `🛒 +1 (${inCart})` : '🛒 Tambah'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <img src={selected.img} alt={selected.name} className="w-full h-48 object-cover rounded-t-3xl sm:rounded-t-3xl"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=60' }} />
              <div className="p-5">
                <span className="badge badge-cyan">{selected.category}</span>
                <h2 className="text-xl font-extrabold text-gray-800 mt-2">{selected.name}</h2>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{selected.desc}</p>
                <div className="flex justify-between items-center mt-4 p-3 bg-sky-50 rounded-xl">
                  <div><p className="text-2xl font-black text-cyan-700">{formatRp(selected.price)}</p><p className="text-xs text-gray-400">per {selected.unit}</p></div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${(stock[selected.id] ?? selected.stock) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Stok: {stock[selected.id] ?? selected.stock}
                    </p>
                  </div>
                </div>
                <button onClick={() => { addToCart(selected); setSelected(null) }} disabled={(stock[selected.id] ?? selected.stock) <= 0}
                  className="btn-primary btn-lg w-full justify-center mt-4 disabled:opacity-40">
                  🛒 Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
