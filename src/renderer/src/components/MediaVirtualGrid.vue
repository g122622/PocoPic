<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'
import type { MediaItem } from '@shared/types'
import { formatTime, prettyBytes } from '@renderer/utils/format'

const props = defineProps<{
  total: number
  getItem: (index: number) => MediaItem | null
  getThumbnailUrl: (path: string) => string
  sizeLevel: 'sm' | 'md' | 'lg'
  initialScrollTop: number
}>()

const emit = defineEmits<{
  needRange: [start: number, end: number]
  openMedia: [filePath: string]
  toggleFavorite: [id: number, isFavorite: boolean]
  updateScrollTop: [value: number]
}>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(1200)
const containerHeight = ref(800)
const scrollTop = ref(0)
let resizeObserver: ResizeObserver | null = null

const sizePreset = computed(() => {
  if (props.sizeLevel === 'sm') {
    return {
      cellSize: 136,
      cellGap: 5,
      cardPadding: 5,
      metaHeight: 44
    }
  }

  if (props.sizeLevel === 'lg') {
    return {
      cellSize: 200,
      cellGap: 10,
      cardPadding: 10,
      metaHeight: 46
    }
  }

  return {
    cellSize: 168,
    cellGap: 7,
    cardPadding: 7,
    metaHeight: 44
  }
})

const rowHeight = computed(() => {
  return sizePreset.value.cellSize + sizePreset.value.metaHeight + sizePreset.value.cardPadding * 2
})

const columnCount = computed(() => {
  const full = sizePreset.value.cellSize + sizePreset.value.cellGap
  return Math.max(1, Math.floor(containerWidth.value / full))
})

const rowCount = computed(() => {
  return Math.ceil(props.total / columnCount.value)
})

const overscan = 4

const visibleStartRow = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / rowHeight.value) - overscan)
})

const visibleEndRow = computed(() => {
  const visibleCount = Math.ceil(containerHeight.value / rowHeight.value) + overscan * 2
  return Math.min(rowCount.value, visibleStartRow.value + visibleCount)
})

const virtualRows = computed(() => {
  const rows: number[] = []
  for (let row = visibleStartRow.value; row < visibleEndRow.value; row += 1) {
    rows.push(row)
  }
  return rows
})

const spacerHeight = computed(() => rowCount.value * rowHeight.value)

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
  emit('updateScrollTop', scrollTop.value)
}

function _syncViewportMetrics(): void {
  if (!containerRef.value) {
    return
  }

  containerWidth.value = containerRef.value.clientWidth
  containerHeight.value = containerRef.value.clientHeight
  scrollTop.value = containerRef.value.scrollTop
}

function _restoreScrollTop(): void {
  if (!containerRef.value) {
    return
  }

  containerRef.value.scrollTo({
    top: props.initialScrollTop,
    behavior: 'auto'
  })

  scrollTop.value = props.initialScrollTop
}

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  _syncViewportMetrics()
  _restoreScrollTop()

  resizeObserver = new ResizeObserver((entries) => {
    if (entries.length > 0) {
      containerWidth.value = entries[0].contentRect.width
      containerHeight.value = entries[0].contentRect.height
      scrollTop.value = containerRef.value?.scrollTop ?? 0
    }
  })

  resizeObserver.observe(containerRef.value)
})

onActivated(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      _syncViewportMetrics()
      _restoreScrollTop()
    })
  })
})

onDeactivated(() => {
  emit('updateScrollTop', scrollTop.value)
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
  const targetTop = targetRow * rowHeight.value
  const preloadStart = Math.max(0, safeIndex - columnCount.value * overscan * 2)
  const preloadEnd = Math.min(props.total, safeIndex + columnCount.value * (overscan * 2 + 1))

  emit('needRange', preloadStart, preloadEnd)
  containerRef.value.scrollTo({
    top: targetTop,
    behavior: 'auto'
  })

  scrollTop.value = targetTop
  emit('updateScrollTop', targetTop)
}

defineExpose({
  scrollToIndex
})
</script>

<template>
  <div ref="containerRef" class="cute-panel h-full overflow-y-auto overflow-x-hidden p-6 custom-scrollbar"
    @scroll="onScroll">
    <div :style="{
      height: `${spacerHeight}px`,
      position: 'relative'
    }" class="w-full">
      <div v-for="rowIndex in virtualRows" :key="rowIndex" :style="{
        transform: `translateY(${rowIndex * rowHeight}px)`,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      }">
        <div class="grid" :style="{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          gap: `${sizePreset.cellGap}px`
        }">
          <template v-for="col in columnCount" :key="col">
            <UTooltip
              :delay-duration="0"
              :text="getItem(getIndex(rowIndex, col - 1))?.filePath || '文件路径不可用'"
            >
              <div class="cute-card group relative overflow-hidden" :style="{
                minHeight: `${rowHeight - sizePreset.cellGap}px`,
                padding: `${sizePreset.cardPadding}px`
              }">
              <template v-if="getItem(getIndex(rowIndex, col - 1))">
                <button
                  class="block w-full rounded-2xl text-left outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-400/50"
                  @dblclick="emit('openMedia', getItem(getIndex(rowIndex, col - 1))!.filePath)">
                  <div class="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img
                      class="w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105"
                      :style="{ height: `${sizePreset.cellSize}px` }"
                      :src="getThumbnailUrl(getItem(getIndex(rowIndex, col - 1))!.thumbnailPath)"
                      :alt="getItem(getIndex(rowIndex, col - 1))!.fileName" loading="lazy" />
                    <div
                      class="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    </div>
                    <UTooltip :delay-duration="0" text="切换收藏状态">
                      <UButton
                        class="absolute right-2 top-2 opacity-0 transition-all duration-300 hover:scale-110 group-hover:opacity-100"
                        size="sm" :color="getItem(getIndex(rowIndex, col - 1))!.isFavorite ? 'amber' : 'white'"
                        :variant="getItem(getIndex(rowIndex, col - 1))!.isFavorite ? 'solid' : 'soft'"
                        icon="i-lucide-star" :ui="{ rounded: 'rounded-xl' }" @click.stop="
                          emit(
                            'toggleFavorite',
                            getItem(getIndex(rowIndex, col - 1))!.id,
                            getItem(getIndex(rowIndex, col - 1))!.isFavorite === 0
                          )
                          " />
                    </UTooltip>
                  </div>

                  <div class="mt-2 px-1">
                    <div class="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                      <UIcon name="i-lucide-clock" class="h-3 w-3" />
                      <span style="font-size: 10px">
                        {{ formatTime(getItem(getIndex(rowIndex, col - 1))!.capturedAt) }}
                      </span>
                    </div>
                    <div class="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                      <UIcon name="i-lucide-file" class="h-3 w-3" />
                      <span style="font-size: 10px">
                        {{ prettyBytes(getItem(getIndex(rowIndex, col - 1))!.sizeBytes, 2) }}
                      </span>
                    </div>
                  </div>
                </button>
              </template>
              <template v-else>
                <USkeleton class="w-full rounded-2xl bg-slate-200/50 dark:bg-slate-700/50"
                  :style="{ height: `${sizePreset.cellSize}px` }" />
                <div class="mt-2 space-y-2 px-1">
                  <USkeleton class="h-3 w-full rounded-lg bg-slate-200/50 dark:bg-slate-700/50" />
                </div>
              </template>
              </div>
            </UTooltip>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
