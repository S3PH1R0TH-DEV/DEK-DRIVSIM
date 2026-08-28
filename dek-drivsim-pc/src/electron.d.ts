interface ElectronAPI {
  getFlaskPort: () => Promise<number>
  getApiBaseUrl: () => Promise<string>
  getLocalIP: () => Promise<string>
  openExternal: (url: string) => Promise<void>
}

interface Window {
  electronAPI?: ElectronAPI
  Capacitor?: any
}
