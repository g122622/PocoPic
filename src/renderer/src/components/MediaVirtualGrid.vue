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
</script>

<template>
  <div
    ref="containerRef"
    class="h-full overflow-auto rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:bg-black/20"
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
            <div class="rounded-2xl bg-white/80 p-2 shadow-sm dark:bg-slate-900/70" :style="{ minHeight: `${cellSize + 48}px` }">
              <template v-if="getItem(getIndex(rowIndex, col - 1))">
                <button
                  class="group block w-full text-left"
                  @dblclick="emit('openMedia', getItem(getIndex(rowIndex, col - 1))!.filePath)"
                >
                  <img
                    class="h-[180px] w-full rounded-xl object-cover"
                    :src="getThumbnailUrl(getItem(getIndex(rowIndex, col - 1))!.thumbnailPath)"
                    :alt="getItem(getIndex(rowIndex, col - 1))!.fileName"
                  />
                  <div class="mt-2 flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {{ getItem(getIndex(rowIndex, col - 1))!.fileName }}
                      </p>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400">
                        {{ formatTime(getItem(getIndex(rowIndex, col - 1))!.capturedAt) }}
                      </p>
                    </div>
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="soft"
                      :label="getItem(getIndex(rowIndex, col - 1))!.isFavorite ? '★' : '☆'"
                      @click.stop="emit('toggleFavorite', getItem(getIndex(rowIndex, col - 1))!.id, getItem(getIndex(rowIndex, col - 1))!.isFavorite === 0)"
                    />
                  </div>
                </button>
              </template>
              <template v-else>
                <USkeleton class="h-[180px] w-full rounded-xl" />
                <USkeleton class="mt-2 h-4 w-5/6" />
                <USkeleton class="mt-1 h-3 w-3/5" />
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
