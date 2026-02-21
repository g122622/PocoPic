<script setup lang="ts">
import type { AppSettings, StorageStats } from '@shared/types'
import { formatBytes } from '@renderer/utils/format'

const props = defineProps<{
  settings: AppSettings
  storageStats: StorageStats
}>()

const emit = defineEmits<{
  chooseIndexDbPath: []
  chooseThumbnailDir: []
  addSourceDir: []
  removeSourceDir: [path: string]
  openPath: [path: string]
  updateSettings: [next: Partial<AppSettings>]
  clearIndexDb: []
  clearThumbnails: []
}>()

function onWorkerCountChange(value: string): void {
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed >= 1) {
    emit('updateSettings', { workerCount: parsed })
  }
}

function onSizeChange(value: string): void {
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed >= 64) {
    emit('updateSettings', { thumbnailSize: parsed })
  }
}

function onQualityChange(value: string): void {
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed >= 20 && parsed <= 100) {
    emit('updateSettings', { thumbnailQuality: parsed })
  }
}
</script>

<template>
  <div class="space-y-4 rounded-3xl bg-white/70 p-5 shadow-sm backdrop-blur-md dark:bg-black/20">
    <h2 class="text-base font-semibold text-slate-700 dark:text-slate-100">设置</h2>

    <div class="space-y-3">
      <label class="text-xs text-slate-500 dark:text-slate-300">元数据索引数据库</label>
      <div class="flex gap-2">
        <UInput :model-value="settings.indexDbPath" readonly class="flex-1" />
        <UButton color="neutral" variant="soft" label="选择" @click="emit('chooseIndexDbPath')" />
        <UButton
          color="neutral"
          variant="outline"
          label="打开"
          :disabled="!settings.indexDbPath"
          @click="emit('openPath', settings.indexDbPath)"
        />
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
        <span>索引大小：{{ formatBytes(storageStats.indexDbBytes) }}</span>
        <UButton color="error" variant="soft" size="xs" label="清除索引" @click="emit('clearIndexDb')" />
      </div>
    </div>

    <div class="space-y-3">
      <label class="text-xs text-slate-500 dark:text-slate-300">缩略图目录</label>
      <div class="flex gap-2">
        <UInput :model-value="settings.thumbnailDir" readonly class="flex-1" />
        <UButton color="neutral" variant="soft" label="选择" @click="emit('chooseThumbnailDir')" />
        <UButton
          color="neutral"
          variant="outline"
          label="打开"
          :disabled="!settings.thumbnailDir"
          @click="emit('openPath', settings.thumbnailDir)"
        />
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
        <span>缩略图大小：{{ formatBytes(storageStats.thumbnailBytes) }}</span>
        <UButton color="error" variant="soft" size="xs" label="清除缩略图" @click="emit('clearThumbnails')" />
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs text-slate-500 dark:text-slate-300">扫描目录</label>
        <UButton color="neutral" variant="soft" size="xs" label="添加目录" @click="emit('addSourceDir')" />
      </div>
      <ul class="max-h-36 space-y-2 overflow-auto">
        <li
          v-for="dir in settings.sourceDirs"
          :key="dir"
          class="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/70 dark:text-slate-200"
        >
          <span class="truncate">{{ dir }}</span>
          <div class="flex gap-1">
            <UButton size="xs" color="neutral" variant="outline" label="开" @click="emit('openPath', dir)" />
            <UButton size="xs" color="error" variant="soft" label="删" @click="emit('removeSourceDir', dir)" />
          </div>
        </li>
      </ul>
    </div>

    <div class="grid grid-cols-3 gap-2 text-xs">
      <label class="space-y-1">
        <span class="text-slate-500 dark:text-slate-300">Worker 数</span>
        <UInput
          type="number"
          :model-value="String(settings.workerCount)"
          @update:model-value="onWorkerCountChange"
        />
      </label>
      <label class="space-y-1">
        <span class="text-slate-500 dark:text-slate-300">缩略图尺寸</span>
        <UInput
          type="number"
          :model-value="String(settings.thumbnailSize)"
          @update:model-value="onSizeChange"
        />
      </label>
      <label class="space-y-1">
        <span class="text-slate-500 dark:text-slate-300">压缩质量</span>
        <UInput
          type="number"
          :model-value="String(settings.thumbnailQuality)"
          @update:model-value="onQualityChange"
        />
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-4 text-xs">
      <USwitch
        :model-value="settings.ignoreLocationData"
        label="构建时忽略位置数据"
        @update:model-value="(value) => emit('updateSettings', { ignoreLocationData: value })"
      />
      <div class="flex items-center gap-2">
        <span class="text-slate-500 dark:text-slate-300">主题</span>
        <button
          class="rounded-lg bg-white/90 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
          @click="emit('updateSettings', { colorMode: 'system' })"
        >
          跟随系统
        </button>
        <button
          class="rounded-lg bg-white/90 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
          @click="emit('updateSettings', { colorMode: 'light' })"
        >
          浅色
        </button>
        <button
          class="rounded-lg bg-white/90 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
          @click="emit('updateSettings', { colorMode: 'dark' })"
        >
          深色
        </button>
      </div>
    </div>
  </div>
</template>
