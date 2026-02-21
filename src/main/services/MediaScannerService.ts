import { Dirent, promises as fs } from 'node:fs'
import { basename, extname, join } from 'node:path'

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
    sourceDirs: string[],
    onProgress: (currentDirectory: string, currentFile: string) => void,
    isCancelled: () => boolean
  ): Promise<string[]> {
    const files: string[] = []

    for (const sourceDir of sourceDirs) {
      await this._walk(sourceDir, files, onProgress, isCancelled)
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
    onProgress: (currentDirectory: string, currentFile: string) => void,
    isCancelled: () => boolean
  ): Promise<void> {
    const queue: string[] = [rootDir]

    while (queue.length > 0) {
      if (isCancelled()) {
        return
      }

      const currentDir = queue.shift() as string
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
          queue.push(fullPath)
          continue
        }

        if (entry.isFile() && this.isMediaFile(fullPath)) {
          files.push(fullPath)
        }
      }
    }
  }
}
