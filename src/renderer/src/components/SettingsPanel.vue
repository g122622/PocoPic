<script setup lang="ts">
import type { AppSettings, StorageStats } from '@shared/types'
import { formatBytes } from '@renderer/utils/format'

defineProps<{
  settings: AppSettings
  storageStats: StorageStats
}>()

const emit = defineEmits<{
  chooseIndexDbPath: []
  chooseThumbnailDir: []
  chooseTmpDir: []
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
  <div class="cute-panel space-y-8 p-8">
    <div class="flex items-center gap-3 mb-2">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <UIcon name="i-lucide-sliders-horizontal" class="h-5 w-5" />
      </div>
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">基础设置</h2>
    </div>

    <div class="space-y-4 rounded-3xl bg-slate-50/50 p-6 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <div class="flex items-center gap-2 mb-1">
        <UIcon name="i-lucide-database" class="h-4 w-4 text-primary-500" />
        <label class="text-sm font-bold text-slate-700 dark:text-slate-200">元数据索引数据库</label>
      </div>
      <div class="flex gap-3">
        <UInput :model-value="settings.indexDbPath" readonly class="cute-input flex-1" size="lg" color="white" variant="outline" :ui="{ rounded: 'rounded-2xl' }" />
        <UButton class="cute-button" size="lg" color="primary" variant="soft" icon="i-lucide-folder-search" label="选择" @click="emit('chooseIndexDbPath')" />
        <UButton
          class="cute-button"
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-external-link"
          label="打开"
          :disabled="!settings.indexDbPath"
          @click="emit('openPath', settings.indexDbPath)"
        />
      </div>
      <div class="flex items-center justify-between mt-2 rounded-2xl bg-white/60 p-3 dark:bg-slate-900/60">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-hard-drive" class="h-4 w-4 text-slate-400" />
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300">索引大小：<span class="font-bold text-primary-600 dark:text-primary-400">{{ formatBytes(storageStats.indexDbBytes) }}</span></span>
        </div>
        <UButton class="cute-button" color="rose" variant="soft" size="sm" icon="i-lucide-trash-2" label="清除索引" @click="emit('clearIndexDb')" />
      </div>
    </div>

    <div class="space-y-4 rounded-3xl bg-slate-50/50 p-6 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <div class="flex items-center gap-2 mb-1">
        <UIcon name="i-lucide-image" class="h-4 w-4 text-emerald-500" />
        <label class="text-sm font-bold text-slate-700 dark:text-slate-200">缩略图目录</label>
      </div>
      <div class="flex gap-3">
        <UInput :model-value="settings.thumbnailDir" readonly class="cute-input flex-1" size="lg" color="white" variant="outline" :ui="{ rounded: 'rounded-2xl' }" />
        <UButton class="cute-button" size="lg" color="emerald" variant="soft" icon="i-lucide-folder-search" label="选择" @click="emit('chooseThumbnailDir')" />
        <UButton
          class="cute-button"
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-external-link"
          label="打开"
          :disabled="!settings.thumbnailDir"
          @click="emit('openPath', settings.thumbnailDir)"
        />
      </div>
      <div class="flex items-center justify-between mt-2 rounded-2xl bg-white/60 p-3 dark:bg-slate-900/60">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-hard-drive" class="h-4 w-4 text-slate-400" />
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300">缩略图大小：<span class="font-bold text-emerald-600 dark:text-emerald-400">{{ formatBytes(storageStats.thumbnailBytes) }}</span></span>
        </div>
        <UButton class="cute-button" color="rose" variant="soft" size="sm" icon="i-lucide-trash-2" label="清除缩略图" @click="emit('clearThumbnails')" />
      </div>
    </div>

    <div class="space-y-4 rounded-3xl bg-slate-50/50 p-6 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <div class="flex items-center gap-2 mb-1">
        <UIcon name="i-lucide-folder-clock" class="h-4 w-4 text-cyan-500" />
        <label class="text-sm font-bold text-slate-700 dark:text-slate-200">临时目录</label>
      </div>
      <div class="flex gap-3">
        <UInput :model-value="settings.tmpDir" readonly class="cute-input flex-1" size="lg" color="white" variant="outline" :ui="{ rounded: 'rounded-2xl' }" />
        <UButton class="cute-button" size="lg" color="cyan" variant="soft" icon="i-lucide-folder-search" label="选择" @click="emit('chooseTmpDir')" />
        <UButton
          class="cute-button"
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-lucide-external-link"
          label="打开"
          :disabled="!settings.tmpDir"
          @click="emit('openPath', settings.tmpDir)"
        />
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400">视频抽帧会写入临时文件，此项必须手动配置。</p>
    </div>

    <div class="space-y-4 rounded-3xl bg-slate-50/50 p-6 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-folder-open" class="h-4 w-4 text-amber-500" />
          <label class="text-sm font-bold text-slate-700 dark:text-slate-200">扫描目录</label>
        </div>
        <UButton class="cute-button" color="amber" variant="soft" size="sm" icon="i-lucide-plus" label="添加目录" @click="emit('addSourceDir')" />
      </div>
      <ul class="max-h-48 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        <li
          v-for="dir in settings.sourceDirs"
          :key="dir"
          class="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400">
              <UIcon name="i-lucide-folder" class="h-4 w-4" />
            </div>
            <span class="truncate text-sm font-medium text-slate-700 dark:text-slate-300" :title="dir">{{ dir }}</span>
          </div>
          <div class="flex gap-2 shrink-0">
            <UButton class="cute-button" size="sm" color="neutral" variant="soft" icon="i-lucide-external-link" @click="emit('openPath', dir)" />
            <UButton class="cute-button" size="sm" color="rose" variant="soft" icon="i-lucide-x" @click="emit('removeSourceDir', dir)" />
          </div>
        </li>
      </ul>
    </div>

    <div class="flex items-center gap-3 mb-2 mt-8">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <UIcon name="i-lucide-cpu" class="h-5 w-5" />
      </div>
      <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">高级设置</h2>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="space-y-2 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
        <label class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <UIcon name="i-lucide-network" class="h-4 w-4 text-indigo-500" />
          Worker 数
        </label>
        <UInput
          type="number"
          class="cute-input"
          size="md"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-xl' }"
          :model-value="String(settings.workerCount)"
          @update:model-value="onWorkerCountChange"
        />
      </div>
      <div class="space-y-2 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
        <label class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <UIcon name="i-lucide-scaling" class="h-4 w-4 text-indigo-500" />
          缩略图尺寸
        </label>
        <UInput
          type="number"
          class="cute-input"
          size="md"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-xl' }"
          :model-value="String(settings.thumbnailSize)"
          @update:model-value="onSizeChange"
        />
      </div>
      <div class="space-y-2 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
        <label class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          <UIcon name="i-lucide-image-minus" class="h-4 w-4 text-indigo-500" />
          压缩质量
        </label>
        <UInput
          type="number"
          class="cute-input"
          size="md"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-xl' }"
          :model-value="String(settings.thumbnailQuality)"
          @update:model-value="onQualityChange"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-6 rounded-3xl bg-slate-50/50 p-6 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <div class="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-500 dark:bg-violet-900/30 dark:text-violet-400">
          <UIcon name="i-lucide-map-pin-off" class="h-4 w-4" />
        </div>
        <USwitch
          :model-value="settings.ignoreLocationData"
          color="violet"
          size="md"
          @update:model-value="(value) => emit('updateSettings', { ignoreLocationData: value })"
        />
        <span class="text-sm font-bold text-slate-700 dark:text-slate-200 pr-2">构建时忽略位置数据</span>
      </div>

      <div class="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-500 dark:bg-sky-900/30 dark:text-sky-400">
          <UIcon name="i-lucide-palette" class="h-4 w-4" />
        </div>
        <span class="text-sm font-bold text-slate-700 dark:text-slate-200">主题</span>
        <div class="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300"
            :class="settings.colorMode === 'system' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="emit('updateSettings', { colorMode: 'system' })"
          >
            跟随系统
          </button>
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300"
            :class="settings.colorMode === 'light' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="emit('updateSettings', { colorMode: 'light' })"
          >
            浅色
          </button>
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300"
            :class="settings.colorMode === 'dark' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="emit('updateSettings', { colorMode: 'dark' })"
          >
            深色
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
