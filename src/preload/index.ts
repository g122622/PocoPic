import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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
} from '../shared/types'

// Custom APIs for renderer
const api = {
  getSettings: (): Promise<AppSettings> => electronAPI.ipcRenderer.invoke('settings:get'),
  updateSettings: (next: Partial<AppSettings>): Promise<AppSettings> =>
    electronAPI.ipcRenderer.invoke('settings:update', next),
  getProfileState: (): Promise<ProfileState> => electronAPI.ipcRenderer.invoke('profile:get-state'),
  createProfile: (name: string): Promise<ProfileState> =>
    electronAPI.ipcRenderer.invoke('profile:create', name),
  renameProfile: (profileId: string, name: string): Promise<ProfileState> =>
    electronAPI.ipcRenderer.invoke('profile:rename', profileId, name),
  switchProfile: (profileId: string): Promise<ProfileContext> =>
    electronAPI.ipcRenderer.invoke('profile:switch', profileId),

  chooseIndexDbPath: (): Promise<string> =>
    electronAPI.ipcRenderer.invoke('dialog:choose-index-db'),
  chooseThumbnailDir: (): Promise<string> =>
    electronAPI.ipcRenderer.invoke('dialog:choose-thumbnail-dir'),
  chooseSourceDir: (): Promise<string> =>
    electronAPI.ipcRenderer.invoke('dialog:choose-source-dir'),
  chooseTmpDir: (): Promise<string> => electronAPI.ipcRenderer.invoke('dialog:choose-tmp-dir'),

  openPath: (fullPath: string): Promise<void> =>
    electronAPI.ipcRenderer.invoke('path:open', fullPath),
  openMedia: (mediaPath: string): Promise<void> =>
    electronAPI.ipcRenderer.invoke('media:open', mediaPath),
  showMediaItemContextMenu: (mediaPath: string): Promise<void> =>
    electronAPI.ipcRenderer.invoke('media:show-context-menu', mediaPath),

  startBuild: (): Promise<void> => electronAPI.ipcRenderer.invoke('build:start'),
  pauseBuild: (): Promise<void> => electronAPI.ipcRenderer.invoke('build:pause'),
  resumeBuild: (): Promise<void> => electronAPI.ipcRenderer.invoke('build:resume'),
  cancelBuild: (): Promise<void> => electronAPI.ipcRenderer.invoke('build:cancel'),
  getBuildStatus: (): Promise<BuildStatus> => electronAPI.ipcRenderer.invoke('build:status'),

  queryMedia: (query: MediaQuery): Promise<MediaQueryResult> =>
    electronAPI.ipcRenderer.invoke('media:query', query),
  queryYearTimelineBuckets: (query: MediaFilterQuery): Promise<YearTimelineBucket[]> =>
    electronAPI.ipcRenderer.invoke('media:year-timeline-buckets', query),
  queryScrollOffsetBeforeTime: (query: MediaScrollTargetQuery): Promise<number> =>
    electronAPI.ipcRenderer.invoke('media:scroll-offset-before-time', query),
  setFavorite: (mediaId: number, isFavorite: boolean): Promise<void> =>
    electronAPI.ipcRenderer.invoke('media:favorite', mediaId, isFavorite),

  listErrors: (limit: number): Promise<BuildErrorItem[]> =>
    electronAPI.ipcRenderer.invoke('errors:list', limit),
  clearErrors: (): Promise<void> => electronAPI.ipcRenderer.invoke('errors:clear'),

  minimizeWindow: (): Promise<void> => electronAPI.ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: (): Promise<void> =>
    electronAPI.ipcRenderer.invoke('window:toggle-maximize'),
  toggleDevTools: (): Promise<void> => electronAPI.ipcRenderer.invoke('window:toggle-devtools'),
  closeWindow: (): Promise<void> => electronAPI.ipcRenderer.invoke('window:close'),
  isWindowMaximized: (): Promise<boolean> => electronAPI.ipcRenderer.invoke('window:is-maximized'),
  reloadWindow: (): Promise<void> => electronAPI.ipcRenderer.invoke('window:reload'),

  getStorageStats: (): Promise<StorageStats> => electronAPI.ipcRenderer.invoke('storage:stats'),
  clearIndexDb: (): Promise<void> => electronAPI.ipcRenderer.invoke('storage:clear-index'),
  clearThumbnails: (): Promise<void> => electronAPI.ipcRenderer.invoke('storage:clear-thumbnails'),

  onBuildStatus: (listener: (status: BuildStatus) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: BuildStatus): void =>
      listener(payload)
    electronAPI.ipcRenderer.on('build:status', wrapped)
    return (): void => {
      electronAPI.ipcRenderer.removeListener('build:status', wrapped)
    }
  },

  onBuildFatal: (listener: (message: string) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: string): void => listener(payload)
    electronAPI.ipcRenderer.on('build:fatal', wrapped)
    return (): void => {
      electronAPI.ipcRenderer.removeListener('build:fatal', wrapped)
    }
  },

  onBuildErrorItem: (listener: (item: Omit<BuildErrorItem, 'id'>) => void): (() => void) => {
    const wrapped = (
      _event: Electron.IpcRendererEvent,
      payload: Omit<BuildErrorItem, 'id'>
    ): void => listener(payload)
    electronAPI.ipcRenderer.on('build:error-item', wrapped)
    return (): void => {
      electronAPI.ipcRenderer.removeListener('build:error-item', wrapped)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
