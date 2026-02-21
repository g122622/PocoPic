import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import type {
  AppSettings,
  BuildErrorItem,
  BuildStatus,
  MediaFilterQuery,
  MediaQuery,
  MediaQueryResult,
  StorageStats,
  YearBucket
} from '../../shared/types'
import { SettingsService } from '../services/SettingsService'
import { DatabaseService } from '../services/DatabaseService'
import { BuildService } from '../services/BuildService'
import { ThumbnailDatabaseService } from '../services/ThumbnailDatabaseService'
import { resolveThumbnailDbPath } from '../services/PathResolver'

interface RegisterIpcParams {
  getWindow: () => BrowserWindow | null
  settingsService: SettingsService
  databaseService: DatabaseService
  thumbnailDatabaseService: ThumbnailDatabaseService
  buildService: BuildService
}

export function registerIpc(params: RegisterIpcParams): void {
  const { getWindow, settingsService, databaseService, thumbnailDatabaseService, buildService } = params

  buildService.on('status', (status: BuildStatus) => {
    getWindow()?.webContents.send('build:status', status)
  })

  buildService.on('fatal', (message: string) => {
    getWindow()?.webContents.send('build:fatal', message)
  })

  buildService.on('error-item', (item: Omit<BuildErrorItem, 'id'>) => {
    getWindow()?.webContents.send('build:error-item', item)
  })

  ipcMain.handle('settings:get', async () => {
    const settings = await settingsService.getSettings()
    if (settings.indexDbPath) {
      await ensureDatabaseConnection(databaseService, thumbnailDatabaseService, settings)
    }
    return settings
  })

  ipcMain.handle('settings:update', async (_, next: Partial<AppSettings>) => {
    const settings = await settingsService.updateSettings(next)
    await ensureDatabaseConnection(databaseService, thumbnailDatabaseService, settings)
    return settings
  })

  ipcMain.handle('dialog:choose-index-db', async () => {
    const result = await dialog.showSaveDialog({
      title: '选择元数据索引数据库路径',
      filters: [{ name: 'SQLite 数据库', extensions: ['db', 'sqlite'] }],
      defaultPath: 'pocopic-index.db'
    })

    return result.canceled ? '' : result.filePath
  })

  ipcMain.handle('dialog:choose-thumbnail-dir', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择缩略图目录',
      properties: ['openDirectory', 'createDirectory']
    })

    return result.canceled ? '' : result.filePaths[0]
  })

  ipcMain.handle('dialog:choose-source-dir', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择扫描目录',
      properties: ['openDirectory', 'createDirectory']
    })

    return result.canceled ? '' : result.filePaths[0]
  })

  ipcMain.handle('dialog:choose-tmp-dir', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择临时目录',
      properties: ['openDirectory', 'createDirectory']
    })

    return result.canceled ? '' : result.filePaths[0]
  })

  ipcMain.handle('path:open', async (_, fullPath: string) => {
    if (!fullPath) {
      throw new Error('路径不能为空。')
    }
    await shell.openPath(fullPath)
  })

  ipcMain.handle('media:open', async (_, mediaPath: string) => {
    if (!mediaPath) {
      throw new Error('媒体路径不能为空。')
    }
    await shell.openPath(mediaPath)
  })

  ipcMain.handle('build:start', async () => {
    const settings = await settingsService.getSettings()
    await ensureDatabaseConnection(databaseService, thumbnailDatabaseService, settings)
    await buildService.startBuild(settings)
  })

  ipcMain.handle('build:pause', () => {
    buildService.pauseBuild()
  })

  ipcMain.handle('build:resume', () => {
    buildService.resumeBuild()
  })

  ipcMain.handle('build:cancel', async () => {
    await buildService.cancelBuild()
  })

  ipcMain.handle('build:status', () => {
    return buildService.getStatus()
  })

  ipcMain.handle('errors:list', (_, limit: number) => {
    return databaseService.queryBuildErrors(limit)
  })

  ipcMain.handle('errors:clear', () => {
    databaseService.clearBuildErrors()
  })

  ipcMain.handle('media:query', (_, query: MediaQuery): MediaQueryResult => {
    return databaseService.queryMedia(query)
  })

  ipcMain.handle('media:year-buckets', (_, query: MediaFilterQuery): YearBucket[] => {
    return databaseService.queryYearBuckets(query)
  })

  ipcMain.handle('media:favorite', (_, mediaId: number, isFavorite: boolean) => {
    databaseService.toggleFavorite(mediaId, isFavorite)
  })

  ipcMain.handle('storage:stats', async (): Promise<StorageStats> => {
    const settings = await settingsService.getSettings()
    const indexDbBytes = settings.indexDbPath ? await safeFileSize(settings.indexDbPath) : 0
    const thumbnailBytes = settings.thumbnailDir ? await safeFileSize(resolveThumbnailDbPath(settings.thumbnailDir)) : 0

    return {
      indexDbBytes,
      thumbnailBytes
    }
  })

  ipcMain.handle('storage:clear-index', async () => {
    const settings = await settingsService.getSettings()
    if (!settings.indexDbPath) {
      throw new Error('未设置元数据索引路径。')
    }

    databaseService.close()
    await fs.mkdir(dirname(settings.indexDbPath), { recursive: true })
    await fs.rm(settings.indexDbPath, { force: true })
    await databaseService.connect(settings.indexDbPath)
  })

  ipcMain.handle('storage:clear-thumbnails', async () => {
    const settings = await settingsService.getSettings()
    if (!settings.thumbnailDir) {
      throw new Error('未设置缩略图目录。')
    }

    thumbnailDatabaseService.clearThumbnails()
  })
}

async function ensureDatabaseConnection(
  databaseService: DatabaseService,
  thumbnailDatabaseService: ThumbnailDatabaseService,
  settings: AppSettings
): Promise<void> {
  if (!settings.indexDbPath || !settings.thumbnailDir) {
    return
  }

  databaseService.close()
  thumbnailDatabaseService.close()
  await databaseService.connect(settings.indexDbPath)
  await thumbnailDatabaseService.connect(resolveThumbnailDbPath(settings.thumbnailDir))
}

async function safeFileSize(filePath: string): Promise<number> {
  try {
    const stat = await fs.stat(filePath)
    return stat.size
  } catch {
    return 0
  }
}

