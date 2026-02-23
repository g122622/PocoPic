import { computed, onUnmounted, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  AppSettings,
  BuildErrorItem,
  BuildStatus,
  MediaItem,
  ProfileSummary,
  StorageStats,
  YearTimelineBucket
} from '@shared/types'

type SettingsPatch = Partial<AppSettings>

const PAGE_SIZE = 200

export const useGalleryStore = defineStore('gallery', () => {
  const profiles = ref<ProfileSummary[]>([])
  const activeProfileId = ref('')
  const settings = ref<AppSettings | null>(null)
  const storageStats = ref<StorageStats>({ indexDbBytes: 0, thumbnailBytes: 0 })
  const buildStatus = ref<BuildStatus>({
    buildId: '',
    state: 'idle',
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentDirectory: '',
    currentFile: '',
    startedAt: 0,
    endedAt: 0
  })

  const errors = ref<BuildErrorItem[]>([])
  const keyword = ref('')
  const startTime = ref<number | null>(null)
  const endTime = ref<number | null>(null)
  const favoritesOnly = ref(false)
  const total = ref(0)
  const yearBuckets = ref<YearTimelineBucket[]>([])
  const scrollTargetIndex = ref<number | null>(null)
  const albumScrollTop = ref(0)

  const cache = ref(new Map<number, MediaItem>())
  const loadingPages = ref(new Set<number>())

  let offStatus: (() => void) | null = null
  let offFatal: (() => void) | null = null
  let offErrorItem: (() => void) | null = null

  const hasEssentialSettings = computed(() => {
    if (!settings.value) {
      return false
    }
    return (
      settings.value.indexDbPath.length > 0 &&
      settings.value.thumbnailDir.length > 0 &&
      settings.value.tmpDir.length > 0 &&
      settings.value.sourceDirs.length > 0
    )
  })

  const needFirstRunSetup = computed(() => {
    if (!settings.value) {
      return true
    }
    return (
      settings.value.indexDbPath.length === 0 ||
      settings.value.thumbnailDir.length === 0 ||
      settings.value.tmpDir.length === 0
    )
  })

  const progressPercent = computed(() => {
    if (buildStatus.value.total === 0) {
      return 0
    }
    return Math.floor((buildStatus.value.processed / buildStatus.value.total) * 100)
  })

  async function initialize(): Promise<void> {
    const profileState = await window.api.getProfileState()
    profiles.value = profileState.profiles
    activeProfileId.value = profileState.currentProfileId

    settings.value = await window.api.getSettings()
    buildStatus.value = await window.api.getBuildStatus()
    errors.value = await window.api.listErrors(500)
    storageStats.value = await window.api.getStorageStats()
    applyColorMode(settings.value.colorMode)

    offStatus = window.api.onBuildStatus((status) => {
      buildStatus.value = status
      if (status.state === 'completed') {
        void refreshMedia()
        void refreshYearBuckets()
        void refreshStorageStats()
      }
    })

    offFatal = window.api.onBuildFatal((message) => {
      console.error(message)
    })

    offErrorItem = window.api.onBuildErrorItem(async () => {
      errors.value = await window.api.listErrors(500)
    })

    await Promise.all([refreshMedia(), refreshYearBuckets()])
  }

  function getActiveProfile(): ProfileSummary | null {
    for (const profile of profiles.value) {
      if (profile.profileId === activeProfileId.value) {
        return profile
      }
    }

    return null
  }

  async function switchProfile(profileId: string): Promise<void> {
    const context = await window.api.switchProfile(profileId)
    profiles.value = context.state.profiles
    activeProfileId.value = context.state.currentProfileId
    settings.value = context.settings
    applyColorMode(context.settings.colorMode)

    buildStatus.value = await window.api.getBuildStatus()
    errors.value = await window.api.listErrors(500)
    await Promise.all([refreshMedia(), refreshYearBuckets(), refreshStorageStats()])
  }

  async function createProfile(name: string): Promise<void> {
    const state = await window.api.createProfile(name)
    profiles.value = state.profiles
    activeProfileId.value = state.currentProfileId

    const latest = state.profiles[state.profiles.length - 1]
    if (!latest) {
      throw new Error('创建 Profile 失败，请重试。')
    }

    await switchProfile(latest.profileId)
  }

  async function renameActiveProfile(name: string): Promise<void> {
    if (!activeProfileId.value) {
      throw new Error('当前没有可重命名的 Profile。')
    }

    const state = await window.api.renameProfile(activeProfileId.value, name)
    profiles.value = state.profiles
    activeProfileId.value = state.currentProfileId
  }

  async function refreshStorageStats(): Promise<void> {
    storageStats.value = await window.api.getStorageStats()
  }

  async function updateSettings(next: SettingsPatch): Promise<void> {
    settings.value = await window.api.updateSettings(next)
    applyColorMode(settings.value.colorMode)
    await refreshStorageStats()
  }

  async function chooseIndexDbPath(): Promise<void> {
    const path = await window.api.chooseIndexDbPath()
    if (path) {
      await updateSettings({ indexDbPath: path })
    }
  }

  async function chooseThumbnailDir(): Promise<void> {
    const path = await window.api.chooseThumbnailDir()
    if (path) {
      await updateSettings({ thumbnailDir: path })
    }
  }

  async function addSourceDir(): Promise<void> {
    const path = await window.api.chooseSourceDir()
    if (!path || !settings.value) {
      return
    }

    const next = [...settings.value.sourceDirs]
    if (!next.includes(path)) {
      next.push(path)
      await updateSettings({ sourceDirs: next })
    }
  }

  async function chooseTmpDir(): Promise<void> {
    const path = await window.api.chooseTmpDir()
    if (path) {
      await updateSettings({ tmpDir: path })
    }
  }

  async function removeSourceDir(path: string): Promise<void> {
    if (!settings.value) {
      return
    }

    const next: string[] = []
    for (const dir of settings.value.sourceDirs) {
      if (dir !== path) {
        next.push(dir)
      }
    }

    await updateSettings({ sourceDirs: next })
  }

  async function openPath(path: string): Promise<void> {
    await window.api.openPath(path)
  }

  async function startBuild(): Promise<void> {
    await window.api.startBuild()
  }

  async function pauseBuild(): Promise<void> {
    await window.api.pauseBuild()
  }

  async function resumeBuild(): Promise<void> {
    await window.api.resumeBuild()
  }

  async function cancelBuild(): Promise<void> {
    await window.api.cancelBuild()
  }

  async function clearIndexDb(): Promise<void> {
    await window.api.clearIndexDb()
    await refreshMedia()
    await refreshStorageStats()
  }

  async function clearThumbnails(): Promise<void> {
    await window.api.clearThumbnails()
    await refreshStorageStats()
  }

  async function clearErrors(): Promise<void> {
    await window.api.clearErrors()
    errors.value = []
  }

  async function refreshMedia(): Promise<void> {
    cache.value.clear()
    loadingPages.value.clear()
    total.value = 0
    await ensureRangeLoaded(0, PAGE_SIZE)
  }

  async function refreshYearBuckets(): Promise<void> {
    yearBuckets.value = await window.api.queryYearTimelineBuckets({
      keyword: keyword.value,
      startTime: startTime.value,
      endTime: endTime.value,
      favoritesOnly: favoritesOnly.value
    })
  }

  async function _jumpToTime(targetTime: number): Promise<void> {
    const index = await window.api.queryScrollOffsetBeforeTime({
      keyword: keyword.value,
      startTime: startTime.value,
      endTime: endTime.value,
      favoritesOnly: favoritesOnly.value,
      targetTime
    })
    if (total.value <= 0) {
      scrollTargetIndex.value = null
      return
    }
    scrollTargetIndex.value = Math.max(0, Math.min(index, total.value - 1))
  }

  async function ensureRangeLoaded(startIndex: number, endIndex: number): Promise<void> {
    const firstPage = Math.max(0, Math.floor(startIndex / PAGE_SIZE))
    const lastPage = Math.max(0, Math.floor(endIndex / PAGE_SIZE))

    const pending: Promise<void>[] = []

    for (let page = firstPage; page <= lastPage; page += 1) {
      if (!loadingPages.value.has(page)) {
        pending.push(loadPage(page))
      }
    }

    await Promise.all(pending)
  }

  async function loadPage(page: number): Promise<void> {
    loadingPages.value.add(page)

    try {
      const result = await window.api.queryMedia({
        keyword: keyword.value,
        startTime: startTime.value,
        endTime: endTime.value,
        favoritesOnly: favoritesOnly.value,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE
      })

      total.value = result.total
      for (let index = 0; index < result.items.length; index += 1) {
        cache.value.set(page * PAGE_SIZE + index, result.items[index])
      }
    } finally {
      loadingPages.value.delete(page)
    }
  }

  function getMediaByIndex(index: number): MediaItem | null {
    return cache.value.get(index) ?? null
  }

  async function setFavorite(mediaId: number, isFavorite: boolean): Promise<void> {
    await window.api.setFavorite(mediaId, isFavorite)
    await Promise.all([refreshMedia(), refreshYearBuckets()])
  }

  async function openMedia(path: string): Promise<void> {
    await window.api.openMedia(path)
  }

  async function showMediaItemContextMenu(path: string): Promise<void> {
    await window.api.showMediaItemContextMenu(path)
  }

  function setKeyword(value: string): void {
    keyword.value = value
  }

  function setDateRange(start: number | null, end: number | null): void {
    startTime.value = start
    endTime.value = end
  }

  function setFavoritesOnly(value: boolean): void {
    favoritesOnly.value = value
  }

  async function applyFilters(): Promise<void> {
    await Promise.all([refreshMedia(), refreshYearBuckets()])
  }

  async function jumpToYear(year: number): Promise<void> {
    const end = new Date(year, 11, 31, 23, 59, 59, 999).getTime()
    await _jumpToTime(end)
  }

  async function jumpToMonth(year: number, month: number): Promise<void> {
    const end = new Date(year, month, 0, 23, 59, 59, 999).getTime()
    await _jumpToTime(end)
  }

  function consumeScrollTargetIndex(): number | null {
    const index = scrollTargetIndex.value
    scrollTargetIndex.value = null
    return index
  }

  function setAlbumScrollTop(value: number): void {
    albumScrollTop.value = value
  }

  async function setColorMode(mode: 'system' | 'light' | 'dark'): Promise<void> {
    await updateSettings({ colorMode: mode })
  }

  function applyColorMode(mode: 'system' | 'light' | 'dark'): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = mode === 'dark' || (mode === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', shouldUseDark)
  }

  function toThumbnailUrl(path: string): string {
    return `pocopic-media://thumbnail?key=${encodeURIComponent(path)}`
  }

  onUnmounted(() => {
    if (offStatus) {
      offStatus()
      offStatus = null
    }

    if (offFatal) {
      offFatal()
      offFatal = null
    }

    if (offErrorItem) {
      offErrorItem()
      offErrorItem = null
    }
  })

  return {
    profiles,
    activeProfileId,
    settings,
    storageStats,
    buildStatus,
    errors,
    keyword,
    startTime,
    endTime,
    favoritesOnly,
    total,
    yearBuckets,
    scrollTargetIndex,
    albumScrollTop,
    hasEssentialSettings,
    needFirstRunSetup,
    progressPercent,
    initialize,
    getActiveProfile,
    switchProfile,
    createProfile,
    renameActiveProfile,
    refreshStorageStats,
    updateSettings,
    chooseIndexDbPath,
    chooseThumbnailDir,
    chooseTmpDir,
    addSourceDir,
    removeSourceDir,
    openPath,
    startBuild,
    pauseBuild,
    resumeBuild,
    cancelBuild,
    clearIndexDb,
    clearThumbnails,
    clearErrors,
    ensureRangeLoaded,
    getMediaByIndex,
    setFavorite,
    openMedia,
    showMediaItemContextMenu,
    setKeyword,
    setDateRange,
    setFavoritesOnly,
    applyFilters,
    setColorMode,
    toThumbnailUrl,
    refreshMedia,
    refreshYearBuckets,
    jumpToYear,
    jumpToMonth,
    consumeScrollTargetIndex,
    setAlbumScrollTop
  }
})
