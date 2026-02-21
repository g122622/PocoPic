import { app } from 'electron'
import { cpus } from 'node:os'
import { dirname, join } from 'node:path'
import { promises as fs } from 'node:fs'
import type { AppSettings, FileSizeUnit } from '../../shared/types'

interface PartialSettings extends Partial<AppSettings> {}

export class SettingsService {
  private readonly _settingsPath: string

  public constructor() {
    this._settingsPath = join(app.getPath('userData'), 'settings.json')
  }

  public async getSettings(): Promise<AppSettings> {
    const raw = await this._readPartial()
    const workerCountDefault = Math.max(1, Math.floor(cpus().length / 2))

    return {
      indexDbPath: raw.indexDbPath ?? '',
      thumbnailDir: raw.thumbnailDir ?? '',
      tmpDir: raw.tmpDir ?? '',
      sourceDirs: raw.sourceDirs ?? [],
      excludeDirKeywords: this._normalizeKeywords(raw.excludeDirKeywords),
      excludeFileKeywords: this._normalizeKeywords(raw.excludeFileKeywords),
      excludeFileSizeLessThan: this._normalizeSizeValue(raw.excludeFileSizeLessThan),
      excludeFileSizeLessThanUnit: this._normalizeSizeUnit(raw.excludeFileSizeLessThanUnit),
      excludeFileSizeGreaterThan: this._normalizeSizeValue(raw.excludeFileSizeGreaterThan),
      excludeFileSizeGreaterThanUnit: this._normalizeSizeUnit(raw.excludeFileSizeGreaterThanUnit),
      workerCount: raw.workerCount ?? workerCountDefault,
      thumbnailSize: raw.thumbnailSize ?? 256,
      thumbnailQuality: raw.thumbnailQuality ?? 80,
      ignoreLocationData: raw.ignoreLocationData ?? true,
      colorMode: raw.colorMode ?? 'system'
    }
  }

  public async updateSettings(next: PartialSettings): Promise<AppSettings> {
    const current = await this.getSettings()
    const merged: AppSettings = {
      ...current,
      ...next,
      sourceDirs: next.sourceDirs ?? current.sourceDirs
    }

    await fs.mkdir(dirname(this._settingsPath), { recursive: true })
    await fs.writeFile(this._settingsPath, JSON.stringify(merged, null, 2), 'utf-8')

    return merged
  }

  private async _readPartial(): Promise<PartialSettings> {
    try {
      const content = await fs.readFile(this._settingsPath, 'utf-8')
      const parsed = JSON.parse(content) as PartialSettings
      return parsed
    } catch {
      return {}
    }
  }

  private _normalizeKeywords(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return []
    }

    const result: string[] = []
    for (const item of value) {
      if (typeof item !== 'string') {
        continue
      }
      const keyword = item.trim()
      if (keyword.length > 0) {
        result.push(keyword)
      }
    }

    return result
  }

  private _normalizeSizeValue(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return null
    }

    return value
  }

  private _normalizeSizeUnit(value: unknown): FileSizeUnit {
    if (value === 'MB' || value === 'GB') {
      return value
    }

    return 'KB'
  }
}
