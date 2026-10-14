import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'db.json')

// ── init DB ──────────────────────────────────────────────
function initDB() {
  if (existsSync(DB_PATH)) return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  const db = { transactions: [], notifications: [], stock: {} }
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  return db
}

function saveDB(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

let db = initDB()

// ── Express ───────────────────────────────────────────────
const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  // Izinkan semua origin termasuk *.devtunnels.ms, *.ngrok.io, localhost
  cors: {
    origin: (origin, callback) => {
      // Izinkan semua — server ini internal koperasi, tidak public internet
      callback(null, true)
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Aktifkan polling sebagai fallback kalau WebSocket diblok DevTunnels
  transports: ['websocket', 'polling'],
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// ── ROUTES ────────────────────────────────────────────────

// GET all transactions
app.get('/api/transactions', (req, res) => {
  db = initDB()
  res.json(db.transactions)
})

// GET transactions by guru
app.get('/api/transactions/:guruId', (req, res) => {
  db = initDB()
  const txs = db.transactions.filter(t => t.guruId === req.params.guruId)
  res.json(txs)
})

// POST new transaction (checkout)
app.post('/api/transactions', (req, res) => {
  db = initDB()
  const tx = {
    id: 'TX' + String(db.transactions.length + 1).padStart(4, '0'),
    ...req.body,
    status: 'selesai',
    createdAt: new Date().toISOString(),
  }
  db.transactions.push(tx)

  // Update stock
  if (Array.isArray(tx.items)) {
    tx.items.forEach(item => {
      if (db.stock[item.productId] !== undefined) {
        db.stock[item.productId] = Math.max(0, db.stock[item.productId] - item.qty)
      }
    })
  }

  // Create notification
  const notif = {
    id: 'N' + Date.now(),
    type: 'new_order',
    title: 'Pesanan Baru Masuk! 🛒',
    message: `${tx.guruName} baru saja checkout ${tx.items?.length || 0} produk senilai Rp ${tx.total?.toLocaleString('id-ID')}`,
    guruId: tx.guruId,
    guruName: tx.guruName,
    txId: tx.id,
    total: tx.total,
    method: tx.method,
    read: false,
    createdAt: new Date().toISOString(),
  }
  db.notifications.unshift(notif)
  // Keep only last 100 notifications
  if (db.notifications.length > 100) db.notifications = db.notifications.slice(0, 100)

  saveDB(db)

  // 🔴 REAL-TIME: emit to all admin sockets immediately
  io.to('admins').emit('new_transaction', { transaction: tx, notification: notif })
  io.to('admins').emit('notification', notif)

  // Also emit stock update
  io.emit('stock_update', db.stock)

  res.status(201).json({ success: true, transaction: tx })
})

// GET stock
app.get('/api/stock', (req, res) => {
  db = initDB()
  res.json(db.stock)
})

// PUT update stock (admin)
app.put('/api/stock/:productId', (req, res) => {
  db = initDB()
  const { productId } = req.params
  const { qty } = req.body
  db.stock[productId] = parseInt(qty) || 0
  saveDB(db)
  io.emit('stock_update', db.stock)
  res.json({ success: true, productId, qty: db.stock[productId] })
})

// PATCH restock (admin)
app.patch('/api/stock/:productId/restock', (req, res) => {
  db = initDB()
  const { productId } = req.params
  const { amount = 50 } = req.body
  db.stock[productId] = (db.stock[productId] || 0) + parseInt(amount)
  saveDB(db)
  io.emit('stock_update', db.stock)
  res.json({ success: true, productId, qty: db.stock[productId] })
})

// GET notifications (admin)
app.get('/api/notifications', (req, res) => {
  db = initDB()
  res.json(db.notifications)
})

// PATCH mark notification read
app.patch('/api/notifications/:id/read', (req, res) => {
  db = initDB()
  const notif = db.notifications.find(n => n.id === req.params.id)
  if (notif) { notif.read = true; saveDB(db) }
  res.json({ success: true })
})

// PATCH mark all read
app.patch('/api/notifications/read-all', (req, res) => {
  db = initDB()
  db.notifications.forEach(n => { n.read = true })
  saveDB(db)
  res.json({ success: true })
})

// GET dashboard stats (admin)
app.get('/api/stats', (req, res) => {
  db = initDB()
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  const txMonth = db.transactions.filter(t => {
    const d = new Date(t.createdAt)
    return d.getMonth() === m && d.getFullYear() === y && t.status === 'selesai'
  })
  res.json({
    totalTransactions: db.transactions.length,
    monthTransactions: txMonth.length,
    monthRevenue: txMonth.reduce((s, t) => s + (t.total || 0), 0),
    unreadNotifications: db.notifications.filter(n => !n.read).length,
  })
})

// ── SOCKET.IO ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`)

  socket.on('join_admin', () => {
    socket.join('admins')
    console.log(`[WS] Admin joined: ${socket.id}`)
    // Send current stock on join
    socket.emit('stock_update', db.stock)
  })

  socket.on('join_guru', (guruId) => {
    socket.join(`guru_${guruId}`)
    console.log(`[WS] Guru joined: ${guruId}`)
  })

  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected: ${socket.id}`)
  })
})

// ── START ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Koperasi Guru Server running`)
  console.log(`   Local:   http://localhost:${PORT}`)
  console.log(`   Network: http://0.0.0.0:${PORT}  (DevTunnels/ngrok OK)`)
  console.log(`📊 API ready at http://localhost:${PORT}/api`)
  console.log(`🔌 Socket.IO ready for real-time updates\n`)
})
