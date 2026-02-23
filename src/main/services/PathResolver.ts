import { join } from 'node:path'

export const THUMBNAIL_DB_FILE_NAME = 'pocopic-thumb.db'
export const PROFILE_ROOT_DIR_NAME = 'profiles'
export const PROFILE_SETTINGS_FILE_NAME = 'settings.json'
export const PROFILE_INDEX_DB_FILE_NAME = 'pocopic-index.db'
export const PROFILE_THUMBNAIL_DIR_NAME = 'thumbnails'
export const PROFILE_TMP_DIR_NAME = 'tmp'

export function resolveProfileDir(userDataPath: string, profileId: string): string {
  return join(userDataPath, PROFILE_ROOT_DIR_NAME, profileId)
}

export function resolveProfileSettingsPath(profileDir: string): string {
  return join(profileDir, PROFILE_SETTINGS_FILE_NAME)
}

export function resolveProfileIndexDbPath(profileDir: string): string {
  return join(profileDir, PROFILE_INDEX_DB_FILE_NAME)
}

export function resolveProfileThumbnailDir(profileDir: string): string {
  return join(profileDir, PROFILE_THUMBNAIL_DIR_NAME)
}

export function resolveProfileTmpDir(profileDir: string): string {
  return join(profileDir, PROFILE_TMP_DIR_NAME)
}

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

export function resolveHeicConvertTempPath(tmpDir: string): string {
  const resolvedTmpDir = resolveTmpDir(tmpDir)
  return join(resolvedTmpDir, `pocopic-heic-${Date.now()}-${Math.random()}.jpg`)
}
