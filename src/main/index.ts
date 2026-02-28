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

  createWindow()

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
