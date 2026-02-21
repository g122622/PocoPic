<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { RouterView } from 'vue-router'
import { useGalleryStore } from './stores/useGalleryStore'

const store = useGalleryStore()
const uiError = ref('')

const sidebarItems: NavigationMenuItem[] = [
  {
    label: '相册',
    icon: 'i-lucide-images',
    to: '/album'
  },
  {
    label: '构建',
    icon: 'i-lucide-hammer',
    to: '/build'
  },
  {
    label: '设置',
    icon: 'i-lucide-settings-2',
    to: '/settings'
  },
  {
    label: '关于',
    icon: 'i-lucide-info',
    to: '/about'
  }
]

onMounted(async () => {
  try {
    await store.initialize()
  } catch (error) {
    uiError.value = error instanceof Error ? error.message : '初始化失败'
  }
})

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
  <UApp>
    <div class="h-screen w-screen p-6">
      <div class="mx-auto grid h-full max-w-[1760px] grid-cols-[240px_1fr] gap-6">
        <aside class="cute-panel flex flex-col p-5">
          <div class="mb-8 mt-2 flex items-center gap-3 px-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-300 to-purple-400 text-white shadow-lg shadow-pink-300/30">
              <UIcon name="i-lucide-camera" class="h-5 w-5" />
            </div>
            <h2 class="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">PocoPic</h2>
          </div>

          <UNavigationMenu
            orientation="vertical"
            highlight
            color="primary"
            :items="sidebarItems"
            class="data-[orientation=vertical]:w-full flex-1"
            :ui="{
              item: 'rounded-2xl px-4 py-3 mb-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-1 hover:bg-primary-50 dark:hover:bg-primary-900/20',
              icon: 'text-primary-400 dark:text-primary-300'
            }"
          />

          <div v-if="uiError" class="mt-auto rounded-2xl bg-rose-50 p-4 shadow-sm border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30">
            <div class="flex items-center gap-2 text-rose-500 mb-1">
              <UIcon name="i-lucide-alert-circle" class="h-4 w-4" />
              <span class="text-xs font-bold">出错了</span>
            </div>
            <p class="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
              {{ uiError }}
            </p>
          </div>
        </aside>

        <main class="min-h-0 relative">
          <RouterView />
        </main>
      </div>

      <div
        v-if="store.needFirstRunSetup"
        class="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md transition-all duration-500"
      >
        <div class="cute-card w-[560px] p-8">
          <div class="mb-6 flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900/50 dark:text-blue-300">
              <UIcon name="i-lucide-sparkles" class="h-6 w-6" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">欢迎来到 PocoPic ✨</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                首次启动需要完成一些简单的初始化设置
              </p>
            </div>
          </div>

          <div class="space-y-4 mb-8">
            <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700 text-slate-400">1</div>
              <p class="text-sm text-slate-600 dark:text-slate-300">设置元数据索引路径与缩略图目录</p>
            </div>
            <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700 text-slate-400">2</div>
              <p class="text-sm text-slate-600 dark:text-slate-300">添加至少一个扫描目录</p>
            </div>
            <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700 text-slate-400">3</div>
              <p class="text-sm text-slate-600 dark:text-slate-300">执行“开始构建”</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3 justify-end">
            <UButton class="cute-button" size="lg" color="primary" variant="soft" icon="i-lucide-database" label="选择索引路径" @click="() => handleAction(store.chooseIndexDbPath)" />
            <UButton class="cute-button" size="lg" color="secondary" variant="soft" icon="i-lucide-image" label="选择缩略图目录" @click="() => handleAction(store.chooseThumbnailDir)" />
            <UButton class="cute-button" size="lg" color="neutral" variant="outline" icon="i-lucide-folder-plus" label="添加扫描目录" @click="() => handleAction(store.addSourceDir)" />
          </div>
        </div>
      </div>
    </div>
  </UApp>
</template>
