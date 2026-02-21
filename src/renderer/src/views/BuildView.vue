<script setup lang="ts">
import { ref } from 'vue'
import BuildStatusPanel from '@renderer/components/BuildStatusPanel.vue'
import BuildErrorsPanel from '@renderer/components/BuildErrorsPanel.vue'
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
    <header class="cute-panel px-6 py-4 flex items-center gap-4">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-200 to-violet-300 text-white shadow-md shadow-blue-200/50">
        <UIcon name="i-lucide-hammer" class="h-6 w-6" />
      </div>
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">构建任务</h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">管理媒体索引构建进度，查看并清理构建错误。</p>
      </div>
    </header>

    <div
      v-if="uiError"
      class="rounded-2xl bg-rose-50 p-4 shadow-sm border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30 flex items-center gap-3"
    >
      <UIcon name="i-lucide-alert-circle" class="h-5 w-5 text-rose-500" />
      <p class="text-sm font-medium text-rose-600 dark:text-rose-300">
        {{ uiError }}
      </p>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-[380px_1fr] gap-4">
      <aside class="min-h-0 overflow-y-auto overflow-x-hidden pr-2 pb-2">
        <BuildStatusPanel
          :status="store.buildStatus"
          :progress-percent="store.progressPercent"
          @start="() => handleAction(store.startBuild)"
          @pause="() => handleAction(store.pauseBuild)"
          @resume="() => handleAction(store.resumeBuild)"
          @cancel="() => handleAction(store.cancelBuild)"
        />
      </aside>

      <main class="min-h-0 overflow-y-auto overflow-x-hidden pr-2 pb-2">
        <BuildErrorsPanel :errors="store.errors" @clear="() => handleAction(store.clearErrors)" />
      </main>
    </div>
  </div>
</template>
