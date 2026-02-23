<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { RouterView } from 'vue-router'
import { useGalleryStore } from './stores/useGalleryStore'
import appLogo from '@renderer/assets/logo.png'
import ProfileManageModal from '@renderer/components/ProfileManageModal.vue'

const store = useGalleryStore()
const uiError = ref('')
const isSidebarCollapsed = ref(true)
const isWindowMaximized = ref(false)
const isProfileModalOpen = ref(false)

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

const displaySidebarItems = computed<NavigationMenuItem[]>(() => {
  if (!isSidebarCollapsed.value) {
    return sidebarItems
  }

  return sidebarItems.map((item) => {
    return {
      ...item,
      label: ''
    }
  })
})

const layoutColumns = computed(() => {
  return isSidebarCollapsed.value ? '65px 1fr' : '200px 1fr'
})

const activeProfileName = computed(() => {
  const active = store.getActiveProfile()
  if (!active) {
    return '未选择 Profile'
  }

  return active.name
})

function toggleSidebar(): void {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

function isColorModeActive(mode: 'system' | 'light' | 'dark'): boolean {
  if (!store.settings) {
    return false
  }

  return store.settings.colorMode === mode
}

onMounted(async () => {
  try {
    await store.initialize()
    isWindowMaximized.value = await window.api.isWindowMaximized()
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

async function handleToggleDevTools(): Promise<void> {
  await handleAction(() => window.api.toggleDevTools())
}

async function handleMinimizeWindow(): Promise<void> {
  await handleAction(() => window.api.minimizeWindow())
}

async function handleReloadWindow(): Promise<void> {
  await handleAction(() => window.api.reloadWindow())
}

async function handleToggleMaximizeWindow(): Promise<void> {
  await handleAction(async () => {
    await window.api.toggleMaximizeWindow()
    isWindowMaximized.value = await window.api.isWindowMaximized()
  })
}

async function handleCloseWindow(): Promise<void> {
  await handleAction(() => window.api.closeWindow())
}

function openProfileModal(): void {
  isProfileModalOpen.value = true
}

function handleProfileModalOpenChange(value: boolean): void {
  isProfileModalOpen.value = value
}

async function handleProfileSwitch(profileId: string): Promise<void> {
  if (!profileId || profileId === store.activeProfileId) {
    return
  }

  await handleAction(() => store.switchProfile(profileId))
}

async function handleCreateProfile(name: string): Promise<void> {
  await handleAction(() => store.createProfile(name))
}

async function handleRenameProfile(name: string): Promise<void> {
  await handleAction(() => store.renameActiveProfile(name))
}
</script>

<template>
  <UApp>
    <div class="app-shell h-screen w-screen" :class="isWindowMaximized ? 'p-0' : 'p-3'">
      <div class="app-frame relative flex h-full min-h-0 flex-col rounded-none">
        <header
          class="drag-region flex h-11 items-center justify-between border-b border-white/40 px-3 dark:border-white/10"
          @dblclick="handleToggleMaximizeWindow">
          <div class="flex items-center gap-2">
            <img :src="appLogo" alt="PocoPic" class="w-7 ml-1 mr-1 object-contain" />
            <p class="text-md font-bold tracking-wide text-slate-600 dark:text-slate-300">
              PocoPic
            </p>
          </div>
          <div class="no-drag flex items-center gap-2">
            <UTooltip :delay-duration="0" text="打开 Profile 管理">
              <UBadge color="neutral" variant="soft" class="max-w-44 rounded-full px-3 py-1.5 text-xs"
                @click="openProfileModal">
                <UIcon name="i-lucide-users" class="h-4 w-4" />

                <span class="truncate">{{ activeProfileName }}</span>
              </UBadge>
            </UTooltip>
            <UTooltip :delay-duration="0" text="切换开发者工具">
              <UButton class="window-button" size="md" color="neutral" variant="ghost" icon="i-lucide-terminal"
                aria-label="切换开发者工具" @click="handleToggleDevTools" />
            </UTooltip>
            <UTooltip :delay-duration="0" text="重载窗口">
              <UButton class="window-button" size="sm" color="neutral" variant="ghost" icon="i-lucide-refresh-cw"
                aria-label="重载窗口" @click="handleReloadWindow" />
            </UTooltip>
            <UTooltip :delay-duration="0" text="最小化窗口">
              <UButton class="window-button" size="md" color="neutral" variant="ghost" icon="i-lucide-minus"
                aria-label="最小化窗口" @click="handleMinimizeWindow" />
            </UTooltip>
            <UTooltip :delay-duration="0" :text="isWindowMaximized ? '还原窗口' : '最大化窗口'">
              <UButton class="window-button" size="xs" color="neutral" variant="ghost"
                :icon="isWindowMaximized ? 'i-lucide-copy' : 'i-lucide-square'"
                :aria-label="isWindowMaximized ? '还原窗口' : '最大化窗口'" @click="handleToggleMaximizeWindow" />
            </UTooltip>
            <UTooltip :delay-duration="0" text="关闭窗口">
              <UButton class="window-button-close" size="md" color="rose" variant="ghost" icon="i-lucide-x"
                aria-label="关闭窗口" @click="handleCloseWindow" />
            </UTooltip>
          </div>
        </header>

        <div class="min-h-0 flex-1 p-3">
          <div class="mx-auto grid h-full min-h-0 gap-3" :style="{ gridTemplateColumns: layoutColumns }">
            <aside class="cute-panel flex min-h-0 flex-col px-1 py-5 pb-1 drag-region">
              <UNavigationMenu orientation="vertical" highlight color="primary" :items="displaySidebarItems"
                class="data-[orientation=vertical]:w-full flex-1" :ui="{
                  item: isSidebarCollapsed
                    ? 'no-drag rounded-2xl px-2 py-3 mb-2 transition-all duration-300 flex justify-center'
                    : 'no-drag rounded-2xl px-4 py-3 mb-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-1 hover:bg-primary-50 dark:hover:bg-primary-900/20',
                  icon: 'text-primary-400 dark:text-primary-300'
                }" />

              <div class="mt-auto space-y-3 no-drag">
                <div v-if="uiError"
                  class="rounded-2xl bg-rose-50 p-4 shadow-sm border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30">
                  <div class="flex items-center gap-2 text-rose-500 mb-1">
                    <UIcon name="i-lucide-alert-circle" class="h-4 w-4" />
                    <span v-if="!isSidebarCollapsed" class="text-xs font-bold">出错了</span>
                  </div>
                  <p v-if="!isSidebarCollapsed" class="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                    {{ uiError }}
                  </p>
                </div>

                <div
                  class="rounded-2xl border border-slate-100 bg-white/70 p-2 dark:border-slate-800 dark:bg-slate-900/70">
                  <div class="flex items-center justify-center gap-1 no-drag"
                    :class="isSidebarCollapsed ? 'flex-col' : ''">
                    <UTooltip :delay-duration="0" text="切换为跟随系统主题">
                      <UButton size="sm" color="neutral" :variant="isColorModeActive('system') ? 'solid' : 'ghost'"
                        icon="i-lucide-monitor" aria-label="跟随系统主题"
                        @click="() => handleAction(() => store.setColorMode('system'))" />
                    </UTooltip>
                    <UTooltip :delay-duration="0" text="切换为浅色主题">
                      <UButton size="sm" color="neutral" :variant="isColorModeActive('light') ? 'solid' : 'ghost'"
                        icon="i-lucide-sun" aria-label="浅色主题"
                        @click="() => handleAction(() => store.setColorMode('light'))" />
                    </UTooltip>
                    <UTooltip :delay-duration="0" text="切换为深色主题">
                      <UButton size="sm" color="neutral" :variant="isColorModeActive('dark') ? 'solid' : 'ghost'"
                        icon="i-lucide-moon" aria-label="深色主题"
                        @click="() => handleAction(() => store.setColorMode('dark'))" />
                    </UTooltip>
                    <UTooltip :delay-duration="0" :text="isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'">
                      <UButton :class="isSidebarCollapsed ? 'mt-auto' : 'ml-auto'" color="neutral" variant="ghost"
                        size="sm" :icon="isSidebarCollapsed
                          ? 'i-lucide-panel-left-open'
                          : 'i-lucide-panel-left-close'
                          " :aria-label="isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'" @click="toggleSidebar" />
                    </UTooltip>
                  </div>
                </div>
              </div>
            </aside>

            <main class="min-h-0 relative">
              <RouterView v-slot="{ Component }">
                <KeepAlive>
                  <component :is="Component" />
                </KeepAlive>
              </RouterView>
            </main>
          </div>
        </div>

        <ProfileManageModal :open="isProfileModalOpen" :profiles="store.profiles"
          :active-profile-id="store.activeProfileId" @update:open="handleProfileModalOpenChange"
          @switch-profile="handleProfileSwitch" @create-profile="handleCreateProfile"
          @rename-profile="handleRenameProfile" />

        <div v-if="store.needFirstRunSetup"
          class="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md transition-all duration-500">
          <div class="cute-card w-140 p-8">
            <div class="mb-6 flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900/50 dark:text-blue-300">
                <UIcon name="i-lucide-sparkles" class="h-6 w-6" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">
                  欢迎来到 PocoPic ✨
                </h2>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  首次启动需要完成一些简单的初始化设置
                </p>
              </div>
            </div>

            <div class="space-y-4 mb-8">
              <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700 text-slate-400">
                  1
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-300">
                  设置元数据索引路径、缩略图目录与临时目录
                </p>
              </div>
              <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700 text-slate-400">
                  2
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-300">添加至少一个扫描目录</p>
              </div>
              <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-700 text-slate-400">
                  3
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-300">执行“开始构建”</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 justify-end">
              <UTooltip :delay-duration="0" text="选择元数据索引数据库路径">
                <UButton class="cute-button" size="lg" color="primary" variant="soft" icon="i-lucide-database"
                  label="选择索引路径" @click="() => handleAction(store.chooseIndexDbPath)" />
              </UTooltip>
              <UTooltip :delay-duration="0" text="选择缩略图存储目录">
                <UButton class="cute-button" size="lg" color="secondary" variant="soft" icon="i-lucide-image"
                  label="选择缩略图目录" @click="() => handleAction(store.chooseThumbnailDir)" />
              </UTooltip>
              <UTooltip :delay-duration="0" text="选择临时文件目录">
                <UButton class="cute-button" size="lg" color="info" variant="soft" icon="i-lucide-folder-clock"
                  label="选择临时目录" @click="() => handleAction(store.chooseTmpDir)" />
              </UTooltip>
              <UTooltip :delay-duration="0" text="添加待扫描的媒体目录">
                <UButton class="cute-button" size="lg" color="neutral" variant="outline" icon="i-lucide-folder-plus"
                  label="添加扫描目录" @click="() => handleAction(store.addSourceDir)" />
              </UTooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UApp>
</template>
