import { app } from 'electron'
import { cpus } from 'node:os'
import { dirname, join } from 'node:path'
import { promises as fs } from 'node:fs'
import type { AppSettings, FileSizeUnit } from '../../shared/types'
import { ProfileService } from './ProfileService'
import {
  resolveProfileIndexDbPath,
  resolveProfileSettingsPath,
  resolveProfileThumbnailDir,
  resolveProfileTmpDir
} from './PathResolver'

interface PartialSettings extends Partial<AppSettings> {}

export class SettingsService {
  private readonly _profileService: ProfileService
  private readonly _legacySettingsPath: string

  public constructor(profileService: ProfileService) {
    this._profileService = profileService
    this._legacySettingsPath = join(app.getPath('userData'), 'settings.json')
  }

  public async getSettings(): Promise<AppSettings> {
    const profileId = this._profileService.getCurrentProfileIdSync()
    const profileDir = this._profileService.getProfileDir(profileId)
    const settingsPath = resolveProfileSettingsPath(profileDir)
    const raw = await this._readPartial(settingsPath)
    return this._buildSettings(raw, profileDir)
  }

  public async updateSettings(next: PartialSettings): Promise<AppSettings> {
    const profileId = this._profileService.getCurrentProfileIdSync()
    const settingsPath = resolveProfileSettingsPath(this._profileService.getProfileDir(profileId))
    const current = await this.getSettings()
    const merged: AppSettings = {
      ...current,
      ...next,
      sourceDirs: next.sourceDirs ?? current.sourceDirs
    }

    await fs.mkdir(dirname(settingsPath), { recursive: true })
    await fs.writeFile(settingsPath, JSON.stringify(merged, null, 2), 'utf-8')

    return merged
  }

  public async initializeProfileSettingsIfNeeded(): Promise<void> {
    const profileId = this._profileService.getCurrentProfileIdSync()
    const settingsPath = resolveProfileSettingsPath(this._profileService.getProfileDir(profileId))

    try {
      await fs.access(settingsPath)
      return
    } catch {
      // do nothing
    }

    const legacy = await this._readPartial(this._legacySettingsPath)
    if (Object.keys(legacy).length === 0) {
      const defaults = await this.getSettings()
      await fs.mkdir(dirname(settingsPath), { recursive: true })
      await fs.writeFile(settingsPath, JSON.stringify(defaults, null, 2), 'utf-8')
      return
    }

    const settings = this._buildSettings(legacy, this._profileService.getProfileDir(profileId))
    await fs.mkdir(dirname(settingsPath), { recursive: true })
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
  }

  private _buildSettings(raw: PartialSettings, profileDir: string): AppSettings {
    const workerCountDefault = Math.max(1, Math.floor(cpus().length / 2))
    const defaultIndexDbPath = resolveProfileIndexDbPath(profileDir)
    const defaultThumbnailDir = resolveProfileThumbnailDir(profileDir)
    const defaultTmpDir = resolveProfileTmpDir(profileDir)

    return {
      indexDbPath: this._normalizePath(raw.indexDbPath, defaultIndexDbPath),
      thumbnailDir: this._normalizePath(raw.thumbnailDir, defaultThumbnailDir),
      tmpDir: this._normalizePath(raw.tmpDir, defaultTmpDir),
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
      showMediaCapturedAt: raw.showMediaCapturedAt ?? true,
      showMediaSize: raw.showMediaSize ?? true,
      colorMode: raw.colorMode ?? 'system'
    }
  }

  private async _readPartial(settingsPath: string): Promise<PartialSettings> {
    try {
      const content = await fs.readFile(settingsPath, 'utf-8')
      const parsed = JSON.parse(content) as PartialSettings
      return parsed
    } catch {
      return {}
    }
  }

  private _normalizePath(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback
    }

    const normalized = value.trim()
    if (!normalized) {
      return fallback
    }

    return normalized
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
