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
  <div class="space-y-3 rounded-3xl bg-white/70 p-5 shadow-sm backdrop-blur-md dark:bg-black/20">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-slate-700 dark:text-slate-100">构建任务</h2>
      <span class="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-600 dark:bg-violet-900/50 dark:text-violet-200">
        {{ status.state }}
      </span>
    </div>

    <UProgress :model-value="progressPercent" />

    <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
      <p>总数：{{ status.total }}</p>
      <p>已处理：{{ status.processed }}</p>
      <p>成功：{{ status.succeeded }}</p>
      <p>失败：{{ status.failed }}</p>
    </div>

    <p class="truncate text-xs text-slate-500 dark:text-slate-400">目录：{{ status.currentDirectory || '-' }}</p>
    <p class="truncate text-xs text-slate-500 dark:text-slate-400">文件：{{ status.currentFile || '-' }}</p>

    <div class="flex flex-wrap gap-2">
      <UButton label="开始构建" :disabled="status.state === 'running' || status.state === 'paused'" @click="emit('start')" />
      <UButton label="暂停" color="neutral" variant="soft" :disabled="status.state !== 'running'" @click="emit('pause')" />
      <UButton
        label="继续"
        color="neutral"
        variant="soft"
        :disabled="status.state !== 'paused'"
        @click="emit('resume')"
      />
      <UButton label="取消" color="error" variant="soft" :disabled="status.state === 'idle'" @click="emit('cancel')" />
    </div>
  </div>
</template>
