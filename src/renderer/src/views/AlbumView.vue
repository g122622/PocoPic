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
  <div class="flex h-full flex-col gap-4">
    <SearchToolbar
      :keyword="store.keyword"
      :favorites-only="store.favoritesOnly"
      @update-keyword="store.setKeyword"
      @update-date-range="onDateRangePatch"
      @update-favorites-only="store.setFavoritesOnly"
      @apply="() => handleAction(store.applyFilters)"
    />

    <div v-if="uiError" class="rounded-2xl bg-rose-50 p-4 shadow-sm border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30 flex items-center gap-3">
      <UIcon name="i-lucide-alert-circle" class="h-5 w-5 text-rose-500" />
      <p class="text-sm font-medium text-rose-600 dark:text-rose-300">
        {{ uiError }}
      </p>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-[340px_1fr_280px] gap-4">
      <aside class="min-h-0 space-y-4 overflow-y-auto overflow-x-hidden pr-2 pb-2">
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

      <main class="min-h-0 relative">
        <MediaVirtualGrid
          :total="store.total"
          :get-item="store.getMediaByIndex"
          :get-thumbnail-url="store.toThumbnailUrl"
          @need-range="(start, end) => handleAction(() => store.ensureRangeLoaded(start, end))"
          @open-media="(filePath) => handleAction(() => store.openMedia(filePath))"
          @toggle-favorite="(id, isFavorite) => handleAction(() => store.setFavorite(id, isFavorite))"
        />
      </main>

      <aside class="min-h-0 pb-2">
        <YearTimelinePanel :buckets="store.yearBuckets" @select-year="(year) => handleAction(() => store.jumpToYear(year))" />
      </aside>
    </div>
  </div>
</template>
