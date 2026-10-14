# 🏪 Koperasi Guru Digital

Aplikasi web koperasi guru berbasis React + Vite dengan real-time notifications via Socket.io.

## 📁 Struktur Folder

```
koperasi-guru-app/
├── index.html                  # Entry point HTML
├── vite.config.js              # Konfigurasi Vite + proxy server
├── tailwind.config.js          # Konfigurasi Tailwind CSS
├── postcss.config.js
├── package.json                # Dependencies
│
├── server/
│   ├── index.js                # Express + Socket.io server (port 3001)
│   ├── db.json                 # 📦 Penyimpanan data lokal (auto-generated)
│   └── package.json
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.jsx                # React entry
    ├── App.jsx                 # Router & protected routes
    │
    ├── styles/
    │   └── index.css           # Tailwind + custom CSS
    │
    ├── utils/
    │   └── data.js             # Data produk, guru, helpers
    │
    ├── store/
    │   └── index.js            # Zustand stores (auth, cart, tx, notif, stock)
    │
    ├── hooks/
    │   └── useSocket.js        # Socket.io hooks (real-time)
    │
    ├── components/
    │   └── layout/
    │       ├── GuruLayout.jsx  # Sidebar + topbar guru
    │       └── AdminLayout.jsx # Sidebar + topbar admin (notif bell real-time)
    │
    └── pages/
        ├── LoginPage.jsx
        ├── guru/
        │   ├── Dashboard.jsx   # Quota progress, stats, recent tx
        │   ├── Katalog.jsx     # 18 produk dengan foto real
        │   ├── Keranjang.jsx   # Cart + checkout + pilih metode bayar
        │   ├── Riwayat.jsx     # History per bulan
        │   └── Profil.jsx      # Info akun + statistik
        └── admin/
            ├── Dashboard.jsx   # Real-time stats + filter bulan/tahun
            ├── Guru.jsx        # Status quota 80 guru
            ├── Transaksi.jsx   # Semua transaksi dengan filter
            ├── Stok.jsx        # Update stok produk
            └── Laporan.jsx     # Bar chart + line chart pendapatan
```

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** versi 18 atau lebih baru → [nodejs.org](https://nodejs.org)
- **npm** (sudah termasuk di Node.js)

### Langkah Install & Jalankan

```bash
# 1. Masuk ke folder proyek
cd C:\Users\RasyaDesk\Downloads\koperasi-guru-app

# 2. Install semua dependencies (tunggu ~2-3 menit)
npm install

# 3. Jalankan aplikasi (server + frontend sekaligus)
npm run dev
```

Setelah berhasil, buka browser:
- **Frontend:** http://localhost:5173
- **Server API:** http://localhost:3001/api

### Akun Login Demo

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Guru** | `budi.santoso` | `guru123` |
| Guru lain | `siti.rahayu` | `guru123` |
| *(80 akun guru tersedia)* | `nama.lengkap` | `guru123` |

---

## ✨ Fitur Utama

### 👨‍🏫 Panel Guru
- Dashboard quota belanja bulanan (min. Rp 100.000)
- Katalog 18 produk sembako dengan foto real
- Keranjang belanja + simulasi quota
- Checkout dengan 2 metode: **Tunai** atau **Potong Gaji**
- Riwayat transaksi per bulan
- Profil & statistik belanja

### 👑 Panel Admin
- **Real-time:** Notifikasi langsung muncul saat guru checkout (Socket.io)
- Dashboard stats dengan filter bulan & tahun
- Data status quota 80 guru dengan progress bar
- Semua transaksi dengan filter bulan/metode/pencarian
- Manajemen stok: edit langsung + restok +50 unit
- Laporan keuangan: bar chart + line chart (Recharts)

### 🔴 Real-Time Flow
```
Guru Checkout → POST /api/transactions
    → Server simpan ke db.json
    → Socket.io emit ke semua admin yang online
    → Notif bell admin berbunyi + toast popup muncul
    → Dashboard admin update otomatis
```

### 💾 Penyimpanan Data
- `server/db.json` — auto-dibuat saat server pertama kali jalan
- Cart tersimpan di **localStorage** (tetap ada walau browser ditutup)
- Auth tersimpan di **localStorage** (stay logged in)

---

## 🎨 Design
- Gradasi **cyan → aqua → sky → putih**
- Animasi **Framer Motion** (ringan, tidak berat di mobile)
- Grafik **Recharts** (bar & line chart)
- **Tailwind CSS** utility-first
- Fully responsive: desktop, tablet, mobile
