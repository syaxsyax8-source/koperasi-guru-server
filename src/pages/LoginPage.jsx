import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store'
import { GURU_LIST, ADMIN } from '../utils/data'

export default function LoginPage() {
  const [role, setRole] = useState('guru')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Username dan password wajib diisi!'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 500)) // simulate latency

    if (role === 'admin') {
      if (username === ADMIN.user && password === ADMIN.pass) {
        login({ ...ADMIN, role: 'admin' })
        toast.success('Selamat datang, Admin! 👑')
        navigate('/admin')
      } else {
        toast.error('Username atau password admin salah!')
      }
    } else {
      const guru = GURU_LIST.find(g => g.user === username && g.pass === password)
      if (guru) {
        login({ ...guru, role: 'guru' })
        toast.success(`Selamat datang, ${guru.name.split(' ')[0]}! 👋`)
        navigate('/guru')
      } else {
        toast.error('Username atau password salah!')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 40%, #38bdf8 70%, #7dd3fc 100%)' }}>
      {/* Decorative circles */}
      <div className="absolute -top-40 -right-20 w-[500px] h-[500px] rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-16 w-[400px] h-[400px] rounded-full bg-white/4" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-grad-main flex items-center justify-center text-3xl shadow-lg shadow-cyan-300">
            🏪
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-800">Koperasi Guru Digital</h1>
          <p className="text-gray-400 text-sm mt-2">Belanja kebutuhan pokok dengan mudah</p>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-0 bg-sky-50 rounded-xl p-1 mb-6">
          {['guru', 'admin'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${role === r ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {r === 'guru' ? '👨‍🏫 Guru' : '👑 Admin'}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
            <input className="input" placeholder={role === 'guru' ? 'budi.santoso' : 'admin'}
              value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary btn-lg w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? '⏳ Masuk...' : '🔐 Masuk'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-sky-50 rounded-xl text-xs text-gray-400">
          <b className="text-gray-500">Demo:</b>{' '}
          {role === 'guru' ? 'budi.santoso / guru123' : 'admin / admin123'}
          {role === 'guru' && <span className="ml-2 text-gray-400">(80 akun tersedia)</span>}
        </div>
      </motion.div>
    </div>
  )
}
