<script setup lang="ts">
import { ref } from 'vue'
import type { AppSettings, FileSizeUnit, StorageStats } from '@shared/types'
import { formatBytes } from '@renderer/utils/format'
import SourceDirManageModal from '@renderer/components/SourceDirManageModal.vue'

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
const sourceDirModalOpen = ref(false)
const sizeUnits: FileSizeUnit[] = ['KB', 'MB', 'GB']

function onSourceDirModalOpenChange(value: boolean): void {
  sourceDirModalOpen.value = value
}

function onSourceDirsReorder(next: string[]): void {
  emit('updateSettings', { sourceDirs: next })
}

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
  <div class="cute-panel space-y-4 p-5">
    <div class="flex items-center gap-2 mb-5">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      >
        <UIcon name="i-lucide-sliders-horizontal" class="h-4 w-4" />
      </div>
      <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">基础设置</h2>
    </div>

    <div
      class="space-y-3 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
    >
      <div class="flex items-center gap-1.5 mb-3">
        <UIcon name="i-lucide-database" class="h-3.5 w-3.5 text-primary-500" />
        <label class="text-xs font-bold text-slate-700 dark:text-slate-200">元数据索引数据库</label>
      </div>
      <div class="flex gap-2">
        <UInput
          :model-value="settings.indexDbPath"
          readonly
          class="cute-input flex-1"
          size="md"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-xl' }"
        />
        <UTooltip :delay-duration="0" text="选择元数据索引数据库路径">
          <UButton
            class="cute-button"
            size="md"
            color="primary"
            variant="soft"
            icon="i-lucide-folder-search"
            label="选择"
            @click="emit('chooseIndexDbPath')"
          />
        </UTooltip>
        <UTooltip :delay-duration="0" text="打开元数据索引数据库所在目录">
          <UButton
            class="cute-button"
            size="md"
            color="neutral"
            variant="outline"
            icon="i-lucide-external-link"
            label="打开"
            :disabled="!settings.indexDbPath"
            @click="emit('openPath', settings.indexDbPath)"
          />
        </UTooltip>
      </div>
      <div
        class="flex items-center justify-between mt-1.5 rounded-xl bg-white/60 p-2 dark:bg-slate-900/60"
      >
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-hard-drive" class="h-3.5 w-3.5 text-slate-400" />
          <span class="text-xs font-medium text-slate-600 dark:text-slate-300"
            >索引大小：<span class="font-bold text-primary-600 dark:text-primary-400">{{
              formatBytes(storageStats.indexDbBytes)
            }}</span></span
          >
        </div>
        <UTooltip :delay-duration="0" text="清空元数据索引数据库">
          <UButton
            class="cute-button"
            color="rose"
            variant="soft"
            size="xs"
            icon="i-lucide-trash-2"
            label="清除索引"
            @click="emit('clearIndexDb')"
          />
        </UTooltip>
      </div>
    </div>

    <div
      class="space-y-3 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
    >
      <div class="flex items-center gap-1.5 mb-3">
        <UIcon name="i-lucide-image" class="h-3.5 w-3.5 text-emerald-500" />
        <label class="text-xs font-bold text-slate-700 dark:text-slate-200">缩略图目录</label>
      </div>
      <div class="flex gap-2">
        <UInput
          :model-value="settings.thumbnailDir"
          readonly
          class="cute-input flex-1"
          size="md"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-xl' }"
        />
        <UTooltip :delay-duration="0" text="选择缩略图存储目录">
          <UButton
            class="cute-button"
            size="md"
            color="primary"
            variant="soft"
            icon="i-lucide-folder-search"
            label="选择"
            @click="emit('chooseThumbnailDir')"
          />
        </UTooltip>
        <UTooltip :delay-duration="0" text="打开缩略图目录">
          <UButton
            class="cute-button"
            size="md"
            color="neutral"
            variant="outline"
            icon="i-lucide-external-link"
            label="打开"
            :disabled="!settings.thumbnailDir"
            @click="emit('openPath', settings.thumbnailDir)"
          />
        </UTooltip>
      </div>
      <div
        class="flex items-center justify-between mt-1.5 rounded-xl bg-white/60 p-2 dark:bg-slate-900/60"
      >
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-hard-drive" class="h-3.5 w-3.5 text-slate-400" />
          <span class="text-xs font-medium text-slate-600 dark:text-slate-300"
            >缩略图大小：<span class="font-bold text-emerald-600 dark:text-emerald-400">{{
              formatBytes(storageStats.thumbnailBytes)
            }}</span></span
          >
        </div>
        <UTooltip :delay-duration="0" text="清空全部缩略图缓存">
          <UButton
            class="cute-button"
            color="rose"
            variant="soft"
            size="xs"
            icon="i-lucide-trash-2"
            label="清除缩略图"
            @click="emit('clearThumbnails')"
          />
        </UTooltip>
      </div>
    </div>

    <div
      class="space-y-3 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
    >
      <div class="flex items-center gap-1.5 mb-3">
        <UIcon name="i-lucide-folder-clock" class="h-3.5 w-3.5 text-cyan-500" />
        <label class="text-xs font-bold text-slate-700 dark:text-slate-200">临时目录</label>
      </div>
      <div class="flex gap-2">
        <UInput
          :model-value="settings.tmpDir"
          readonly
          class="cute-input flex-1"
          size="md"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-xl' }"
        />
        <UTooltip :delay-duration="0" text="选择构建临时目录">
          <UButton
            class="cute-button"
            size="md"
            color="primary"
            variant="soft"
            icon="i-lucide-folder-search"
            label="选择"
            @click="emit('chooseTmpDir')"
          />
        </UTooltip>
        <UTooltip :delay-duration="0" text="打开临时目录">
          <UButton
            class="cute-button"
            size="md"
            color="neutral"
            variant="outline"
            icon="i-lucide-external-link"
            label="打开"
            :disabled="!settings.tmpDir"
            @click="emit('openPath', settings.tmpDir)"
          />
        </UTooltip>
      </div>
      <p class="text-[10px] text-slate-500 dark:text-slate-400">
        视频抽帧会写入临时文件，此项必须手动配置。
      </p>
    </div>

    <div
      class="space-y-3 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
    >
      <div class="flex items-center justify-between mb-1.5">
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-folder-open" class="h-3.5 w-3.5 text-amber-500" />
          <label class="text-xs font-bold text-slate-700 dark:text-slate-200">扫描目录</label>
        </div>
        <div class="flex items-center gap-1.5">
          <UTooltip :delay-duration="0" text="添加新的扫描目录">
            <UButton
              class="cute-button"
              color="amber"
              variant="soft"
              size="xs"
              icon="i-lucide-plus"
              label="添加目录"
              @click="emit('addSourceDir')"
            />
          </UTooltip>
          <UTooltip :delay-duration="0" text="打开扫描目录管理弹窗">
            <UButton
              class="cute-button"
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-list"
              label="管理"
              @click="sourceDirModalOpen = true"
            />
          </UTooltip>
        </div>
      </div>

      <div
        class="rounded-xl border border-slate-100 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <p class="text-xs text-slate-600 dark:text-slate-300">
          当前已配置
          <span class="font-bold text-amber-600 dark:text-amber-400">
            {{ settings.sourceDirs.length }}
          </span>
          个扫描目录。
          <span class="ml-1">点击“管理”可在大空间弹窗中拖动排序。</span>
        </p>
        <p class="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
          排序结果会影响扫描优先顺序。
        </p>
      </div>

      <SourceDirManageModal
        :open="sourceDirModalOpen"
        :source-dirs="settings.sourceDirs"
        @update:open="onSourceDirModalOpenChange"
        @add-source-dir="emit('addSourceDir')"
        @remove-source-dir="(path) => emit('removeSourceDir', path)"
        @open-path="(path) => emit('openPath', path)"
        @reorder-source-dirs="onSourceDirsReorder"
      />
    </div>

    <div
      class="space-y-3 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
    >
      <div class="flex items-center gap-1.5 mb-3">
        <UIcon name="i-lucide-filter" class="h-3.5 w-3.5 text-rose-500" />
        <label class="text-xs font-bold text-slate-700 dark:text-slate-200">排除文件/目录</label>
      </div>

      <div
        class="space-y-2 rounded-xl bg-white/70 p-3 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
      >
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-folder-x" class="h-3.5 w-3.5 text-amber-500" />
          <h3 class="text-xs font-bold text-slate-700 dark:text-slate-200">目录关键字排除</h3>
        </div>
        <div class="flex gap-2">
          <UInput
            :model-value="directoryKeywordInput"
            class="cute-input flex-1"
            size="sm"
            color="white"
            variant="outline"
            placeholder="例如：node_modules、缓存"
            :ui="{ rounded: 'rounded-lg' }"
            @update:model-value="onDirectoryKeywordInputChange"
          />
          <UTooltip :delay-duration="0" text="添加目录关键字排除规则">
            <UButton
              class="cute-button"
              size="sm"
              color="amber"
              variant="soft"
              icon="i-lucide-plus"
              label="添加"
              @click="addDirectoryKeyword"
            />
          </UTooltip>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <div
            v-for="keyword in settings.excludeDirKeywords"
            :key="`dir-${keyword}`"
            class="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[12px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          >
            <span>{{ keyword }}</span>
            <UTooltip :delay-duration="0" :text="`删除目录关键字：${keyword}`">
              <button
                class="text-amber-600 hover:text-rose-500"
                type="button"
                @click="removeDirectoryKeyword(keyword)"
              >
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </button>
            </UTooltip>
          </div>
        </div>
      </div>

      <div
        class="space-y-2 rounded-xl bg-white/70 p-3 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
      >
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-file-x" class="h-3.5 w-3.5 text-cyan-500" />
          <h3 class="text-xs font-bold text-slate-700 dark:text-slate-200">文件关键字排除</h3>
        </div>
        <div class="flex gap-2">
          <UInput
            :model-value="fileKeywordInput"
            class="cute-input flex-1"
            size="sm"
            color="white"
            variant="outline"
            placeholder="例如：_tmp、draft"
            :ui="{ rounded: 'rounded-lg' }"
            @update:model-value="onFileKeywordInputChange"
          />
          <UTooltip :delay-duration="0" text="添加文件关键字排除规则">
            <UButton
              class="cute-button"
              size="sm"
              color="cyan"
              variant="soft"
              icon="i-lucide-plus"
              label="添加"
              @click="addFileKeyword"
            />
          </UTooltip>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <div
            v-for="keyword in settings.excludeFileKeywords"
            :key="`file-${keyword}`"
            class="flex items-center gap-1.5 rounded-lg bg-cyan-50 px-2 py-1 text-[10px] font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
          >
            <span>{{ keyword }}</span>
            <UTooltip :delay-duration="0" :text="`删除文件关键字：${keyword}`">
              <button
                class="text-cyan-600 hover:text-rose-500"
                type="button"
                @click="removeFileKeyword(keyword)"
              >
                <UIcon name="i-lucide-x" class="h-3 w-3" />
              </button>
            </UTooltip>
          </div>
        </div>
      </div>

      <div
        class="space-y-2 rounded-xl bg-white/70 p-3 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
      >
        <div class="flex items-center gap-1.5">
          <UIcon name="i-lucide-scale" class="h-3.5 w-3.5 text-indigo-500" />
          <h3 class="text-xs font-bold text-slate-700 dark:text-slate-200">文件大小排除</h3>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold text-slate-500 dark:text-slate-400"
              >忽略小于该值的文件</label
            >
            <div class="flex gap-1.5">
              <UInput
                type="number"
                class="cute-input flex-1"
                size="sm"
                color="white"
                variant="outline"
                :ui="{ rounded: 'rounded-lg' }"
                :model-value="
                  settings.excludeFileSizeLessThan === null
                    ? ''
                    : String(settings.excludeFileSizeLessThan)
                "
                placeholder="留空表示不限制"
                @update:model-value="onExcludeSizeLessThanChange"
              />
              <select
                class="rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                :value="settings.excludeFileSizeLessThanUnit"
                @change="
                  onExcludeSizeLessThanUnitChange(($event.target as HTMLSelectElement).value)
                "
              >
                <option v-for="unit in sizeUnits" :key="`min-${unit}`" :value="unit">
                  {{ unit }}
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold text-slate-500 dark:text-slate-400"
              >忽略大于该值的文件</label
            >
            <div class="flex gap-1.5">
              <UInput
                type="number"
                class="cute-input flex-1"
                size="sm"
                color="white"
                variant="outline"
                :ui="{ rounded: 'rounded-lg' }"
                :model-value="
                  settings.excludeFileSizeGreaterThan === null
                    ? ''
                    : String(settings.excludeFileSizeGreaterThan)
                "
                placeholder="留空表示不限制"
                @update:model-value="onExcludeSizeGreaterThanChange"
              />
              <select
                class="rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                :value="settings.excludeFileSizeGreaterThanUnit"
                @change="
                  onExcludeSizeGreaterThanUnitChange(($event.target as HTMLSelectElement).value)
                "
              >
                <option v-for="unit in sizeUnits" :key="`max-${unit}`" :value="unit">
                  {{ unit }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <p class="text-[10px] text-slate-500 dark:text-slate-400">
          目录关键字命中时会跳过该目录及其全部子目录，文件规则仅作用于媒体文件。
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2 mb-5 mt-6">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      >
        <UIcon name="i-lucide-cpu" class="h-4 w-4" />
      </div>
      <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">高级设置</h2>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div
        class="space-y-1.5 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
      >
        <label
          class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <UIcon name="i-lucide-network" class="h-3.5 w-3.5 text-indigo-500" />
          Worker 数
        </label>
        <UInput
          type="number"
          class="cute-input"
          size="sm"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-lg' }"
          :model-value="String(settings.workerCount)"
          @update:model-value="onWorkerCountChange"
        />
      </div>
      <div
        class="space-y-1.5 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
      >
        <label
          class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <UIcon name="i-lucide-scaling" class="h-3.5 w-3.5 text-indigo-500" />
          缩略图尺寸
        </label>
        <UInput
          type="number"
          class="cute-input"
          size="sm"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-lg' }"
          :model-value="String(settings.thumbnailSize)"
          @update:model-value="onSizeChange"
        />
      </div>
      <div
        class="space-y-1.5 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
      >
        <label
          class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <UIcon name="i-lucide-image-minus" class="h-3.5 w-3.5 text-indigo-500" />
          压缩质量
        </label>
        <UInput
          type="number"
          class="cute-input"
          size="sm"
          color="white"
          variant="outline"
          :ui="{ rounded: 'rounded-lg' }"
          :model-value="String(settings.thumbnailQuality)"
          @update:model-value="onQualityChange"
        />
      </div>
    </div>

    <div
      class="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50/50 p-4 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50"
    >
      <div
        class="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <div
          class="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-violet-500 dark:bg-violet-900/30 dark:text-violet-400"
        >
          <UIcon name="i-lucide-map-pin-off" class="h-3.5 w-3.5" />
        </div>
        <UTooltip :delay-duration="0" text="构建时忽略位置信息解析">
          <USwitch
            :model-value="settings.ignoreLocationData"
            color="violet"
            size="sm"
            @update:model-value="(value) => emit('updateSettings', { ignoreLocationData: value })"
          />
        </UTooltip>
        <span class="text-xs font-bold text-slate-700 dark:text-slate-200 pr-1"
          >构建时忽略位置数据</span
        >
      </div>

      <div
        class="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <div
          class="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400"
        >
          <UIcon name="i-lucide-clock" class="h-3.5 w-3.5" />
        </div>
        <UTooltip :delay-duration="0" text="控制虚拟列表卡片是否显示拍摄日期">
          <USwitch
            :model-value="settings.showMediaCapturedAt"
            color="primary"
            size="sm"
            @update:model-value="(value) => emit('updateSettings', { showMediaCapturedAt: value })"
          />
        </UTooltip>
        <span class="text-xs font-bold text-slate-700 dark:text-slate-200 pr-1"
          >媒体卡片显示日期</span
        >
      </div>

      <div
        class="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <div
          class="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400"
        >
          <UIcon name="i-lucide-file" class="h-3.5 w-3.5" />
        </div>
        <UTooltip :delay-duration="0" text="控制虚拟列表卡片是否显示文件大小">
          <USwitch
            :model-value="settings.showMediaSize"
            color="emerald"
            size="sm"
            @update:model-value="(value) => emit('updateSettings', { showMediaSize: value })"
          />
        </UTooltip>
        <span class="text-xs font-bold text-slate-700 dark:text-slate-200 pr-1"
          >媒体卡片显示大小</span
        >
      </div>
    </div>
  </div>
</template>
