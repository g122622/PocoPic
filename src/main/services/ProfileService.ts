import { randomUUID } from 'node:crypto'
import { promises as fs, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import type { ProfileState, ProfileSummary } from '../../shared/types'
import { resolveProfileDir } from './PathResolver'

interface ProfileStateFile {
  currentProfileId: string
  profiles: ProfileSummary[]
}

const DEFAULT_PROFILE_NAME = '默认空间'

export class ProfileService {
  private readonly _statePath: string
  private readonly _userDataPath: string

  public constructor() {
    this._userDataPath = app.getPath('userData')
    this._statePath = join(this._userDataPath, 'profiles.json')
  }

  public async initialize(): Promise<ProfileState> {
    const state = await this._readState()
    await this._writeState(state)
    return state
  }

  public async getState(): Promise<ProfileState> {
    const state = await this._readState()
    if (!(await this._hasStateFile())) {
      await this._writeState(state)
    }
    return state
  }

  public getProfileDir(profileId: string): string {
    return resolveProfileDir(this._userDataPath, profileId)
  }

  public getCurrentProfileIdSync(): string {
    return this._readStateSync().currentProfileId
  }

  public async createProfile(name: string): Promise<ProfileSummary> {
    const normalizedName = this._normalizeProfileName(name)
    const state = await this._readState()
    const now = Date.now()
    const profile: ProfileSummary = {
      profileId: randomUUID(),
      name: normalizedName,
      createdAt: now,
      updatedAt: now
    }

    state.profiles.push(profile)
    await this._writeState(state)
    return profile
  }

  public async renameProfile(profileId: string, name: string): Promise<ProfileSummary> {
    const normalizedName = this._normalizeProfileName(name)
    const state = await this._readState()
    const profile = this._findProfileById(state, profileId)
    profile.name = normalizedName
    profile.updatedAt = Date.now()
    await this._writeState(state)
    return profile
  }

  public async switchProfile(profileId: string): Promise<ProfileState> {
    const state = await this._readState()
    this._findProfileById(state, profileId)
    state.currentProfileId = profileId
    await this._writeState(state)
    return state
  }

  private _readStateSync(): ProfileStateFile {
    try {
      const content = readFileSync(this._statePath, 'utf-8')
      const parsed = JSON.parse(content) as Partial<ProfileStateFile>
      return this._normalizeState(parsed)
    } catch {
      const initial = this._createInitialState()
      void this._writeState(initial)
      return initial
    }
  }

  private async _readState(): Promise<ProfileStateFile> {
    try {
      const content = await fs.readFile(this._statePath, 'utf-8')
      const parsed = JSON.parse(content) as Partial<ProfileStateFile>
      return this._normalizeState(parsed)
    } catch {
      return this._createInitialState()
    }
  }

  private async _hasStateFile(): Promise<boolean> {
    try {
      await fs.access(this._statePath)
      return true
    } catch {
      return false
    }
  }

  private async _writeState(state: ProfileStateFile): Promise<void> {
    await fs.mkdir(dirname(this._statePath), { recursive: true })
    await fs.writeFile(this._statePath, JSON.stringify(state, null, 2), 'utf-8')
  }

  private _createInitialState(): ProfileStateFile {
    const now = Date.now()
    const profileId = randomUUID()
    const profile: ProfileSummary = {
      profileId,
      name: DEFAULT_PROFILE_NAME,
      createdAt: now,
      updatedAt: now
    }

    return {
      currentProfileId: profileId,
      profiles: [profile]
    }
  }

  private _normalizeState(state: Partial<ProfileStateFile>): ProfileStateFile {
    const resultProfiles: ProfileSummary[] = []

    if (Array.isArray(state.profiles)) {
      for (const item of state.profiles) {
        if (!item || typeof item !== 'object') {
          continue
        }

        const profileId = this._normalizeProfileId((item as Partial<ProfileSummary>).profileId)
        const name = this._normalizeProfileName(
          (item as Partial<ProfileSummary>).name ?? DEFAULT_PROFILE_NAME
        )
        const createdAt = this._normalizeTimestamp((item as Partial<ProfileSummary>).createdAt)
        const updatedAt = this._normalizeTimestamp((item as Partial<ProfileSummary>).updatedAt)

        resultProfiles.push({
          profileId,
          name,
          createdAt,
          updatedAt
        })
      }
    }

    if (resultProfiles.length === 0) {
      return this._createInitialState()
    }

    const requestedCurrentId = this._normalizeProfileId(state.currentProfileId)
    const hasRequestedCurrent = resultProfiles.some((item) => item.profileId === requestedCurrentId)
    const currentProfileId = hasRequestedCurrent ? requestedCurrentId : resultProfiles[0].profileId

    return {
      currentProfileId,
      profiles: resultProfiles
    }
  }

  private _normalizeProfileId(value: unknown): string {
    if (typeof value !== 'string') {
      return randomUUID()
    }

    const normalized = value.trim()
    if (!normalized) {
      return randomUUID()
    }

    return normalized
  }

  private _normalizeTimestamp(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return Date.now()
    }

    return Math.floor(value)
  }

  private _normalizeProfileName(value: string): string {
    const normalized = value.trim()
    if (!normalized) {
      throw new Error('Profile 名称不能为空。')
    }

    return normalized
  }

  private _findProfileById(state: ProfileStateFile, profileId: string): ProfileSummary {
    for (const profile of state.profiles) {
      if (profile.profileId === profileId) {
        return profile
      }
    }

    throw new Error('未找到指定的 Profile。')
  }
}
