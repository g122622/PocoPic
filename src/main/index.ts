import { app, shell, BrowserWindow, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { SettingsService } from './services/SettingsService'
import { DatabaseService } from './services/DatabaseService'
import { MediaScannerService } from './services/MediaScannerService'
import { BuildService } from './services/BuildService'
import { registerIpc } from './ipc/registerIpc'
import { ThumbnailDatabaseService } from './services/ThumbnailDatabaseService'

let mainWindow: BrowserWindow | null = null

const settingsService = new SettingsService()
const databaseService = new DatabaseService()
const thumbnailDatabaseService = new ThumbnailDatabaseService()
const scannerService = new MediaScannerService()
const buildService = new BuildService(scannerService, databaseService, thumbnailDatabaseService)

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'pocopic-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true
    }
  }
])

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 880,
    minHeight: 620,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#f8f4ff',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  protocol.handle('pocopic-media', (request) => {
    const url = new URL(request.url)
    const thumbnailKey = url.searchParams.get('key')

    if (!thumbnailKey) {
      return new Response('missing thumbnail key', { status: 400 })
    }

    try {
      const thumbnail = thumbnailDatabaseService.getThumbnail(thumbnailKey)
      if (!thumbnail) {
        return new Response('thumbnail not found', { status: 404 })
      }

      return new Response(new Uint8Array(thumbnail), {
        status: 200,
        headers: {
          'content-type': 'image/webp',
          'cache-control': 'public, max-age=31536000'
        }
      })
    } catch {
      return new Response('thumbnail db unavailable', { status: 503 })
    }
  })

  registerIpc({
    getWindow: () => mainWindow,
    settingsService,
    databaseService,
    thumbnailDatabaseService,
    buildService
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  void buildService.cancelBuild()
  databaseService.close()
  thumbnailDatabaseService.close()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
