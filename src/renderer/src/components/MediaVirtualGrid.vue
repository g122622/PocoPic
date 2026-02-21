<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { MediaItem } from '@shared/types'
import { formatTime } from '@renderer/utils/format'

const props = defineProps<{
  total: number
  getItem: (index: number) => MediaItem | null
  getThumbnailUrl: (path: string) => string
}>()

const emit = defineEmits<{
  needRange: [start: number, end: number]
  openMedia: [filePath: string]
  toggleFavorite: [id: number, isFavorite: boolean]
}>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(1200)
const containerHeight = ref(800)
const scrollTop = ref(0)
const cellSize = 180
const cellGap = 14
const rowHeight = cellSize + 72
let resizeObserver: ResizeObserver | null = null

const columnCount = computed(() => {
  const full = cellSize + cellGap
  return Math.max(1, Math.floor(containerWidth.value / full))
})

const rowCount = computed(() => {
  return Math.ceil(props.total / columnCount.value)
})

const overscan = 4

const visibleStartRow = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / rowHeight) - overscan)
})

const visibleEndRow = computed(() => {
  const visibleCount = Math.ceil(containerHeight.value / rowHeight) + overscan * 2
  return Math.min(rowCount.value, visibleStartRow.value + visibleCount)
})

const virtualRows = computed(() => {
  const rows: number[] = []
  for (let row = visibleStartRow.value; row < visibleEndRow.value; row += 1) {
    rows.push(row)
  }
  return rows
})

const spacerHeight = computed(() => rowCount.value * rowHeight)

watch(
  virtualRows,
  (rows) => {
    if (rows.length === 0) {
      return
    }

    const first = rows[0] * columnCount.value
    const last = (rows[rows.length - 1] + 1) * columnCount.value
    emit('needRange', first, last)
  },
  { immediate: true }
)

function onScroll(): void {
  if (!containerRef.value) {
    return
  }
  scrollTop.value = containerRef.value.scrollTop
}

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  containerWidth.value = containerRef.value.clientWidth
  containerHeight.value = containerRef.value.clientHeight
  resizeObserver = new ResizeObserver((entries) => {
    if (entries.length > 0) {
      containerWidth.value = entries[0].contentRect.width
      containerHeight.value = entries[0].contentRect.height
    }
  })
  resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

function getIndex(rowIndex: number, colIndex: number): number {
  return rowIndex * columnCount.value + colIndex
}

function scrollToIndex(index: number): void {
  if (!containerRef.value || props.total <= 0) {
    return
  }

  const safeIndex = Math.max(0, Math.min(index, props.total - 1))
  const targetRow = Math.floor(safeIndex / columnCount.value)
  const targetTop = targetRow * rowHeight
  const preloadStart = Math.max(0, safeIndex - columnCount.value * overscan * 2)
  const preloadEnd = Math.min(props.total, safeIndex + columnCount.value * (overscan * 2 + 1))

  emit('needRange', preloadStart, preloadEnd)
  containerRef.value.scrollTo({
    top: targetTop,
    behavior: 'smooth'
  })
}

defineExpose({
  scrollToIndex
})
</script>

<template>
  <div
    ref="containerRef"
    class="cute-panel h-full overflow-y-auto overflow-x-hidden p-6 custom-scrollbar"
    @scroll="onScroll"
  >
    <div
      :style="{
        height: `${spacerHeight}px`,
        position: 'relative'
      }"
      class="w-full"
    >
      <div
        v-for="rowIndex in virtualRows"
        :key="rowIndex"
        :style="{
          transform: `translateY(${rowIndex * rowHeight}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%'
        }"
      >
        <div class="grid" :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`, gap: `${cellGap}px` }">
          <template v-for="col in columnCount" :key="col">
            <div class="cute-card group relative overflow-hidden p-3" :style="{ minHeight: `${cellSize + 64}px` }">
              <template v-if="getItem(getIndex(rowIndex, col - 1))">
                <button
                  class="block w-full text-left outline-none focus:ring-2 focus:ring-primary-400/50 rounded-2xl transition-all duration-300"
                  @dblclick="emit('openMedia', getItem(getIndex(rowIndex, col - 1))!.filePath)"
                >
                  <div class="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <img
                      class="h-[180px] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105"
                      :src="getThumbnailUrl(getItem(getIndex(rowIndex, col - 1))!.thumbnailPath)"
                      :alt="getItem(getIndex(rowIndex, col - 1))!.fileName"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                    <UButton
                      class="absolute right-2 top-2 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:scale-110"
                      size="sm"
                      :color="getItem(getIndex(rowIndex, col - 1))!.isFavorite ? 'amber' : 'white'"
                      :variant="getItem(getIndex(rowIndex, col - 1))!.isFavorite ? 'solid' : 'soft'"
                      :icon="getItem(getIndex(rowIndex, col - 1))!.isFavorite ? 'i-lucide-star' : 'i-lucide-star'"
                      :ui="{ rounded: 'rounded-xl' }"
                      @click.stop="emit('toggleFavorite', getItem(getIndex(rowIndex, col - 1))!.id, getItem(getIndex(rowIndex, col - 1))!.isFavorite === 0)"
                    />
                  </div>

                  <div class="mt-3 px-1">
                    <p class="truncate text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors group-hover:text-primary-500 dark:group-hover:text-primary-400" :title="getItem(getIndex(rowIndex, col - 1))!.fileName">
                      {{ getItem(getIndex(rowIndex, col - 1))!.fileName }}
                    </p>
                    <div class="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                      <UIcon name="i-lucide-clock" class="h-3 w-3" />
                      <span>{{ formatTime(getItem(getIndex(rowIndex, col - 1))!.capturedAt) }}</span>
                    </div>
                  </div>
                </button>
              </template>
              <template v-else>
                <USkeleton class="h-[180px] w-full rounded-2xl bg-slate-200/50 dark:bg-slate-700/50" />
                <div class="mt-3 px-1 space-y-2">
                  <USkeleton class="h-4 w-3/4 rounded-lg bg-slate-200/50 dark:bg-slate-700/50" />
                  <USkeleton class="h-3 w-1/2 rounded-lg bg-slate-200/50 dark:bg-slate-700/50" />
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
