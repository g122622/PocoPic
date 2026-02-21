import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  AppSettings,
  BuildErrorItem,
  BuildStatus,
  MediaFilterQuery,
  MediaQuery,
  MediaQueryResult,
  StorageStats,
  YearBucket
} from '../shared/types'

interface PocoPicApi {
  getSettings: () => Promise<AppSettings>
  updateSettings: (next: Partial<AppSettings>) => Promise<AppSettings>
  chooseIndexDbPath: () => Promise<string>
  chooseThumbnailDir: () => Promise<string>
  chooseSourceDir: () => Promise<string>
  chooseTmpDir: () => Promise<string>
  openPath: (fullPath: string) => Promise<void>
  openMedia: (mediaPath: string) => Promise<void>
  startBuild: () => Promise<void>
  pauseBuild: () => Promise<void>
  resumeBuild: () => Promise<void>
  cancelBuild: () => Promise<void>
  getBuildStatus: () => Promise<BuildStatus>
  queryMedia: (query: MediaQuery) => Promise<MediaQueryResult>
  queryYearBuckets: (query: MediaFilterQuery) => Promise<YearBucket[]>
  setFavorite: (mediaId: number, isFavorite: boolean) => Promise<void>
  listErrors: (limit: number) => Promise<BuildErrorItem[]>
  clearErrors: () => Promise<void>
  getStorageStats: () => Promise<StorageStats>
  clearIndexDb: () => Promise<void>
  clearThumbnails: () => Promise<void>
  onBuildStatus: (listener: (status: BuildStatus) => void) => () => void
  onBuildFatal: (listener: (message: string) => void) => () => void
  onBuildErrorItem: (listener: (item: Omit<BuildErrorItem, 'id'>) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PocoPicApi
  }
}
