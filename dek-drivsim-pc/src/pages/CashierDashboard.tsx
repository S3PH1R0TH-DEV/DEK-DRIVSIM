import React, { useEffect, useState } from 'react'
import { 
  getSettings, 
  getTerminals, 
  getTickets, 
  getPlayers, 
  getFinancialSummary,
  getCashierEvaluations,
  startTicketSession,
  startPlayerSession,
  startPostpaidSession,
  pauseSession,
  resumeSession,
  stopSession,
  tickAllSessions
} from '../api'

const CashierDashboard = () => {
  const [settings, setSettings] = useState<any>(null)
  const [terminals, setTerminals] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [
          s,
          t,
          tk,
          p,
          sum,
          ev,
        ] = await Promise.all([
          getSettings(),
          getTerminals(),
          getTickets(),
          getPlayers(),
          getFinancialSummary(),
          getCashierEvaluations(),
        ])
        setSettings(s)
        setTerminals(t)
        setTickets(tk)
        setPlayers(p)
        setSummary(sum)
        setEvaluations(ev)
      } catch (error) {
        console.error('Error loading cashier data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    const intervalId = setInterval(loadData, 3000)
    return () => clearInterval(intervalId)
  }, [])

  const handleStartSession = async (terminalId: number, type: string, data: any) => {
    let result
    switch (type) {
      case 'ticket':
        result = await startTicketSession(terminalId, data.code)
        break
      case 'player':
        result = await startPlayerSession(terminalId, data.username, data.password)
        break
      case 'postpaid':
        result = await startPostpaidSession(terminalId)
        break
    }
    if (result && !result.success) {
      alert(result.message || 'Erreur inconnue')
    }
  }

  const handleStopSession = async (terminalId: number) => {
    if (!window.confirm('Arrêter la session ?')) return
    const result = await stopSession(terminalId)
    if (!result.success) {
      alert(result.message || 'Erreur inconnue')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full">
          <h2 className="text-center text-cyan-400 text-2xl font-bold mb-4">DEK-DRIVSIM</h2>
          <p className="text-slate-400 text-center mb-8">Chargement du tableau de bord caissier...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full border border-slate-800 object-cover" />
            <div>
              <h1 className="text-md sm:text-lg font-black tracking-widest text-white uppercase flex items-center gap-2">
                <span className="neon-glow-cyan">{settings?.cyber_name || 'DEK-DRIVSIM'}</span>
                <span className="text-[9px] px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold rounded-full uppercase tracking-widest font-mono">ESPACE CAISSIER</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono">Gérant en poste : <span className="text-slate-300">Session active</span></p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <div id="live-clock" className="text-sm font-bold text-white">--:--:--</div>
              <div id="live-date" className="text-[9px] text-slate-500 uppercase">-- -- ----</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <i className="fa-solid fa-cash-register text-2xl"></i>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-widest font-mono">Caisse du Gérant (Aujourd'hui)</span>
              <strong id="stat-revenue" className="text-xl font-black text-white font-mono">{summary?.today_revenue || 0} <span className="text-xs text-emerald-400">{settings?.currency || 'FCFA'}</span></strong>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <i className="fa-solid fa-gift text-2xl"></i>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-widest font-mono">Mon Code Parrainage (Bonus Salaire)</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 font-mono font-black text-xs select-all">CASHIER-DEK</span>
                <span className="text-[10px] text-slate-400">Bonus: <strong className="text-emerald-400" id="recruits-count">{evaluations.find(e => e.evaluated_at === '')?.recruits_count || 0}</strong> recruté(s)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <i className="fa-solid fa-star text-2xl"></i>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-widest font-mono">Évaluation & Période d'Essai</span>
              <strong className="text-sm font-bold text-white block mt-1">
                {evaluations.find(e => e.evaluated_at === '') ? (
                  <span>Jour {evaluations.find(e => e.evaluated_at === '').day_number} / 14 d'essai</span>
                ) : (
                  <span>Période d'essai validée !</span>
                )}
              </strong>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">Score : 5/5</span>
            </div>
          </div>
        </section>

        {/* Terminal Grid */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-md sm:text-lg font-black tracking-widest text-white flex items-center gap-2 uppercase">
                <i className="fa-solid fa-network-wired text-cyan-400"></i> Supervision des Simulateurs
              </h2>
              <p className="text-xs text-slate-500 font-mono">Lancer des sessions, verrouiller ou suspendre à distance les simulateurs clients.</p>
            </div>
            <button onClick={tickAllSessions} className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold font-mono">
              <i className="fa-solid fa-rotate" id="sync-spinner"></i> Actualiser
            </button>
          </div>

          <div id="terminal-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Loaded Dynamically */}
          </div>
        </section>

        {/* Tickets & Members Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-md font-black tracking-widest text-white flex items-center gap-2 uppercase">
                <i className="fa-solid fa-ticket-simple text-cyan-400"></i> Tickets d'Accès à Vendre
              </h2>
              <p className="text-xs text-slate-500 font-mono">Vendez ces codes PIN prépayés générés par le propriétaire.</p>
            </div>
            <div className="max-h-80 overflow-y-auto border border-slate-800 bg-slate-900/40 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-500 font-mono uppercase text-[9px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3 text-center">CODE PIN</th>
                    <th className="p-3">Durée</th>
                    <th className="p-3 text-right">Prix</th>
                  </tr>
                </thead>
                <tbody id="tickets-list-body" className="divide-y divide-slate-800 font-mono">
                  {/* Populated dynamically */}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-md sm:text-lg font-black tracking-widest text-white flex items-center gap-2 uppercase">
                <i className="fa-solid fa-users text-cyan-400"></i> Comptes Membres & Rechargements
              </h2>
              <p className="text-xs text-slate-500 font-mono">Enregistrez de nouveaux joueurs ou recharger leurs portefeuilles.</p>
            </div>
            {/* Player creation form and list would go here */}
          </div>
        </section>

      </main>

      <footer className="bg-slate-950/80 border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <p>&copy; 2026 DEK-DRIVSIM CyberCafe. Espace Caissier.</p>
      </footer>
    </div>
  )
}

export default CashierDashboard