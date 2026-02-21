import { join } from 'node:path'

export const THUMBNAIL_DB_FILE_NAME = 'pocopic-thumb.db'

export function resolveThumbnailDbPath(thumbnailDir: string): string {
  return join(thumbnailDir, THUMBNAIL_DB_FILE_NAME)
}
