<script setup lang="ts">
import { computed } from 'vue'
import type { TimelineItem } from '@nuxt/ui'
import type { YearBucket } from '@shared/types'

const props = defineProps<{
  buckets: YearBucket[]
}>()

const emit = defineEmits<{
  selectYear: [year: number]
}>()

const timelineItems = computed<TimelineItem[]>(() => {
  return props.buckets.map((bucket) => ({
    date: `${bucket.count} 项`,
    title: `${bucket.year} 年`,
    description: '点击按年份筛选',
    icon: 'i-lucide-calendar-days',
    value: bucket.year
  }))
})

function onSelect(_event: Event, item: TimelineItem): void {
  const year = Number(item.value)
  if (Number.isFinite(year)) {
    emit('selectYear', year)
  }
}
</script>

<template>
  <div class="cute-panel h-full flex flex-col p-6">
    <div class="flex items-center gap-3 mb-6">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-300">
        <UIcon name="i-lucide-calendar-days" class="h-5 w-5" />
      </div>
      <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">时间轴</h2>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <UTimeline
        :items="timelineItems"
        color="primary"
        size="md"
        class="w-full"
        :ui="{
          item: 'cursor-pointer transition-all duration-300 hover:translate-x-1',
          icon: 'text-primary-400 dark:text-primary-300',
          title: 'text-sm font-bold text-slate-700 dark:text-slate-200',
          description: 'text-xs text-slate-400 dark:text-slate-500',
          date: 'text-xs font-bold text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-lg'
        }"
        @select="onSelect"
      />

      <div v-if="timelineItems.length === 0" class="flex flex-col items-center justify-center h-full text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3">
          <UIcon name="i-lucide-calendar-x" class="h-8 w-8" />
        </div>
        <p class="text-sm font-bold text-slate-500 dark:text-slate-400">暂无时间轴数据</p>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">构建索引后将在此显示</p>
      </div>
    </div>
  </div>
</template>
