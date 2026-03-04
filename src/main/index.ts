import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { initDB, closeDB } from './database/connection'
import { runMigrations } from './database/migrations'
import { registerLeadsIPC } from './ipc/leads.ipc'
import { registerActivitiesIPC } from './ipc/activities.ipc'
import { registerGamificationIPC } from './ipc/gamification.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import { registerSearchIPC } from './ipc/search.ipc'
import { registerAgentsIPC } from './ipc/agents.ipc'
import { registerMonitorIPC } from './ipc/monitor.ipc'
import { registerAuthIPC } from './ipc/auth.ipc'
import { registerProductIPC } from './ipc/product.ipc'
import { registerCallModeIPC } from './ipc/callmode.ipc'
import { registerFollowUpsIPC } from './ipc/followups.ipc'
import { registerScriptsIPC } from './ipc/scripts.ipc'
import { registerAnalyticsIPC } from './ipc/analytics.ipc'
import { registerEmailIPC } from './ipc/email.ipc'
import { handleOAuthCallback } from './ipc/auth.ipc'

const PROTOCOL = 'wolfengine'

// Register as default protocol handler
if (process.defaultApp) {
  // Dev mode: register with path to electron executable + script
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [process.argv[1]])
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

// Single instance lock — required so Windows routes deep links to existing instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#0a0e27',
    title: 'Wolf Tool',
    icon: join(__dirname, '../../resources/icon.ico'),
    titleBarStyle: 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Windows/Linux: deep link arrives via second-instance event
app.on('second-instance', (_event, argv) => {
  // The deep link URL is the last argument
  const url = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
  if (url) {
    handleDeepLink(url)
  }
  // Focus existing window
  const win = BrowserWindow.getAllWindows()[0]
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

// macOS: deep link arrives via open-url event
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

function handleDeepLink(url: string): void {
  if (url.startsWith(`${PROTOCOL}://auth/callback`)) {
    handleOAuthCallback(url)
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.tekta.wolf-tool')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Init database
  const db = await initDB()
  runMigrations(db)

  // App version
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // Register IPC handlers
  registerLeadsIPC()
  registerActivitiesIPC()
  registerGamificationIPC()
  registerSettingsIPC()
  registerSearchIPC()
  registerAgentsIPC()
  registerMonitorIPC()
  registerAuthIPC()
  registerProductIPC()
  registerCallModeIPC()
  registerFollowUpsIPC()
  registerScriptsIPC()
  registerAnalyticsIPC()
  registerEmailIPC()

  createWindow()

  // Cold-start deep link: check if app was launched with a protocol URL (Windows)
  const deepLinkUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
  if (deepLinkUrl) {
    handleDeepLink(deepLinkUrl)
  }

  // Silent auto-updater: downloads in background, installs on quit
  if (!is.dev) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.logger = null
    autoUpdater.checkForUpdates().catch(() => {})
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {})
    }, 4 * 60 * 60 * 1000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDB()
  if (process.platform !== 'darwin') app.quit()
})
