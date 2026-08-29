import { useEffect, useState } from 'react'
import { setupRole, setApiBaseUrl } from '../api'

export default function LoginPage({ onRoleSelected }: { onRoleSelected: (role: string) => void }) {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoTried, setAutoTried] = useState(false)
  const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
  const [serverIP, setServerIP] = useState(() => {
    try { return localStorage.getItem('DEK_API_BASE')?.replace('http://','').replace(':5000','') || '' } catch { return '' }
  })

  const getLocalIP = async (): Promise<string> => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.getLocalIP) {
      try { return await (window as any).electronAPI.getLocalIP() } catch { /* ignore */ }
    }
    return '127.0.0.1'
  }

  useEffect(() => {
    let cancelled = false
    const auto = async () => {
      setLoading(true)
      try {
        const ip = await getLocalIP()
        const res: any = await setupRole(ip) // sans password -> backend renvoie rôle mémorisé si existe
        if (!cancelled && res?.success) {
          setMessage(`Bienvenue ${res.role.toUpperCase()} ! Redirection…`)
          setTimeout(() => onRoleSelected(res.role), 800)
          return
        }
        if (!cancelled) setMessage(null)
      } catch {
        if (!cancelled) setMessage(null)
      } finally {
        if (!cancelled) { setLoading(false); setAutoTried(true) }
      }
    }
    auto()
    return () => { cancelled = true }
  }, [onRoleSelected])

  const handleLogin = async () => {
    if (!password.trim()) { setMessage('Veuillez saisir le code'); return }
    setLoading(true); setMessage(null)
    try {
      const ip = await getLocalIP()
      const res: any = await setupRole(ip, password.trim())
      if (res?.success) onRoleSelected(res.role)
      else setMessage(res?.message || 'Code invalide')
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Erreur de connexion au serveur (vérifiez que Flask tourne sur :5000)')
    } finally { setLoading(false) }
  }

  if (loading && !autoTried) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <h2 className="text-fuchsia-400 text-2xl font-black mb-2">DEK-DRIVSIM</h2>
          <p className="text-slate-400 text-sm mb-6">Détection du rôle…</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto" />
        </div>
      </div>
    )
  }

  const isSuccess = !!message?.startsWith('Bienvenue')

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
        <h2 className="text-fuchsia-400 text-2xl font-black mb-1">DEK-DRIVSIM</h2>
        <p className="text-slate-500 text-xs mb-6 tracking-widest">KIOSK • Choisissez votre espace</p>

        {message && (
          <div className={`mb-4 p-3 rounded-xl border text-sm ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {message}
          </div>
        )}

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Code d'activation</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Code d'activation"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-fuchsia-500"
            />
            <p className="text-[11px] text-slate-500 mt-2">L'appareil mémorisera le rôle (IP). Propriétaire : voir <span className="font-mono text-fuchsia-400">admin_password.txt</span> (jamais partagé au caissier).</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-fuchsia-600/20 border border-fuchsia-500/20"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 opacity-60">
              <div className="text-slate-500 uppercase font-bold">Propriétaire</div>
              <div className="font-mono text-fuchsia-400">••••••••••••••••</div>
              <div className="text-[10px] text-slate-500">fort &amp; aléatoire</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-500 uppercase font-bold">Caissier</div>
              <div className="font-mono text-cyan-400">caissier123</div>
              <div className="text-[10px] text-emerald-400">inchangé</div>
            </div>
          </div>

          {isCapacitor && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <label className="block text-xs font-bold text-amber-400 uppercase mb-2">IP du PC Serveur (APK télécommande)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverIP}
                  onChange={(e) => setServerIP(e.target.value)}
                  placeholder="192.168.1.100"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-sm"
                />
                <button
                  onClick={() => {
                    const url = `http://${serverIP.trim()}:5000`
                    localStorage.setItem('DEK_API_BASE', url)
                    setApiBaseUrl(url)
                    setMessage(`Serveur configuré: ${url}`)
                    setTimeout(() => setMessage(null), 2000)
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs uppercase"
                >
                  OK
                </button>
              </div>
              <p className="text-[10px] text-amber-200/70 mt-1">Visible sur le PC : Dashboard Admin → IP LAN / QR code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
