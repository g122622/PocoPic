import { app } from 'electron'
import { cpus } from 'node:os'
import { dirname, join } from 'node:path'
import { promises as fs } from 'node:fs'
import type { AppSettings } from '../../shared/types'

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
}
