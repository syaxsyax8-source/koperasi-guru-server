import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore, useCartStore, useTxStore } from '../../store'
import { QUOTA_MIN, formatRp } from '../../utils/data'

export default function GuruKeranjang() {
  const user = useAuthStore(s => s.user)
  const { items, changeQty, removeItem, clearCart } = useCartStore()
  const { transactions, checkout } = useTxStore()
  const navigate = useNavigate()
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const now = new Date()
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const monthTotal = transactions
    .filter(t =>
      t.guruId === user?.id &&
      t.status === 'selesai' &&
      new Date(t.createdAt).getMonth() === now.getMonth() &&
      new Date(t.createdAt).getFullYear() === now.getFullYear()
    )
    .reduce((s, t) => s + (t.total || 0), 0)
  const newTotal = monthTotal + total
  const pct = Math.min(100, (newTotal / QUOTA_MIN) * 100)

  const handleCheckout = async () => {
    if (!items.length) { toast.error('Keranjang masih kosong!'); return }
    if (!user?.id) { toast.error('Sesi habis, silakan login ulang.'); return }

    setLoading(true)
    try {
      const result = await checkout({
        guruId: user.id,
        guruName: user.name,
        mapel: user.mapel || '-',
        items: items.map(i => ({ ...i })),
        total,
        method,
        note,
        month: now.getMonth(),
        year: now.getFullYear(),
      })
      clearCart()
      setShowModal(false)
      if (result?.via === 'server') {
        toast.success('🎉 Pesanan berhasil! Admin sudah mendapat notifikasi.')
      } else {
        // Server offline — checkout tetap berhasil tapi tanpa notif real-time
        toast.success('✅ Pesanan disimpan! (Server offline — jalankan npm run dev untuk notifikasi admin)')
      }
      navigate('/guru/riwayat')
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // Keranjang kosong
  if (!items.length) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="text-6xl mb-4">🛒</div>
      <h3 className="text-lg font-bold text-gray-700">Keranjang Kosong</h3>
      <p className="text-gray-400 text-sm mt-2">Yuk belanja produk sembako di katalog!</p>
      <button className="btn-primary mt-6" onClick={() => navigate('/guru/katalog')}>
        🛍️ Lihat Katalog
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-xl font-extrabold text-gray-800 mb-4">🛒 Keranjang Belanja</h1>

      {/* Daftar item */}
      <div className="card mb-4">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 py-3 border-b border-sky-50 last:border-0"
            >
              <img
                src={item.img} alt={item.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=60' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{formatRp(item.price)} / {item.unit}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => changeQty(item.productId, -1)}
                  className="w-7 h-7 rounded-lg border border-sky-200 text-gray-600 font-bold flex items-center justify-center hover:border-cyan-400 active:scale-90 transition-all"
                >−</button>
                <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                <button
                  onClick={() => changeQty(item.productId, 1)}
                  className="w-7 h-7 rounded-lg border border-sky-200 text-gray-600 font-bold flex items-center justify-center hover:border-cyan-400 active:scale-90 transition-all"
                >+</button>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-cyan-700 text-sm">{formatRp(item.price * item.qty)}</p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-[10px] text-red-400 hover:text-red-600 mt-0.5"
                >🗑️ Hapus</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex justify-between items-center pt-4 mt-2 border-t border-sky-50">
          <span className="font-bold text-gray-700">Total Belanja</span>
          <span className="text-xl font-black text-cyan-700">{formatRp(total)}</span>
        </div>
      </div>

      {/* Simulasi quota */}
      <div className="card mb-4 bg-grad-card">
        <p className="font-bold text-gray-700 text-sm mb-3">📊 Simulasi Quota Bulan Ini</p>
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Sudah: <b className="text-emerald-600">{formatRp(monthTotal)}</b></span>
          <span>Target: <b>{formatRp(QUOTA_MIN)}</b></span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className={`text-xs mt-2 font-medium ${newTotal >= QUOTA_MIN ? 'text-emerald-600' : 'text-amber-500'}`}>
          {newTotal >= QUOTA_MIN
            ? '✅ Quota akan terpenuhi setelah checkout ini!'
            : `⚠️ Setelah checkout: ${formatRp(newTotal)} (${pct.toFixed(0)}%)`}
        </p>
      </div>

      {/* Tombol aksi */}
      <div className="flex gap-3">
        <button className="btn-secondary flex-1 justify-center" onClick={() => navigate('/guru/katalog')}>
          ← Lanjut Belanja
        </button>
        <button className="btn-primary flex-[2] justify-center" onClick={() => setShowModal(true)}>
          💳 Checkout — {formatRp(total)}
        </button>
      </div>

      {/* ── MODAL CHECKOUT ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5"
            onClick={() => !loading && setShowModal(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="px-5 pt-5 pb-4 border-b border-sky-50">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-800">💳 Konfirmasi Pembayaran</h3>
                  <button
                    onClick={() => !loading && setShowModal(false)}
                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
                  >✕</button>
                </div>
              </div>

              <div className="px-5 py-4">
                {/* Total */}
                <div className="bg-sky-50 rounded-xl p-3 mb-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Total Pembayaran</span>
                  <span className="text-xl font-black text-cyan-700">{formatRp(total)}</span>
                </div>

                {/* Ringkasan item */}
                <div className="mb-4 max-h-32 overflow-y-auto">
                  {items.map(i => (
                    <div key={i.productId} className="flex justify-between text-xs text-gray-500 py-1 border-b border-sky-50 last:border-0">
                      <span>{i.name} <span className="text-gray-400">×{i.qty}</span></span>
                      <span className="font-semibold">{formatRp(i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>

                {/* Metode bayar */}
                <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Metode Pembayaran</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { key: 'cash', icon: '💵', label: 'Tunai', sub: 'Bayar langsung di koperasi' },
                    { key: 'potong_gaji', icon: '💳', label: 'Potong Gaji', sub: 'Dipotong dari gaji bulan ini' },
                  ].map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      className={`border-2 rounded-xl p-3 text-center transition-all ${
                        method === m.key
                          ? 'border-cyan-400 bg-cyan-50 shadow-sm'
                          : 'border-sky-100 hover:border-sky-300 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{m.icon}</div>
                      <p className="font-bold text-gray-700 text-sm">{m.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Catatan */}
                <textarea
                  className="input mb-4 resize-none"
                  rows={2}
                  placeholder="Catatan tambahan (opsional)..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />

                {/* Tombol konfirmasi */}
                <button
                  type="button"
                  className="btn-primary btn-lg w-full justify-center"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Memproses...</span>
                    : `✅ Konfirmasi — ${formatRp(total)}`
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
