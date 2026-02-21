<script setup lang="ts">
import { ref } from 'vue'
import SettingsPanel from '@renderer/components/SettingsPanel.vue'
import { useGalleryStore } from '@renderer/stores/useGalleryStore'

const store = useGalleryStore()
const uiError = ref('')

async function handleAction(action: () => Promise<void>): Promise<void> {
  try {
    uiError.value = ''
    await action()
  } catch (error) {
    uiError.value = error instanceof Error ? error.message : '操作失败'
  }
}
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <header class="cute-panel px-4 py-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-200 to-emerald-300 text-white shadow-md shadow-teal-200/50">
        <UIcon name="i-lucide-settings-2" class="h-5 w-5" />
      </div>
      <div>
        <h1 class="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">设置</h1>
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">管理索引路径、缩略图数据库、构建参数与主题。</p>
      </div>
    </header>

    <div v-if="uiError" class="rounded-2xl bg-rose-50 p-4 shadow-sm border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30 flex items-center gap-3">
      <UIcon name="i-lucide-alert-circle" class="h-5 w-5 text-rose-500" />
      <p class="text-sm font-medium text-rose-600 dark:text-rose-300">
        {{ uiError }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <SettingsPanel
        v-if="store.settings"
        :settings="store.settings"
        :storage-stats="store.storageStats"
        @choose-index-db-path="() => handleAction(store.chooseIndexDbPath)"
        @choose-thumbnail-dir="() => handleAction(store.chooseThumbnailDir)"
        @choose-tmp-dir="() => handleAction(store.chooseTmpDir)"
        @add-source-dir="() => handleAction(store.addSourceDir)"
        @remove-source-dir="(path) => handleAction(() => store.removeSourceDir(path))"
        @open-path="(path) => handleAction(() => store.openPath(path))"
        @update-settings="(next) => handleAction(() => store.updateSettings(next))"
        @clear-index-db="() => handleAction(store.clearIndexDb)"
        @clear-thumbnails="() => handleAction(store.clearThumbnails)"
      />
    </div>
  </div>
</template>
