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
    <div class="h-screen w-screen p-4">
      <div class="mx-auto grid h-full max-w-[1760px] grid-cols-[220px_1fr] gap-3">
        <aside class="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:bg-black/20">
          <h2 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-100">导航</h2>
          <UNavigationMenu
            orientation="vertical"
            highlight
            color="neutral"
            :items="sidebarItems"
            class="data-[orientation=vertical]:w-full"
          />
          <p v-if="uiError" class="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-xs text-rose-600 dark:bg-rose-900/40 dark:text-rose-200">
            {{ uiError }}
          </p>
        </aside>

        <main class="min-h-0">
          <RouterView />
        </main>
      </div>

      <div
        v-if="store.needFirstRunSetup"
        class="absolute inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm"
      >
        <div class="w-[560px] rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <h2 class="text-lg font-semibold text-slate-700 dark:text-slate-100">首次启动需要完成初始化</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-300">
            请先设置元数据索引路径与缩略图目录，然后添加至少一个扫描目录，再执行“开始构建”。
          </p>
          <div class="mt-4 flex gap-2">
            <UButton label="选择索引路径" @click="() => handleAction(store.chooseIndexDbPath)" />
            <UButton label="选择缩略图目录" color="neutral" variant="soft" @click="() => handleAction(store.chooseThumbnailDir)" />
            <UButton label="添加扫描目录" color="neutral" variant="outline" @click="() => handleAction(store.addSourceDir)" />
          </div>
        </div>
      </div>
    </div>
  </UApp>
</template>
