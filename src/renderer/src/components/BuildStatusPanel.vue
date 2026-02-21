<script setup lang="ts">
import type { BuildStatus } from '@shared/types'

const props = defineProps<{
  status: BuildStatus
  progressPercent: number
}>()

const emit = defineEmits<{
  start: []
  pause: []
  resume: []
  cancel: []
}>()
</script>

<template>
  <div class="cute-panel space-y-5 p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-500 dark:bg-blue-900/50 dark:text-blue-300">
          <UIcon name="i-lucide-activity" class="h-5 w-5" />
        </div>
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">构建任务</h2>
      </div>
      <span class="rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold text-violet-600 dark:bg-violet-900/50 dark:text-violet-300 shadow-sm">
        {{ status.state }}
      </span>
    </div>

    <div class="space-y-2">
      <div class="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
        <span>进度</span>
        <span>{{ progressPercent.toFixed(1) }}%</span>
      </div>
      <UProgress :model-value="progressPercent" color="primary" size="md" class="rounded-full" />
    </div>

    <div class="grid grid-cols-4 gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">总数</span>
        <span class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ status.total }}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">已处理</span>
        <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ status.processed }}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">成功</span>
        <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ status.succeeded }}</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">失败</span>
        <span class="text-sm font-bold text-rose-600 dark:text-rose-400">{{ status.failed }}</span>
      </div>
    </div>

    <div class="space-y-2 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-800/30 grid grid-cols-2 gap-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-folder" class="h-4 w-4 text-slate-400 shrink-0" />
        <p class="truncate text-xs font-medium text-slate-600 dark:text-slate-300" :title="status.currentDirectory || '-'">
          {{ status.currentDirectory || '-' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-file" class="h-4 w-4 text-slate-400 shrink-0" />
        <p class="truncate text-xs font-medium text-slate-600 dark:text-slate-300" :title="status.currentFile || '-'">
          {{ status.currentFile || '-' }}
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 pt-2">
      <UTooltip :delay-duration="0" text="开始新的构建任务">
        <UButton class="cute-button flex-1" size="md" color="primary" icon="i-lucide-play" label="开始" :disabled="status.state === 'running' || status.state === 'paused'" @click="emit('start')" />
      </UTooltip>
      <UTooltip :delay-duration="0" text="暂停当前构建进程">
        <UButton class="cute-button flex-1" size="md" color="amber" variant="soft" icon="i-lucide-pause" label="暂停" :disabled="status.state !== 'running'" @click="emit('pause')" />
      </UTooltip>
      <UTooltip :delay-duration="0" text="继续执行已暂停任务">
        <UButton class="cute-button flex-1" size="md" color="emerald" variant="soft" icon="i-lucide-play-circle" label="继续" :disabled="status.state !== 'paused'" @click="emit('resume')" />
      </UTooltip>
      <UTooltip :delay-duration="0" text="取消当前构建任务">
        <UButton class="cute-button flex-1" size="md" color="rose" variant="soft" icon="i-lucide-square" label="取消" :disabled="status.state === 'idle'" @click="emit('cancel')" />
      </UTooltip>
    </div>
  </div>
</template>
