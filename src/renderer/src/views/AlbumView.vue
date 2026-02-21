<script setup lang="ts">
import { ref } from 'vue'
import SearchToolbar from '@renderer/components/SearchToolbar.vue'
import MediaVirtualGrid from '@renderer/components/MediaVirtualGrid.vue'
import BuildStatusPanel from '@renderer/components/BuildStatusPanel.vue'
import BuildErrorsPanel from '@renderer/components/BuildErrorsPanel.vue'
import YearTimelinePanel from '@renderer/components/YearTimelinePanel.vue'
import { useGalleryStore } from '@renderer/stores/useGalleryStore'

const store = useGalleryStore()
const uiError = ref('')
const startDateMs = ref<number | null>(null)
const endDateMs = ref<number | null>(null)

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
  <div class="flex h-full flex-col gap-3">
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

    <div class="grid min-h-0 flex-1 grid-cols-[320px_1fr_260px] gap-3">
      <aside class="min-h-0 space-y-3 overflow-auto pr-1">
        <BuildStatusPanel
          :status="store.buildStatus"
          :progress-percent="store.progressPercent"
          @start="() => handleAction(store.startBuild)"
          @pause="() => handleAction(store.pauseBuild)"
          @resume="() => handleAction(store.resumeBuild)"
          @cancel="() => handleAction(store.cancelBuild)"
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

      <aside class="min-h-0">
        <YearTimelinePanel :buckets="store.yearBuckets" @select-year="(year) => handleAction(() => store.jumpToYear(year))" />
      </aside>
    </div>
  </div>
</template>
