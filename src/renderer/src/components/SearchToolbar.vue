<script setup lang="ts">
import { computed } from 'vue'
import type { TabsItem } from '@nuxt/ui'

const props = defineProps<{
  keyword: string
  favoritesOnly: boolean
  gridSize: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  updateKeyword: [value: string]
  updateDateRange: [start: number | null, end: number | null]
  updateFavoritesOnly: [value: boolean]
  updateGridSize: [value: 'sm' | 'md' | 'lg']
  apply: []
}>()

const gridSizeItems: TabsItem[] = [
  {
    label: '紧凑',
    icon: 'i-lucide-grid-3x3',
    value: 'sm'
  },
  {
    label: '标准',
    icon: 'i-lucide-layout-grid',
    value: 'md'
  },
  {
    label: '大图',
    icon: 'i-lucide-grid-2x2',
    value: 'lg'
  }
]

const gridSizeValue = computed({
  get: () => props.gridSize,
  set: (value: string | number) => {
    if (value === 'sm' || value === 'md' || value === 'lg') {
      emit('updateGridSize', value)
    }
  }
})

function onStartDateChange(value: string): void {
  if (!value) {
    emit('updateDateRange', null, null)
    return
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime()
  emit('updateDateRange', timestamp, null)
}

function onEndDateChange(value: string): void {
  if (!value) {
    emit('updateDateRange', null, null)
    return
  }

  const timestamp = new Date(`${value}T23:59:59`).getTime()
  emit('updateDateRange', null, timestamp)
}
</script>

<template>
  <div class="cute-panel flex flex-wrap items-center gap-4 p-4">
    <div class="flex min-w-60 flex-1 items-center gap-2">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-primary-900/30 dark:text-primary-300">
        <UIcon name="i-lucide-search" class="h-5 w-5" />
      </div>
      <UTooltip :delay-duration="0" text="输入关键字筛选文件名">
        <UInput
          :model-value="props.keyword"
          placeholder="按文件名搜索..."
          class="cute-input flex-1"
          size="lg"
          color="primary"
          variant="outline"
          :ui="{ rounded: 'rounded-2xl' }"
          @update:model-value="(value) => emit('updateKeyword', value)"
        />
      </UTooltip>
    </div>

    <div class="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50">
      <UIcon name="i-lucide-calendar" class="h-5 w-5 text-slate-400 ml-2" />
      <UTooltip :delay-duration="0" text="选择开始日期">
        <UInput type="date" class="cute-input w-36" size="md" color="white" variant="outline" :ui="{ rounded: 'rounded-xl' }" @update:model-value="onStartDateChange" />
      </UTooltip>
      <span class="text-slate-300 font-bold">-</span>
      <UTooltip :delay-duration="0" text="选择结束日期">
        <UInput type="date" class="cute-input w-36" size="md" color="white" variant="outline" :ui="{ rounded: 'rounded-xl' }" @update:model-value="onEndDateChange" />
      </UTooltip>
    </div>

    <div class="flex items-center gap-3 bg-amber-50/50 dark:bg-amber-900/10 p-2 pr-4 rounded-2xl border border-amber-100/50 dark:border-amber-800/30">
      <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-900/50 dark:text-amber-300">
        <UIcon name="i-lucide-star" class="h-4 w-4" />
      </div>
      <UTooltip :delay-duration="0" text="切换仅查看收藏媒体">
        <USwitch
          :model-value="props.favoritesOnly"
          color="amber"
          size="md"
          @update:model-value="(value) => emit('updateFavoritesOnly', value)"
        />
      </UTooltip>
      <span class="text-sm font-bold text-amber-700 dark:text-amber-400">仅收藏</span>
    </div>

    <div class="min-w-70 rounded-2xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-700/50 dark:bg-slate-800/30">
      <UTooltip :delay-duration="0" text="切换网格显示密度">
        <UTabs
          v-model="gridSizeValue"
          :items="gridSizeItems"
          :content="false"
          color="neutral"
          size="sm"
          class="w-full"
        />
      </UTooltip>
    </div>

    <UTooltip :delay-duration="0" text="应用筛选条件并刷新结果">
      <UButton class="cute-button ml-auto" size="lg" color="primary" icon="i-lucide-sparkles" label="开始搜索" @click="emit('apply')" />
    </UTooltip>
  </div>
</template>
