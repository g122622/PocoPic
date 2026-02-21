<script setup lang="ts">
import type { BuildErrorItem } from '@shared/types'
import { formatTime } from '@renderer/utils/format'

defineProps<{
  errors: BuildErrorItem[]
}>()

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <div class="cute-panel space-y-4 p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-900/50 dark:text-rose-300">
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5" />
        </div>
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">构建错误</h2>
      </div>
      <UButton class="cute-button" size="sm" color="rose" variant="soft" icon="i-lucide-trash-2" label="清空" @click="emit('clear')" />
    </div>

    <div class="max-h-64 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
      <div
        v-for="item in errors"
        :key="item.id"
        class="rounded-2xl bg-rose-50/50 p-4 border border-rose-100/50 dark:bg-rose-900/10 dark:border-rose-800/30 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-600 dark:bg-rose-900/50 dark:text-rose-300 uppercase tracking-wider">
            {{ item.stage }}
          </span>
          <span class="text-[11px] font-medium text-slate-400">{{ formatTime(item.createdAt) }}</span>
        </div>
        <p class="truncate text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" :title="item.filePath">
          {{ item.filePath }}
        </p>
        <p class="line-clamp-2 text-xs text-rose-600/80 dark:text-rose-400/80 leading-relaxed" :title="item.message">
          {{ item.message }}
        </p>
      </div>

      <div v-if="errors.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-400 dark:bg-emerald-900/20 dark:text-emerald-500 mb-3">
          <UIcon name="i-lucide-check-circle-2" class="h-8 w-8" />
        </div>
        <p class="text-sm font-bold text-slate-500 dark:text-slate-400">暂无错误</p>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">一切运行正常 ✨</p>
      </div>
    </div>
  </div>
</template>
