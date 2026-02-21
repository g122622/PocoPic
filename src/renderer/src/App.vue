<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SearchToolbar from './components/SearchToolbar.vue'
import MediaVirtualGrid from './components/MediaVirtualGrid.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import BuildStatusPanel from './components/BuildStatusPanel.vue'
import BuildErrorsPanel from './components/BuildErrorsPanel.vue'
import { useGalleryStore } from './stores/useGalleryStore'

const store = useGalleryStore()
const uiError = ref('')
const startDateMs = ref<number | null>(null)
const endDateMs = ref<number | null>(null)

onMounted(async () => {
  try {
    await store.initialize()
  } catch (error) {
    uiError.value = error instanceof Error ? error.message : '初始化失败'
  }
})

async function handleAction(action: () => Promise<void>): Promise<void> {
  try {
    uiError.value = ''
    await action()
  } catch (error) {
    uiError.value = error instanceof Error ? error.message : '操作失败'
  }
}

function onDateRangePatch(start: number | null, end: number | null): void {
  if (start !== null) {
    startDateMs.value = start
  }

  if (end !== null) {
    endDateMs.value = end
  }

  store.setDateRange(startDateMs.value, endDateMs.value)
}
</script>

<template>
  <UApp>
    <div class="h-screen w-screen p-4">
      <div class="mx-auto flex h-full max-w-[1700px] flex-col gap-3">
        <header class="rounded-3xl bg-white/70 px-5 py-3 shadow-sm backdrop-blur-md dark:bg-black/20">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-xl font-bold text-slate-700 dark:text-slate-100">PocoPic</h1>
              <p class="text-xs text-slate-500 dark:text-slate-300">可爱极简风 · 超大图库 · 手动构建索引</p>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-300">总媒体：{{ store.total }}</div>
          </div>
        </header>

        <SearchToolbar
          :keyword="store.keyword"
          :favorites-only="store.favoritesOnly"
          @update-keyword="store.setKeyword"
          @update-date-range="onDateRangePatch"
          @update-favorites-only="store.setFavoritesOnly"
          @apply="() => handleAction(store.applyFilters)"
        />

        <p v-if="uiError" class="rounded-xl bg-rose-100 px-3 py-2 text-xs text-rose-600 dark:bg-rose-900/40 dark:text-rose-200">
          {{ uiError }}
        </p>

        <div class="grid min-h-0 flex-1 grid-cols-[330px_1fr] gap-3">
          <aside class="min-h-0 space-y-3 overflow-auto pr-1">
            <BuildStatusPanel
              :status="store.buildStatus"
              :progress-percent="store.progressPercent"
              @start="() => handleAction(store.startBuild)"
              @pause="() => handleAction(store.pauseBuild)"
              @resume="() => handleAction(store.resumeBuild)"
              @cancel="() => handleAction(store.cancelBuild)"
            />

            <SettingsPanel
              v-if="store.settings"
              :settings="store.settings"
              :storage-stats="store.storageStats"
              @choose-index-db-path="() => handleAction(store.chooseIndexDbPath)"
              @choose-thumbnail-dir="() => handleAction(store.chooseThumbnailDir)"
              @add-source-dir="() => handleAction(store.addSourceDir)"
              @remove-source-dir="(path) => handleAction(() => store.removeSourceDir(path))"
              @open-path="(path) => handleAction(() => store.openPath(path))"
              @update-settings="(next) => handleAction(() => store.updateSettings(next))"
              @clear-index-db="() => handleAction(store.clearIndexDb)"
              @clear-thumbnails="() => handleAction(store.clearThumbnails)"
            />

            <BuildErrorsPanel :errors="store.errors" @clear="() => handleAction(store.clearErrors)" />
          </aside>

          <main class="min-h-0">
            <MediaVirtualGrid
              :total="store.total"
              :get-item="store.getMediaByIndex"
              :get-thumbnail-url="store.toThumbnailUrl"
              @need-range="(start, end) => handleAction(() => store.ensureRangeLoaded(start, end))"
              @open-media="(filePath) => handleAction(() => store.openMedia(filePath))"
              @toggle-favorite="(id, isFavorite) => handleAction(() => store.setFavorite(id, isFavorite))"
            />
          </main>
        </div>
      </div>

      <div
        v-if="store.needFirstRunSetup"
        class="absolute inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm"
      >
        <div class="w-[560px] rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <h2 class="text-lg font-semibold text-slate-700 dark:text-slate-100">首次启动需要完成初始化</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-300">
            请先设置元数据索引路径与缩略图目录，然后添加至少一个扫描目录，再执行“开始构建”。
          </p>
          <div class="mt-4 flex gap-2">
            <UButton label="选择索引路径" @click="() => handleAction(store.chooseIndexDbPath)" />
            <UButton label="选择缩略图目录" color="neutral" variant="soft" @click="() => handleAction(store.chooseThumbnailDir)" />
            <UButton label="添加扫描目录" color="neutral" variant="outline" @click="() => handleAction(store.addSourceDir)" />
          </div>
        </div>
      </div>
    </div>
  </UApp>
</template>
