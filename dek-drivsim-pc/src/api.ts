import axios from 'axios'

// Détection base URL : Vite proxy en dev, localStorage pour APK, Electron via localhost
const getApiBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE as string | undefined
  if (envUrl) return envUrl
  if (typeof window !== 'undefined') {
    // APK Capacitor : IP du PC saisie par l'utilisateur (stockée)
    try {
      const saved = localStorage.getItem('DEK_API_BASE')
      if (saved) return saved
      // @ts-ignore Capacitor global
      if ((window as any).Capacitor?.isNativePlatform?.() || (window as any).Capacitor?.isNative) {
        // Par défaut on tente l'IP la plus courante, l'écran de config permettra de la changer
        return localStorage.getItem('DEK_API_BASE') || ''
      }
      if (window.location.port === '5173') return '' // proxy Vite /api -> 5000
      if (window.location.protocol === 'file:' || window.location.protocol === 'capacitor:') {
        // Electron prod file:// ou Capacitor : si pas d'IP configurée, on reste en relatif
        // L'écran de config IP s'affichera
        return localStorage.getItem('DEK_API_BASE') || 'http://127.0.0.1:5000'
      }
    } catch {}
  }
  return 'http://127.0.0.1:5000'
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.message || err.message || 'Erreur réseau'
    // On laisse le composant afficher le message, mais on log
    console.warn('[API]', err?.config?.url, msg)
    return Promise.reject(err)
  }
)

export const setApiBaseUrl = (url: string) => { api.defaults.baseURL = url }

// --- Auth / rôles ---
export const setupRole = async (ip: string, password?: string) => {
  const payload: any = { ip }
  if (password) payload.password = password
  const { data } = await api.post('/api/setup-role', payload)
  return data
}

// --- Dashboards ---
export const getTerminals = async () => (await api.get('/api/terminals')).data
export const getTickets = async (status?: string) => (await api.get('/api/tickets', { params: status ? { status } : {} })).data
export const getPlayers = async () => (await api.get('/api/players')).data
export const getFinancialSummary = async () => (await api.get('/api/dashboard/stats')).data
export const getSettings = async () => (await api.get('/api/settings')).data
export const updateSettings = async (patch: Record<string, string>) => (await api.post('/api/settings', patch)).data
export const getGames = async () => (await api.get('/api/games')).data

// --- Sessions ---
export const startTicketSession = async (terminalId: number, code: string) =>
  (await api.post(`/api/terminal/${terminalId}/start`, { session_type: 'ticket', code })).data
export const startPlayerSession = async (terminalId: number, username: string, password: string) =>
  (await api.post(`/api/terminal/${terminalId}/start`, { session_type: 'player', username, password })).data
export const startPostpaidSession = async (terminalId: number) =>
  (await api.post(`/api/terminal/${terminalId}/start`, { session_type: 'postpaid' })).data
export const pauseSession = async (terminalId: number) => (await api.post(`/api/terminal/${terminalId}/pause`)).data
export const resumeSession = async (terminalId: number) => (await api.post(`/api/terminal/${terminalId}/resume`)).data
export const stopSession = async (terminalId: number) => (await api.post(`/api/terminal/${terminalId}/stop`)).data
export const tickAllSessions = async () => (await api.post('/api/tick')).data

// --- Tickets / Players ---
export const generateTickets = async (count: number, duration_mins: number, price: number) =>
  (await api.post('/api/tickets/generate', { count, duration: duration_mins, price })).data
export const getTicketByCode = async (code: string) => (await api.get(`/api/tickets/code/${code}`)).data
export const createPlayer = async (username: string, password: string, referred_by_code?: string) =>
  (await api.post('/api/players/create', { username, password, referred_by_code })).data
export const rechargePlayer = async (playerId: number, amount: number) =>
  (await api.post(`/api/players/${playerId}/recharge`, { amount })).data

// --- Admin ---
export const addGame = async (name: string, category: string, image_url: string, launch_path: string) =>
  (await api.post('/api/games/add', { name, category, image_url, launch_path })).data
export const deleteGame = async (gameId: number) => (await api.delete(`/api/games/${gameId}`)).data

// --- Cashier ---
export const submitCashierEvaluation = async (dayNumber: number, rating: number, punctuality: string, cash_accuracy: string, notes: string) =>
  (await api.post('/api/cashier/evaluate', { day_number: dayNumber, rating, punctuality, cash_accuracy, notes })).data
export const getCashierEvaluations = async () => (await api.get('/api/cashier-evaluations')).data

// --- Logs / rapports ---
export const getConnectionLogs = async () => (await api.get('/api/connection-logs')).data
export const getReportData = async (period: string) => (await api.get(`/api/reports/print?period=${period}`)).data

// --- Driving schools / referrals (alias compat) ---
export const getDrivingSchools = async () => (await api.get('/api/schools')).data
export const createDrivingSchool = async (school_name: string, instructor_name: string, hourly_rate: number, initial_balance: number) =>
  (await api.post('/api/schools/create', { school_name, instructor_name, special_hourly_rate: hourly_rate, balance: initial_balance })).data
export const rechargeDrivingSchool = async (schoolId: number, amount: number) =>
  (await api.post(`/api/schools/${schoolId}/recharge`, { amount })).data
export const getAllReferrals = async () => (await api.get('/api/referrals')).data
export const claimReferral = async (refId: number) => (await api.post(`/api/referrals/${refId}/claim`)).data

// --- Client locker (écran joueur sur PC) ---
export const getClientStatus = async (name: string) => (await api.get(`/api/client/status/${encodeURIComponent(name)}`)).data
export const unlockClient = async (name: string, unlock_type: 'ticket' | 'player', payload: any) =>
  (await api.post(`/api/client/unlock/${encodeURIComponent(name)}`, { unlock_type, ...payload })).data
export const adminLoginClient = async (password: string) => (await api.post('/api/client/admin-login', { password })).data
