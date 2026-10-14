import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ref, push, onValue, off, set, get as fbGet, update } from 'firebase/database'
import { db } from '../firebase'
import { PRODUCTS } from '../utils/data'

// ── AUTH STORE ────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: 'koperasi-auth' }
  )
)

// ── CART STORE ─────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items
        const existing = items.find(i => i.productId === product.id)
        if (existing) {
          set({ items: items.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i) })
        } else {
          set({ items: [...items, { productId: product.id, name: product.name, price: product.price, qty: 1, img: product.img, unit: product.unit }] })
        }
      },
      removeItem: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),
      changeQty: (productId, delta) => {
        const items = get().items.map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
        set({ items })
      },
      clearCart: () => set({ items: [] }),
    }),
    { name: 'koperasi-cart' }
  )
)

// ── STOCK STORE ────────────────────────────────────────────
export const useStockStore = create((set, get) => ({
  stock: Object.fromEntries(PRODUCTS.map(p => [p.id, p.stock])),

  setStock: (stock) => set({ stock }),

  fetchStock: async () => {
    try {
      const snap = await fbGet(ref(db, 'stock'))
      if (snap.exists()) {
        const data = snap.val()
        // Merge dengan default stock
        const merged = { ...Object.fromEntries(PRODUCTS.map(p => [p.id, p.stock])), ...data }
        set({ stock: merged })
      }
    } catch { /* pakai default */ }
  },

  updateStock: async (productId, qty) => {
    set({ stock: { ...get().stock, [productId]: parseInt(qty) } })
    try { await set(ref(db, `stock/${productId}`), parseInt(qty)) } catch { /* keep local */ }
  },

  restock: async (productId, amount = 50) => {
    const cur = get().stock[productId] || 0
    const newQty = cur + amount
    set({ stock: { ...get().stock, [productId]: newQty } })
    try { await set(ref(db, `stock/${productId}`), newQty) } catch { /* keep local */ }
  },
}))

// ── TRANSACTION STORE ──────────────────────────────────────
export const useTxStore = create(
  persist(
    (set, get) => ({
      transactions: [],
      loading: false,

      fetch: async () => {
        set({ loading: true })
        try {
          const snap = await fbGet(ref(db, 'transactions'))
          if (snap.exists()) {
            const data = snap.val()
            const txs = Object.values(data).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            set({ transactions: txs })
          }
        } catch { /* keep local */ }
        set({ loading: false })
      },

      fetchByGuru: async (guruId) => {
        try {
          const snap = await fbGet(ref(db, 'transactions'))
          if (snap.exists()) {
            const data = snap.val()
            const txs = Object.values(data)
              .filter(t => t.guruId === guruId)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            set({ transactions: txs })
          }
        } catch { /* keep local */ }
      },

      // Checkout: simpan ke Firebase → admin dapat real-time otomatis
      checkout: async (payload) => {
        const now = new Date()
        const tx = {
          ...payload,
          status: 'selesai',
          createdAt: now.toISOString(),
          month: now.getMonth(),
          year: now.getFullYear(),
        }

        try {
          // Push ke Firebase → generate ID unik otomatis
          const newRef = push(ref(db, 'transactions'))
          tx.id = newRef.key
          await set(newRef, tx)

          // Update stok di Firebase
          if (Array.isArray(tx.items)) {
            const stockSnap = await fbGet(ref(db, 'stock'))
            const currentStock = stockSnap.exists() ? stockSnap.val() : {}
            const updates = {}
            tx.items.forEach(item => {
              const cur = currentStock[item.productId] ?? (PRODUCTS.find(p => p.id === item.productId)?.stock || 0)
              updates[`stock/${item.productId}`] = Math.max(0, cur - item.qty)
            })
            await update(ref(db), updates)
          }

          // Push notifikasi ke Firebase → admin baca real-time
          const notif = {
            type: 'new_order',
            title: 'Pesanan Baru Masuk! 🛒',
            message: `${tx.guruName} checkout ${tx.items?.length || 0} produk senilai Rp ${tx.total?.toLocaleString('id-ID')}`,
            guruId: tx.guruId,
            guruName: tx.guruName,
            txId: tx.id,
            total: tx.total,
            method: tx.method,
            read: false,
            createdAt: now.toISOString(),
          }
          const notifRef = push(ref(db, 'notifications'))
          await set(notifRef, { ...notif, id: notifRef.key })

          // Simpan ke local store juga
          set({ transactions: [tx, ...get().transactions] })
          return { success: true, transaction: tx, via: 'firebase' }

        } catch (err) {
          console.error('[Checkout Firebase error]', err)
          // Fallback lokal
          tx.id = 'TX-LOCAL-' + Date.now()
          tx._localOnly = true
          set({ transactions: [tx, ...get().transactions] })
          return { success: true, transaction: tx, via: 'local' }
        }
      },

      addLocal: (tx) => {
        const exists = get().transactions.find(t => t.id === tx.id)
        if (!exists) set({ transactions: [tx, ...get().transactions] })
      },

      getMonthTotal: (guruId, month, year) => {
        return get().transactions
          .filter(t => t.guruId === guruId && t.status === 'selesai' &&
            new Date(t.createdAt).getMonth() === month &&
            new Date(t.createdAt).getFullYear() === year)
          .reduce((s, t) => s + (t.total || 0), 0)
      },
    }),
    {
      name: 'koperasi-transactions',
      partialize: (state) => ({ transactions: state.transactions.slice(0, 200) }),
    }
  )
)

// ── NOTIFICATION STORE ─────────────────────────────────────
export const useNotifStore = create((set, get) => ({
  notifications: [],
  unread: 0,
  _unsubscribe: null,

  // Listen real-time dari Firebase — dipanggil di AdminLayout
  listenRealtime: () => {
    const notifRef = ref(db, 'notifications')
    const unsubscribe = onValue(notifRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const notifs = Object.values(data)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 100)
        set({ notifications: notifs, unread: notifs.filter(n => !n.read).length })
      }
    })
    set({ _unsubscribe: unsubscribe })
    return unsubscribe
  },

  stopListening: () => {
    const unsub = get()._unsubscribe
    if (unsub) { off(ref(db, 'notifications')); set({ _unsubscribe: null }) }
  },

  fetch: async () => {
    try {
      const snap = await fbGet(ref(db, 'notifications'))
      if (snap.exists()) {
        const notifs = Object.values(snap.val())
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        set({ notifications: notifs, unread: notifs.filter(n => !n.read).length })
      }
    } catch { /* offline */ }
  },

  add: (notif) => {
    const exists = get().notifications.find(n => n.id === notif.id)
    if (exists) return
    const notifications = [notif, ...get().notifications].slice(0, 100)
    set({ notifications, unread: notifications.filter(n => !n.read).length })
  },

  markRead: async (id) => {
    const notifications = get().notifications.map(n => n.id === id ? { ...n, read: true } : n)
    set({ notifications, unread: notifications.filter(n => !n.read).length })
    try { await update(ref(db, `notifications/${id}`), { read: true }) } catch { /* offline */ }
  },

  markAllRead: async () => {
    const updates = {}
    get().notifications.forEach(n => { updates[`notifications/${n.id}/read`] = true })
    set({ notifications: get().notifications.map(n => ({ ...n, read: true })), unread: 0 })
    try { await update(ref(db), updates) } catch { /* offline */ }
  },
}))
