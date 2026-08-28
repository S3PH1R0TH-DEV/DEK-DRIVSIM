interface ElectronAPI {
  getFlaskPort: () => Promise<number>
  getApiBaseUrl: () => Promise<string>
  getLocalIP: () => Promise<string>
  openExternal: (url: string) => Promise<void>
  verifyMastercode: (code: string) => Promise<boolean>
  getMastercodeHint: () => Promise<{ kiosk: boolean; hint: string }>
}

interface Window {
  electronAPI?: ElectronAPI
  Capacitor?: any
}
