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
  <div class="h-full rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:bg-black/20">
    <h2 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-100">时间轴（按年）</h2>

    <div class="h-[calc(100%-2rem)] overflow-auto pr-1">
      <UTimeline
        :items="timelineItems"
        color="neutral"
        size="sm"
        class="w-full"
        @select="onSelect"
      />
      <p v-if="timelineItems.length === 0" class="text-xs text-slate-400">暂无时间轴数据</p>
    </div>
  </div>
</template>
