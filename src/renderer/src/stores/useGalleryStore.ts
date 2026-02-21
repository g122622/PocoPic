import { computed, onUnmounted, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AppSettings, BuildErrorItem, BuildStatus, MediaItem, StorageStats, YearBucket } from '@shared/types'

type SettingsPatch = Partial<AppSettings>

const PAGE_SIZE = 200

export const useGalleryStore = defineStore('gallery', () => {
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
  const yearBuckets = ref<YearBucket[]>([])

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
      settings.value.sourceDirs.length > 0
    )
  })

  const needFirstRunSetup = computed(() => {
    if (!settings.value) {
      return true
    }
    return settings.value.indexDbPath.length === 0 || settings.value.thumbnailDir.length === 0
  })

  const progressPercent = computed(() => {
    if (buildStatus.value.total === 0) {
      return 0
    }
    return Math.floor((buildStatus.value.processed / buildStatus.value.total) * 100)
  })

  async function initialize(): Promise<void> {
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
    yearBuckets.value = await window.api.queryYearBuckets({
      keyword: keyword.value,
      startTime: startTime.value,
      endTime: endTime.value,
      favoritesOnly: favoritesOnly.value
    })
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
    const start = new Date(year, 0, 1, 0, 0, 0, 0).getTime()
    const end = new Date(year, 11, 31, 23, 59, 59, 999).getTime()
    setDateRange(start, end)
    await applyFilters()
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
    hasEssentialSettings,
    needFirstRunSetup,
    progressPercent,
    initialize,
    refreshStorageStats,
    updateSettings,
    chooseIndexDbPath,
    chooseThumbnailDir,
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
    setKeyword,
    setDateRange,
    setFavoritesOnly,
    applyFilters,
    setColorMode,
    toThumbnailUrl,
    refreshMedia,
    refreshYearBuckets,
    jumpToYear
  }
})
