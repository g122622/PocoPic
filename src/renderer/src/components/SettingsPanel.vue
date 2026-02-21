<script setup lang="ts">
import { ref } from 'vue'
import type { AppSettings, FileSizeUnit, StorageStats } from '@shared/types'
import { formatBytes } from '@renderer/utils/format'

const props = defineProps<{
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

const directoryKeywordInput = ref('')
const fileKeywordInput = ref('')
const sizeUnits: FileSizeUnit[] = ['KB', 'MB', 'GB']

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

function addDirectoryKeyword(): void {
  const keyword = directoryKeywordInput.value.trim()
  if (!keyword) {
    return
  }

  const next = [...props.settings.excludeDirKeywords]
  if (!next.includes(keyword)) {
    next.push(keyword)
    emit('updateSettings', { excludeDirKeywords: next })
  }
  directoryKeywordInput.value = ''
}

function onDirectoryKeywordInputChange(value: string): void {
  directoryKeywordInput.value = value
}

function removeDirectoryKeyword(keyword: string): void {
  const next: string[] = []
  for (const item of props.settings.excludeDirKeywords) {
    if (item !== keyword) {
      next.push(item)
    }
  }
  emit('updateSettings', { excludeDirKeywords: next })
}

function addFileKeyword(): void {
  const keyword = fileKeywordInput.value.trim()
  if (!keyword) {
    return
  }

  const next = [...props.settings.excludeFileKeywords]
  if (!next.includes(keyword)) {
    next.push(keyword)
    emit('updateSettings', { excludeFileKeywords: next })
  }
  fileKeywordInput.value = ''
}

function onFileKeywordInputChange(value: string): void {
  fileKeywordInput.value = value
}

function removeFileKeyword(keyword: string): void {
  const next: string[] = []
  for (const item of props.settings.excludeFileKeywords) {
    if (item !== keyword) {
      next.push(item)
    }
  }
  emit('updateSettings', { excludeFileKeywords: next })
}

function onExcludeSizeLessThanChange(value: string): void {
  if (!value.trim()) {
    emit('updateSettings', { excludeFileSizeLessThan: null })
    return
  }

  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed > 0) {
    emit('updateSettings', { excludeFileSizeLessThan: parsed })
  }
}

function onExcludeSizeGreaterThanChange(value: string): void {
  if (!value.trim()) {
    emit('updateSettings', { excludeFileSizeGreaterThan: null })
    return
  }

  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed > 0) {
    emit('updateSettings', { excludeFileSizeGreaterThan: parsed })
  }
}

function onExcludeSizeLessThanUnitChange(value: string): void {
  const unit = parseUnit(value)
  if (unit) {
    emit('updateSettings', { excludeFileSizeLessThanUnit: unit })
  }
}

function onExcludeSizeGreaterThanUnitChange(value: string): void {
  const unit = parseUnit(value)
  if (unit) {
    emit('updateSettings', { excludeFileSizeGreaterThanUnit: unit })
  }
}

function parseUnit(value: string): FileSizeUnit | null {
  if (value === 'KB' || value === 'MB' || value === 'GB') {
    return value
  }

  return null
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

    <div class="space-y-4 rounded-3xl bg-slate-50/50 p-6 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
      <div class="flex items-center gap-2 mb-1">
        <UIcon name="i-lucide-filter" class="h-4 w-4 text-rose-500" />
        <label class="text-sm font-bold text-slate-700 dark:text-slate-200">排除文件/目录</label>
      </div>

      <div class="space-y-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-folder-x" class="h-4 w-4 text-amber-500" />
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">目录关键字排除</h3>
        </div>
        <div class="flex gap-3">
          <UInput
            :model-value="directoryKeywordInput"
            class="cute-input flex-1"
            size="md"
            color="white"
            variant="outline"
            placeholder="例如：node_modules、缓存"
            :ui="{ rounded: 'rounded-xl' }"
            @update:model-value="onDirectoryKeywordInputChange"
          />
          <UButton class="cute-button" size="md" color="amber" variant="soft" icon="i-lucide-plus" label="添加" @click="addDirectoryKeyword" />
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="keyword in settings.excludeDirKeywords"
            :key="`dir-${keyword}`"
            class="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          >
            <span>{{ keyword }}</span>
            <button class="text-amber-600 hover:text-rose-500" type="button" @click="removeDirectoryKeyword(keyword)">
              <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-file-x" class="h-4 w-4 text-cyan-500" />
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">文件关键字排除</h3>
        </div>
        <div class="flex gap-3">
          <UInput
            :model-value="fileKeywordInput"
            class="cute-input flex-1"
            size="md"
            color="white"
            variant="outline"
            placeholder="例如：_tmp、draft"
            :ui="{ rounded: 'rounded-xl' }"
            @update:model-value="onFileKeywordInputChange"
          />
          <UButton class="cute-button" size="md" color="cyan" variant="soft" icon="i-lucide-plus" label="添加" @click="addFileKeyword" />
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="keyword in settings.excludeFileKeywords"
            :key="`file-${keyword}`"
            class="flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
          >
            <span>{{ keyword }}</span>
            <button class="text-cyan-600 hover:text-rose-500" type="button" @click="removeFileKeyword(keyword)">
              <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-3 rounded-2xl bg-white/70 p-4 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-scale" class="h-4 w-4 text-indigo-500" />
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">文件大小排除</h3>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">忽略小于该值的文件</label>
            <div class="flex gap-2">
              <UInput
                type="number"
                class="cute-input flex-1"
                size="md"
                color="white"
                variant="outline"
                :ui="{ rounded: 'rounded-xl' }"
                :model-value="settings.excludeFileSizeLessThan === null ? '' : String(settings.excludeFileSizeLessThan)"
                placeholder="留空表示不限制"
                @update:model-value="onExcludeSizeLessThanChange"
              />
              <select
                class="rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                :value="settings.excludeFileSizeLessThanUnit"
                @change="onExcludeSizeLessThanUnitChange(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="unit in sizeUnits" :key="`min-${unit}`" :value="unit">{{ unit }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">忽略大于该值的文件</label>
            <div class="flex gap-2">
              <UInput
                type="number"
                class="cute-input flex-1"
                size="md"
                color="white"
                variant="outline"
                :ui="{ rounded: 'rounded-xl' }"
                :model-value="settings.excludeFileSizeGreaterThan === null ? '' : String(settings.excludeFileSizeGreaterThan)"
                placeholder="留空表示不限制"
                @update:model-value="onExcludeSizeGreaterThanChange"
              />
              <select
                class="rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                :value="settings.excludeFileSizeGreaterThanUnit"
                @change="onExcludeSizeGreaterThanUnitChange(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="unit in sizeUnits" :key="`max-${unit}`" :value="unit">{{ unit }}</option>
              </select>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">目录关键字命中时会跳过该目录及其全部子目录，文件规则仅作用于媒体文件。</p>
      </div>
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
    </div>
  </div>
</template>
