import { useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useNotifStore, useStockStore, useTxStore } from '../store'

let socketInstance = null

export function getSocket() {
  if (!socketInstance) {
    // Di development (localhost): pakai proxy Vite → window.location.origin
    // Di production (Netlify): pakai VITE_SERVER_URL env variable
    // Contoh: VITE_SERVER_URL=https://koperasi-server.railway.app
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin

    socketInstance = io(serverUrl, {
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 5000,
      transports: ['websocket', 'polling'],
    })
  }
  return socketInstance
}

// ── Hook untuk ADMIN ───────────────────────────────────────
// Dipasang di AdminLayout → aktif selama admin login
export function useAdminSocket() {
  const addNotif  = useNotifStore(s => s.add)
  const fetchNotifs = useNotifStore(s => s.fetch)
  const addTx     = useTxStore(s => s.addLocal)
  const fetchTx   = useTxStore(s => s.fetch)
  const setStock  = useStockStore(s => s.setStock)

  useEffect(() => {
    const socket = getSocket()

    // Emit join_admin setiap kali (re)connect
    const joinAdmin = () => {
      socket.emit('join_admin')
      console.log('[Socket] Admin joined room')
    }

    // Langsung join kalau sudah connected
    if (socket.connected) joinAdmin()

    // Atau tunggu connect
    socket.on('connect', joinAdmin)

    // ── Terima transaksi baru dari guru ──
    socket.on('new_transaction', ({ transaction, notification }) => {
      // Tambah ke daftar transaksi admin
      addTx(transaction)
      // Tambah notifikasi
      addNotif(notification)
      // Toast popup di admin
      toast.success(
        `🛒 ${notification.guruName} checkout — ${notification.message?.includes('senilai') ? notification.message.split('senilai')[1]?.trim() : ''}`,
        {
          duration: 6000,
          style: {
            borderLeft: '4px solid #06b6d4',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
          icon: '🛒',
        }
      )
    })

    // ── Update stok real-time ──
    socket.on('stock_update', (stock) => {
      setStock(stock)
    })

    // ── Notifikasi langsung (fallback) ──
    socket.on('notification', (notif) => {
      addNotif(notif)
    })

    // ── Reconnect: ambil data terbaru ──
    socket.on('reconnect', () => {
      console.log('[Socket] Reconnected — fetching latest data')
      fetchTx()
      fetchNotifs()
    })

    return () => {
      socket.off('connect', joinAdmin)
      socket.off('new_transaction')
      socket.off('stock_update')
      socket.off('notification')
      socket.off('reconnect')
    }
  }, [addNotif, addTx, setStock, fetchTx, fetchNotifs])
}

// ── Hook untuk GURU ────────────────────────────────────────
// Hanya listen stock update
export function useGuruSocket(guruId) {
  const setStock = useStockStore(s => s.setStock)

  useEffect(() => {
    if (!guruId) return
    const socket = getSocket()

    const joinGuru = () => {
      socket.emit('join_guru', guruId)
    }

    if (socket.connected) joinGuru()
    socket.on('connect', joinGuru)

    socket.on('stock_update', (stock) => {
      setStock(stock)
    })

    return () => {
      socket.off('connect', joinGuru)
      socket.off('stock_update')
    }
  }, [guruId, setStock])
}
