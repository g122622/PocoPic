import { BrowserWindow, clipboard, dialog, ipcMain, Menu, shell } from 'electron'
import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'
import { promisify } from 'node:util'
import type {
  AppSettings,
  BuildErrorItem,
  BuildStatus,
  MediaFilterQuery,
  ProfileContext,
  ProfileState,
  MediaQuery,
  MediaQueryResult,
  MediaScrollTargetQuery,
  StorageStats,
  YearTimelineBucket
} from '../../shared/types'
import { SettingsService } from '../services/SettingsService'
import { DatabaseService } from '../services/DatabaseService'
import { BuildService } from '../services/BuildService'
import { ThumbnailDatabaseService } from '../services/ThumbnailDatabaseService'
import { resolveThumbnailDbPath } from '../services/PathResolver'
import { ProfileService } from '../services/ProfileService'

interface RegisterIpcParams {
  getWindow: () => BrowserWindow | null
  profileService: ProfileService
  settingsService: SettingsService
  databaseService: DatabaseService
  thumbnailDatabaseService: ThumbnailDatabaseService
  buildService: BuildService
}

const execFileAsync = promisify(execFile)

export function registerIpc(params: RegisterIpcParams): void {
  const {
    getWindow,
    profileService,
    settingsService,
    databaseService,
    thumbnailDatabaseService,
    buildService
  } = params

  const ensureIdleBeforeProfileMutation = (): void => {
    const status = buildService.getStatus()
    if (status.state === 'running' || status.state === 'scanning' || status.state === 'paused') {
      throw new Error('构建进行中，暂不允许切换或修改 Profile。')
    }
  }

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
    await settingsService.initializeProfileSettingsIfNeeded()
    const settings = await settingsService.getSettings()
    if (settings.indexDbPath) {
      await ensureDatabaseConnection(databaseService, thumbnailDatabaseService, settings)
    }
    return settings
  })

  ipcMain.handle('settings:update', async (_, next: Partial<AppSettings>) => {
    await settingsService.initializeProfileSettingsIfNeeded()
    const settings = await settingsService.updateSettings(next)
    await ensureDatabaseConnection(databaseService, thumbnailDatabaseService, settings)
    return settings
  })

  ipcMain.handle('profile:get-state', async (): Promise<ProfileState> => {
    return profileService.getState()
  })

  ipcMain.handle('profile:create', async (_, name: string): Promise<ProfileState> => {
    ensureIdleBeforeProfileMutation()
    await profileService.createProfile(name)
    return profileService.getState()
  })

  ipcMain.handle(
    'profile:rename',
    async (_, profileId: string, name: string): Promise<ProfileState> => {
      ensureIdleBeforeProfileMutation()
      await profileService.renameProfile(profileId, name)
      return profileService.getState()
    }
  )

  ipcMain.handle('profile:switch', async (_, profileId: string): Promise<ProfileContext> => {
    ensureIdleBeforeProfileMutation()
    await profileService.switchProfile(profileId)
    await settingsService.initializeProfileSettingsIfNeeded()
    const settings = await settingsService.getSettings()
    await ensureDatabaseConnection(databaseService, thumbnailDatabaseService, settings)
    const state = await profileService.getState()

    return {
      state,
      settings
    }
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

  ipcMain.handle('media:show-context-menu', async (_, mediaPath: string) => {
    if (!mediaPath) {
      throw new Error('媒体路径不能为空。')
    }

    const window = getWindow()
    if (!window) {
      throw new Error('主窗口未初始化。')
    }

    await new Promise<void>((resolve) => {
      let settled = false

      const done = (): void => {
        if (!settled) {
          settled = true
          resolve()
        }
      }

      const runAction = (action: () => Promise<void>): void => {
        void action()
          .catch((error: unknown) => {
            dialog.showErrorBox('操作失败', error instanceof Error ? error.message : '未知错误')
          })
          .finally(() => {
            done()
          })
      }

      const menu = Menu.buildFromTemplate([
        {
          label: '打开',
          click: () => {
            runAction(() => shell.openPath(mediaPath).then(() => undefined))
          }
        },
        {
          label: '打开路径',
          click: () => {
            shell.showItemInFolder(mediaPath)
            done()
          }
        },
        {
          label: '复制',
          click: () => {
            clipboard.writeText(mediaPath)
            done()
          }
        },
        {
          label: '属性',
          click: () => {
            runAction(() => showFileProperties(mediaPath))
          }
        }
      ])

      menu.popup({
        window,
        callback: () => {
          done()
        }
      })
    })
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

  ipcMain.handle(
    'media:year-timeline-buckets',
    (_, query: MediaFilterQuery): YearTimelineBucket[] => {
      return databaseService.queryYearTimelineBuckets(query)
    }
  )

  ipcMain.handle('media:scroll-offset-before-time', (_, query: MediaScrollTargetQuery): number => {
    return databaseService.queryOffsetBeforeTime(query)
  })

  ipcMain.handle('media:favorite', (_, mediaId: number, isFavorite: boolean) => {
    databaseService.toggleFavorite(mediaId, isFavorite)
  })

  ipcMain.handle('storage:stats', async (): Promise<StorageStats> => {
    const settings = await settingsService.getSettings()
    const indexDbBytes = settings.indexDbPath ? await safeFileSize(settings.indexDbPath) : 0
    const thumbnailBytes = settings.thumbnailDir
      ? await safeFileSize(resolveThumbnailDbPath(settings.thumbnailDir))
      : 0

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

  ipcMain.handle('window:minimize', () => {
    const window = getWindow()
    if (!window) {
      throw new Error('主窗口未初始化。')
    }

    window.minimize()
  })

  ipcMain.handle('window:toggle-maximize', () => {
    const window = getWindow()
    if (!window) {
      throw new Error('主窗口未初始化。')
    }

    if (window.isMaximized()) {
      window.unmaximize()
      return
    }

    window.maximize()
  })

  ipcMain.handle('window:toggle-devtools', () => {
    const window = getWindow()
    if (!window) {
      throw new Error('主窗口未初始化。')
    }

    window.webContents.toggleDevTools()
  })

  ipcMain.handle('window:close', () => {
    const window = getWindow()
    if (!window) {
      throw new Error('主窗口未初始化。')
    }

    window.close()
  })

  ipcMain.handle('window:is-maximized', () => {
    const window = getWindow()
    if (!window) {
      return false
    }

    return window.isMaximized()
  })

  ipcMain.handle('window:reload', () => {
    const window = getWindow()
    if (!window) {
      throw new Error('主窗口未初始化。')
    }

    window.webContents.reload()
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

async function showFileProperties(filePath: string): Promise<void> {
  if (process.platform !== 'win32') {
    await shell.openPath(filePath)
    return
  }

  const escapedPath = filePath.replaceAll("'", "''")
  const command = [
    `$path = '${escapedPath}'`,
    '$shell = New-Object -ComObject Shell.Application',
    '$directory = Split-Path -Path $path -Parent',
    '$name = Split-Path -Path $path -Leaf',
    '$folder = $shell.Namespace($directory)',
    'if ($null -eq $folder) { throw "无法访问目标目录。" }',
    '$item = $folder.ParseName($name)',
    'if ($null -eq $item) { throw "未找到目标文件。" }',
    '$verbs = $item.Verbs()',
    '$targetVerb = $null',
    'foreach ($verb in $verbs) {',
    '  $text = $verb.Name.Replace("&", "").Trim().ToLowerInvariant()',
    '  if ($text.Contains("property") -or $text.Contains("prop") -or $text.Contains("属")) {',
    '    $targetVerb = $verb',
    '    break',
    '  }',
    '}',
    'if ($null -ne $targetVerb) {',
    '  $targetVerb.DoIt()',
    '} else {',
    '  $item.InvokeVerb("Properties")',
    '}'
  ].join('; ')
  await execFileAsync('powershell.exe', ['-NoProfile', '-Command', command])
}
