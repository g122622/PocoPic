<script setup lang="ts">
import { ref } from 'vue'
import type { YearTimelineBucket } from '@shared/types'

const props = defineProps<{
  buckets: YearTimelineBucket[]
}>()

const emit = defineEmits<{
  selectYear: [year: number]
  selectMonth: [payload: { year: number; month: number }]
}>()

const expandedYears = ref(new Set<number>())

function toggleYearExpand(year: number): void {
  if (expandedYears.value.has(year)) {
    expandedYears.value.delete(year)
    return
  }

  expandedYears.value.add(year)
}

function isExpanded(year: number): boolean {
  return expandedYears.value.has(year)
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
      <div class="space-y-3">
        <div
          v-for="bucket in props.buckets"
          :key="bucket.year"
          class="rounded-2xl border border-slate-200/70 bg-white/70 p-3 transition-colors dark:border-slate-700/70 dark:bg-slate-900/30"
        >
          <div class="flex items-center gap-2">
            <UButton
              color="primary"
              variant="ghost"
              class="flex-1 justify-start px-2"
              :label="`${bucket.year} 年`"
              icon="i-lucide-calendar-days"
              @click="emit('selectYear', bucket.year)"
            />

            <span class="rounded-lg bg-primary-50 px-2 py-1 text-xs font-bold text-primary-500 dark:bg-primary-900/30 dark:text-primary-300">
              {{ bucket.count }} 项
            </span>

            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="isExpanded(bucket.year) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              :aria-label="isExpanded(bucket.year) ? `收起 ${bucket.year} 年月份` : `展开 ${bucket.year} 年月份`"
              @click="toggleYearExpand(bucket.year)"
            />
          </div>

          <div v-if="isExpanded(bucket.year)" class="mt-3 pl-2">
            <div class="space-y-2 border-l border-dashed border-slate-300/80 pl-3 dark:border-slate-600/80">
              <UButton
                v-for="monthBucket in bucket.months"
                :key="`${bucket.year}-${monthBucket.month}`"
                color="neutral"
                variant="ghost"
                class="w-full justify-between text-sm"
                @click="emit('selectMonth', { year: bucket.year, month: monthBucket.month })"
              >
                <span class="font-medium text-slate-700 dark:text-slate-200">{{ monthBucket.month }} 月</span>
                <span class="text-xs text-slate-400 dark:text-slate-500">{{ monthBucket.count }} 项</span>
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div v-if="props.buckets.length === 0" class="flex flex-col items-center justify-center h-full text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3">
          <UIcon name="i-lucide-calendar-x" class="h-8 w-8" />
        </div>
        <p class="text-sm font-bold text-slate-500 dark:text-slate-400">暂无时间轴数据</p>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">构建索引后将在此显示</p>
      </div>
    </div>
  </div>
</template>
