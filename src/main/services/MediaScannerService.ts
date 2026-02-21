import { Dirent, promises as fs } from 'node:fs'
import { basename, extname, join } from 'node:path'
import type { AppSettings } from '../../shared/types'

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.heic',
  '.heif',
  '.avif',
  '.tif',
  '.tiff'
])

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.flv',
  '.3gp',
  '.mkv',
  '.avi',
  '.wmv',
  '.m4v',
  '.webm'
])

export class MediaScannerService {
  public async scan(
    settings: AppSettings,
    onProgress: (currentDirectory: string, currentFile: string) => void,
    isCancelled: () => boolean
  ): Promise<string[]> {
    const files: string[] = []
    const options: ScanExcludeOptions = {
      directoryKeywords: settings.excludeDirKeywords,
      fileKeywords: settings.excludeFileKeywords,
      minSizeBytes: this._toBytes(settings.excludeFileSizeLessThan, settings.excludeFileSizeLessThanUnit),
      maxSizeBytes: this._toBytes(settings.excludeFileSizeGreaterThan, settings.excludeFileSizeGreaterThanUnit)
    }

    for (const sourceDir of settings.sourceDirs) {
      await this._walk(sourceDir, files, options, onProgress, isCancelled)
    }

    return files
  }

  public isMediaFile(filePath: string): boolean {
    const extension = extname(filePath).toLowerCase()
    return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension)
  }

  public detectMediaType(filePath: string): 'image' | 'video' {
    const extension = extname(filePath).toLowerCase()
    if (IMAGE_EXTENSIONS.has(extension)) {
      return 'image'
    }
    if (VIDEO_EXTENSIONS.has(extension)) {
      return 'video'
    }
    throw new Error(`不支持的媒体类型: ${basename(filePath)}`)
  }

  private async _walk(
    rootDir: string,
    files: string[],
    options: ScanExcludeOptions,
    onProgress: (currentDirectory: string, currentFile: string) => void,
    isCancelled: () => boolean
  ): Promise<void> {
    const queue: string[] = [rootDir]

    while (queue.length > 0) {
      if (isCancelled()) {
        return
      }

      const currentDir = queue.shift() as string
      if (this._shouldExcludeDirectory(currentDir, options.directoryKeywords)) {
        continue
      }

      let dirEntries: Dirent[]
      try {
        dirEntries = await fs.readdir(currentDir, { withFileTypes: true })
      } catch {
        continue
      }

      for (const entry of dirEntries) {
        if (isCancelled()) {
          return
        }

        const entryName = String(entry.name)
        const fullPath = join(currentDir, entryName)
        onProgress(currentDir, entryName)

        if (entry.isDirectory()) {
          if (!this._shouldExcludeDirectory(fullPath, options.directoryKeywords)) {
            queue.push(fullPath)
          }
          continue
        }

        if (!entry.isFile() || !this.isMediaFile(fullPath)) {
          continue
        }

        if (this._shouldExcludeFileByKeyword(fullPath, options.fileKeywords)) {
          continue
        }

        if (await this._shouldExcludeFileBySize(fullPath, options)) {
          continue
        }

        files.push(fullPath)
      }
    }
  }

  private _shouldExcludeDirectory(directoryPath: string, keywords: string[]): boolean {
    if (keywords.length === 0) {
      return false
    }

    const lowerPath = directoryPath.toLowerCase()
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (lowerKeyword && lowerPath.includes(lowerKeyword)) {
        return true
      }
    }

    return false
  }

  private _shouldExcludeFileByKeyword(filePath: string, keywords: string[]): boolean {
    if (keywords.length === 0) {
      return false
    }

    const lowerFileName = basename(filePath).toLowerCase()
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (lowerKeyword && lowerFileName.includes(lowerKeyword)) {
        return true
      }
    }

    return false
  }

  private async _shouldExcludeFileBySize(filePath: string, options: ScanExcludeOptions): Promise<boolean> {
    if (options.minSizeBytes === null && options.maxSizeBytes === null) {
      return false
    }

    let size: number
    try {
      const stat = await fs.stat(filePath)
      size = stat.size
    } catch {
      return true
    }

    if (options.minSizeBytes !== null && size < options.minSizeBytes) {
      return true
    }

    if (options.maxSizeBytes !== null && size > options.maxSizeBytes) {
      return true
    }

    return false
  }

  private _toBytes(value: number | null, unit: 'KB' | 'MB' | 'GB'): number | null {
    if (value === null || !Number.isFinite(value) || value <= 0) {
      return null
    }

    if (unit === 'MB') {
      return value * 1024 * 1024
    }

    if (unit === 'GB') {
      return value * 1024 * 1024 * 1024
    }

    return value * 1024
  }
}

interface ScanExcludeOptions {
  directoryKeywords: string[]
  fileKeywords: string[]
  minSizeBytes: number | null
  maxSizeBytes: number | null
}
