import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import { PRODUCTS } from '../utils/data'

const API = (import.meta.env.VITE_SERVER_URL || '') + '/api'

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
          set({
            items: [...items, {
              productId: product.id,
              name: product.name,
              price: product.price,
              qty: 1,
              img: product.img,
              unit: product.unit,
            }]
          })
        }
      },

      removeItem: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),

      changeQty: (productId, delta) => {
        const items = get().items
          .map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i)
          .filter(i => i.qty > 0)
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

  updateStock: async (productId, qty) => {
    set({ stock: { ...get().stock, [productId]: parseInt(qty) } })
    try { await axios.put(`${API}/stock/${productId}`, { qty }, { timeout: 3000 }) } catch { /* keep local */ }
  },

  restock: async (productId, amount = 50) => {
    const cur = get().stock[productId] || 0
    set({ stock: { ...get().stock, [productId]: cur + amount } })
    try { await axios.patch(`${API}/stock/${productId}/restock`, { amount }, { timeout: 3000 }) } catch { /* keep local */ }
  },

  fetchStock: async () => {
    try {
      const res = await axios.get(`${API}/stock`, { timeout: 3000 })
      if (res.data && Object.keys(res.data).length > 0) set({ stock: res.data })
    } catch { /* use default */ }
  },
}))

// ── TRANSACTION STORE ──────────────────────────────────────
export const useTxStore = create(
  persist(
    (set, get) => ({
      transactions: [],
      loading: false,

      fetch: async () => {
        try {
          const res = await axios.get(`${API}/transactions`, { timeout: 4000 })
          if (Array.isArray(res.data)) set({ transactions: res.data })
        } catch {
          // keep local
        }
      },

      fetchByGuru: async (guruId) => {
        try {
          const res = await axios.get(`${API}/transactions/${guruId}`, { timeout: 4000 })
          if (Array.isArray(res.data)) {
            // Merge server data dengan local-only entries
            const serverIds = new Set(res.data.map(t => t.id))
            const localOnly = get().transactions.filter(t => t._localOnly && !serverIds.has(t.id))
            set({ transactions: [...res.data, ...localOnly] })
          }
        } catch {
          // keep local
        }
      },

      // ────────────────────────────────────────────────────
      // checkout: SELALU coba POST ke server dulu supaya
      // Socket.io bisa emit notifikasi real-time ke admin.
      // Kalau server tidak aktif → fallback simpan lokal.
      // ────────────────────────────────────────────────────
      checkout: async (payload) => {
        // Coba kirim ke server (ini yang trigger Socket.io ke admin)
        try {
          const res = await axios.post(`${API}/transactions`, payload, { timeout: 6000 })
          const tx = res.data?.transaction
          if (tx) {
            // Sukses via server — simpan ke local store juga
            set({ transactions: [tx, ...get().transactions] })
            return { success: true, transaction: tx, via: 'server' }
          }
        } catch (err) {
          // Server tidak aktif — fallback ke local
          console.warn('[Checkout] Server tidak aktif, simpan lokal:', err.message)
        }

        // ── FALLBACK: simpan lokal tanpa server ──
        // Notifikasi real-time ke admin tidak akan muncul
        // (karena tidak ada server yang emit Socket.io),
        // tapi checkout tetap berhasil untuk guru.
        const localTx = {
          id: 'TX-LOCAL-' + Date.now(),
          ...payload,
          status: 'selesai',
          createdAt: new Date().toISOString(),
          _localOnly: true,
        }
        set({ transactions: [localTx, ...get().transactions] })
        return { success: true, transaction: localTx, via: 'local' }
      },

      // Dipanggil dari Socket.io saat admin terima event baru
      addLocal: (tx) => {
        const exists = get().transactions.find(t => t.id === tx.id)
        if (!exists) set({ transactions: [tx, ...get().transactions] })
      },

      getMonthTotal: (guruId, month, year) => {
        return get().transactions
          .filter(t =>
            t.guruId === guruId &&
            t.status === 'selesai' &&
            new Date(t.createdAt).getMonth() === month &&
            new Date(t.createdAt).getFullYear() === year
          )
          .reduce((s, t) => s + (t.total || 0), 0)
      },
    }),
    {
      name: 'koperasi-transactions',
      partialize: (state) => ({ transactions: state.transactions.slice(0, 300) }),
    }
  )
)

// ── NOTIFICATION STORE ─────────────────────────────────────
export const useNotifStore = create((set, get) => ({
  notifications: [],
  unread: 0,

  fetch: async () => {
    try {
      const res = await axios.get(`${API}/notifications`, { timeout: 3000 })
      const notifs = res.data
      set({ notifications: notifs, unread: notifs.filter(n => !n.read).length })
    } catch { /* offline */ }
  },

  add: (notif) => {
    // Cegah duplikat
    const exists = get().notifications.find(n => n.id === notif.id)
    if (exists) return
    const notifications = [notif, ...get().notifications].slice(0, 100)
    set({ notifications, unread: notifications.filter(n => !n.read).length })
  },

  markRead: async (id) => {
    const notifications = get().notifications.map(n => n.id === id ? { ...n, read: true } : n)
    set({ notifications, unread: notifications.filter(n => !n.read).length })
    try { await axios.patch(`${API}/notifications/${id}/read`, {}, { timeout: 2000 }) } catch { /* offline */ }
  },

  markAllRead: async () => {
    const notifications = get().notifications.map(n => ({ ...n, read: true }))
    set({ notifications, unread: 0 })
    try { await axios.patch(`${API}/notifications/read-all`, {}, { timeout: 2000 }) } catch { /* offline */ }
  },
}))
