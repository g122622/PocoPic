export type MediaType = 'image' | 'video'

export interface AppSettings {
  indexDbPath: string
  thumbnailDir: string
  sourceDirs: string[]
  workerCount: number
  thumbnailSize: number
  thumbnailQuality: number
  ignoreLocationData: boolean
  colorMode: 'system' | 'light' | 'dark'
}

export interface BuildStatus {
  buildId: string
  state: 'idle' | 'scanning' | 'running' | 'paused' | 'cancelled' | 'completed' | 'failed'
  total: number
  processed: number
  succeeded: number
  failed: number
  currentDirectory: string
  currentFile: string
  startedAt: number
  endedAt: number
}

export interface BuildErrorItem {
  id: number
  buildId: string
  filePath: string
  stage: 'scan' | 'metadata' | 'thumbnail' | 'db'
  message: string
  createdAt: number
}

export interface MediaItem {
  id: number
  filePath: string
  fileName: string
  mediaType: MediaType
  extension: string
  sizeBytes: number
  width: number | null
  height: number | null
  durationMs: number | null
  capturedAt: number
  mtimeMs: number
  deviceModel: string | null
  gpsLat: number | null
  gpsLng: number | null
  thumbnailPath: string
  isFavorite: 0 | 1
  faceClusterId: string | null
  locationName: string | null
  aiTags: string | null
}

export interface MediaQuery {
  keyword: string
  startTime: number | null
  endTime: number | null
  favoritesOnly: boolean
  offset: number
  limit: number
}

export interface MediaQueryResult {
  total: number
  items: MediaItem[]
}

export interface StorageStats {
  indexDbBytes: number
  thumbnailBytes: number
}

export interface BuildTask {
  filePath: string
  thumbnailSize: number
  thumbnailQuality: number
  ignoreLocationData: boolean
}

export interface BuildTaskResult {
  ok: boolean
  record: Omit<MediaItem, 'id' | 'isFavorite' | 'faceClusterId' | 'locationName' | 'aiTags'> | null
  thumbnailKey: string | null
  thumbnailBytes: Uint8Array | null
  errorStage: 'metadata' | 'thumbnail' | null
  errorMessage: string
}
