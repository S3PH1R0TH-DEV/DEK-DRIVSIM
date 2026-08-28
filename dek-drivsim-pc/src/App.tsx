import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { setupRole } from './api'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import CashierDashboard from './pages/CashierDashboard'
import PlayerInterface from './pages/PlayerInterface'

function AppRoutes({ role, setRole }: { role: string | null; setRole: (r: string | null) => void }) {
  const navigate = useNavigate()

  // Redirection déclarative : dès que role change, on navigue
  useEffect(() => {
    if (!role) return
    const target = role === 'admin' ? '/admin' : role === 'cashier' ? '/cashier' : '/player'
    navigate(target, { replace: true })
  }, [role, navigate])

  if (!role) {
    return <LoginPage onRoleSelected={setRole} />
  }

  return (
    <Routes>
      <Route path="/admin" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
      <Route path="/cashier" element={role === 'cashier' ? <CashierDashboard /> : <Navigate to="/" replace />} />
      <Route path="/player" element={<PlayerInterface />} />
      <Route path="*" element={<Navigate to={role === 'admin' ? '/admin' : role === 'cashier' ? '/cashier' : '/player'} replace />} />
    </Routes>
  )
}

export default function App() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const detect = async () => {
      try {
        let ip = '127.0.0.1'
        if (typeof window !== 'undefined' && window.electronAPI?.getLocalIP) {
          try { ip = await window.electronAPI.getLocalIP() } catch { /* fallback */ }
        }
        const res = await setupRole(ip)
        if (!cancelled && res?.success) setRole(res.role)
      } catch (e) {
        console.warn('[DEK] auto-detect role failed', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    detect()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <h2 className="text-fuchsia-400 text-2xl font-black mb-2">DEK-DRIVSIM</h2>
          <p className="text-slate-400 text-sm mb-6">Initialisation…</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto" />
        </div>
      </div>
    )
  }

  return <AppRoutes role={role} setRole={setRole} />
}
