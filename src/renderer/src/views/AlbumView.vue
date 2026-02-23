<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SearchToolbar from '@renderer/components/SearchToolbar.vue'
import MediaVirtualGrid from '@renderer/components/MediaVirtualGrid.vue'
import YearTimelinePanel from '@renderer/components/YearTimelinePanel.vue'
import { useGalleryStore } from '@renderer/stores/useGalleryStore'

interface MediaVirtualGridExposed {
  scrollToIndex: (index: number) => void
}

const store = useGalleryStore()
const uiError = ref('')
const startDateMs = ref<number | null>(null)
const endDateMs = ref<number | null>(null)
const mediaGridRef = ref<MediaVirtualGridExposed | null>(null)
const gridSize = ref<'sm' | 'md' | 'lg'>('sm')
const showCapturedAt = computed(() => {
  return store.settings?.showMediaCapturedAt ?? true
})
const showSize = computed(() => {
  return store.settings?.showMediaSize ?? true
})

function onGridSizeChange(value: 'sm' | 'md' | 'lg'): void {
  gridSize.value = value
}

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

async function onSelectYear(year: number): Promise<void> {
  await handleAction(() => store.jumpToYear(year))
}

async function onSelectMonth(payload: { year: number; month: number }): Promise<void> {
  await handleAction(() => store.jumpToMonth(payload.year, payload.month))
}

watch(
  () => store.scrollTargetIndex,
  (index) => {
    if (index === null) {
      return
    }

    mediaGridRef.value?.scrollToIndex(index)
    store.consumeScrollTargetIndex()
  }
)
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <SearchToolbar
      :keyword="store.keyword"
      :favorites-only="store.favoritesOnly"
      :grid-size="gridSize"
      :start-date-ms="startDateMs"
      :end-date-ms="endDateMs"
      @update-keyword="store.setKeyword"
      @update-date-range="onDateRangePatch"
      @update-favorites-only="store.setFavoritesOnly"
      @update-grid-size="onGridSizeChange"
      @apply="() => handleAction(store.applyFilters)"
    />

    <div
      v-if="uiError"
      class="rounded-2xl bg-rose-50 p-4 shadow-sm border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30 flex items-center gap-3"
    >
      <UIcon name="i-lucide-alert-circle" class="h-5 w-5 text-rose-500" />
      <p class="text-sm font-medium text-rose-600 dark:text-rose-300">
        {{ uiError }}
      </p>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-[1fr_280px] gap-4">
      <main class="min-h-0 relative">
        <MediaVirtualGrid
          ref="mediaGridRef"
          :total="store.total"
          :get-item="store.getMediaByIndex"
          :get-thumbnail-url="store.toThumbnailUrl"
          :show-item-context-menu="
            (filePath) => handleAction(() => store.showMediaItemContextMenu(filePath))
          "
          :show-meta-captured-at="showCapturedAt"
          :show-meta-size="showSize"
          :size-level="gridSize"
          :initial-scroll-top="store.albumScrollTop"
          @need-range="(start, end) => handleAction(() => store.ensureRangeLoaded(start, end))"
          @update-scroll-top="store.setAlbumScrollTop"
          @open-media="(filePath) => handleAction(() => store.openMedia(filePath))"
          @toggle-favorite="
            (id, isFavorite) => handleAction(() => store.setFavorite(id, isFavorite))
          "
        />
      </main>

      <aside class="min-h-0 pb-2">
        <YearTimelinePanel
          :buckets="store.yearBuckets"
          @select-year="onSelectYear"
          @select-month="onSelectMonth"
        />
      </aside>
    </div>
  </div>
</template>
