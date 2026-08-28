const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')
const os = require('os')

// Single instance
if (!app.requestSingleInstanceLock()) app.quit()

let mainWindow = null
let flaskProcess = null
const FLASK_PORT = parseInt(process.env.DEK_FLASK_PORT || '5000', 10)
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function getResourcesBase() {
  // En prod electron-builder : extraResources -> process.resourcesPath
  // En dev : racine projet (deux niveaux au-dessus de dek-drivsim-pc)
  if (app.isPackaged) return process.resourcesPath
  return path.join(__dirname, '..')
}

function getPythonExecutable() {
  // Essaye python, puis python3, puis py (Windows launcher)
  return process.platform === 'win32' ? 'python' : 'python3'
}

function getFlaskScriptPath() {
  const base = getResourcesBase()
  // Dev : ../cybercafe_manager/app.py | Prod : resources/cybercafe_manager/app.py
  const candidates = [
    path.join(base, 'cybercafe_manager', 'app.py'),
    path.join(__dirname, '..', 'cybercafe_manager', 'app.py'),
    path.join(__dirname, '..', '..', 'cybercafe_manager', 'app.py'),
  ]
  const fs = require('fs')
  for (const p of candidates) if (fs.existsSync(p)) return p
  return candidates[0]
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    title: 'DEK-DRIVSIM CyberCafe - PC Kiosk',
    show: false,
    backgroundColor: '#020617',
    autoHideMenuBar: true,
  })

  const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, 'dist', 'index.html')}`
  if (isDev) mainWindow.loadURL(url)
  else mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))

  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.webContents.setWindowOpenHandler(({ url: u }) => { shell.openExternal(u); return { action: 'deny' } })
}

async function waitForFlask(timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${FLASK_PORT}/api/settings`, (res) => {
          res.resume()
          if (res.statusCode === 200) resolve()
          else reject(new Error('status ' + res.statusCode))
        })
        req.on('error', reject)
        req.setTimeout(800, () => { req.destroy(new Error('timeout')) })
      })
      return true
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

function startFlaskServer() {
  if (flaskProcess) return Promise.resolve(true)
  const script = getFlaskScriptPath()
  const py = getPythonExecutable()
  const cwd = path.dirname(script)

  console.log('[DEK] Flask script:', script)

  flaskProcess = spawn(py, [script], {
    cwd,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', DEK_FLASK_PORT: String(FLASK_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  flaskProcess.stdout.on('data', d => console.log('[Flask]', d.toString().trim()))
  flaskProcess.stderr.on('data', d => console.error('[Flask]', d.toString().trim()))
  flaskProcess.on('exit', (code) => { console.log('[Flask] exit', code); flaskProcess = null })
  flaskProcess.on('error', (err) => console.error('[Flask] spawn error', err))

  return waitForFlask()
}

function stopFlaskServer() {
  if (flaskProcess) {
    try { flaskProcess.kill() } catch {}
    flaskProcess = null
  }
}

app.whenReady().then(async () => {
  const ok = await startFlaskServer()
  if (!ok) console.error('[DEK] Flask did not become ready in time, UI will show network error')
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => { stopFlaskServer(); if (process.platform !== 'darwin') app.quit() })
app.on('before-quit', stopFlaskServer)

// IPC
ipcMain.handle('get-flask-port', () => FLASK_PORT)
ipcMain.handle('get-api-base-url', () => `http://127.0.0.1:${FLASK_PORT}`)
ipcMain.handle('get-local-ip', () => {
  const ifs = os.networkInterfaces()
  for (const name of Object.keys(ifs)) {
    for (const it of ifs[name] || []) {
      if (it.family === 'IPv4' && !it.internal) return it.address
    }
  }
  return '127.0.0.1'
})
ipcMain.handle('open-external', async (_e, url) => { await shell.openExternal(url) })
