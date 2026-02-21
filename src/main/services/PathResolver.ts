import { join } from 'node:path'

export const THUMBNAIL_DB_FILE_NAME = 'pocopic-thumb.db'

export function resolveThumbnailDbPath(thumbnailDir: string): string {
  return join(thumbnailDir, THUMBNAIL_DB_FILE_NAME)
}

export function resolveTmpDir(tmpDir: string): string {
  const normalized = tmpDir.trim()
  if (!normalized) {
    throw new Error('未设置临时目录，请先在设置面板中配置。')
  }

  return normalized
}

export function resolveVideoFrameTempPath(tmpDir: string): string {
  const resolvedTmpDir = resolveTmpDir(tmpDir)
  return join(resolvedTmpDir, `pocopic-frame-${Date.now()}-${Math.random()}.jpg`)
}
