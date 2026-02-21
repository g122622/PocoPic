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
  <div class="flex h-full flex-col gap-3">
    <header class="rounded-3xl bg-white/70 px-5 py-3 shadow-sm backdrop-blur-md dark:bg-black/20">
      <h1 class="text-xl font-bold text-slate-700 dark:text-slate-100">设置</h1>
      <p class="text-xs text-slate-500 dark:text-slate-300">管理索引路径、缩略图数据库、构建参数与主题。</p>
    </header>

    <p v-if="uiError" class="rounded-xl bg-rose-100 px-3 py-2 text-xs text-rose-600 dark:bg-rose-900/40 dark:text-rose-200">
      {{ uiError }}
    </p>

    <SettingsPanel
      v-if="store.settings"
      :settings="store.settings"
      :storage-stats="store.storageStats"
      @choose-index-db-path="() => handleAction(store.chooseIndexDbPath)"
      @choose-thumbnail-dir="() => handleAction(store.chooseThumbnailDir)"
      @add-source-dir="() => handleAction(store.addSourceDir)"
      @remove-source-dir="(path) => handleAction(() => store.removeSourceDir(path))"
      @open-path="(path) => handleAction(() => store.openPath(path))"
      @update-settings="(next) => handleAction(() => store.updateSettings(next))"
      @clear-index-db="() => handleAction(store.clearIndexDb)"
      @clear-thumbnails="() => handleAction(store.clearThumbnails)"
    />
  </div>
</template>
