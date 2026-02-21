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
  <div class="space-y-3 rounded-3xl bg-white/70 p-5 shadow-sm backdrop-blur-md dark:bg-black/20">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-slate-700 dark:text-slate-100">构建错误</h2>
      <UButton size="xs" color="error" variant="soft" label="清空" @click="emit('clear')" />
    </div>

    <div class="max-h-56 space-y-2 overflow-auto">
      <div
        v-for="item in errors"
        :key="item.id"
        class="rounded-xl bg-white/80 p-3 text-xs text-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
      >
        <p class="truncate text-[11px] text-rose-500">{{ item.stage }} · {{ formatTime(item.createdAt) }}</p>
        <p class="truncate">{{ item.filePath }}</p>
        <p class="line-clamp-2">{{ item.message }}</p>
      </div>
      <p v-if="errors.length === 0" class="text-xs text-slate-400">暂无错误</p>
    </div>
  </div>
</template>
