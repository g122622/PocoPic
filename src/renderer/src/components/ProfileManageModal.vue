<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { SelectItem } from '@nuxt/ui'
import type { ProfileSummary } from '@shared/types'

const props = defineProps<{
  open: boolean
  profiles: ProfileSummary[]
  activeProfileId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  switchProfile: [profileId: string]
  createProfile: [name: string]
  renameProfile: [name: string]
}>()

const selectedProfileId = ref('')
const createName = ref('')
const renameName = ref('')
const createError = ref('')
const renameError = ref('')
const renameInputContainerRef = ref<HTMLElement | null>(null)
const shouldFocusRenameAfterCreate = ref(false)

const profileItems = computed<SelectItem[]>(() => {
  return props.profiles.map((profile) => ({
    label: profile.name,
    value: profile.profileId
  }))
})

const activeProfileName = computed(() => {
  for (const profile of props.profiles) {
    if (profile.profileId === props.activeProfileId) {
      return profile.name
    }
  }

  return '未选择'
})

const activeProfile = computed(() => {
  for (const profile of props.profiles) {
    if (profile.profileId === props.activeProfileId) {
      return profile
    }
  }

  return null
})

watch(
  () => props.activeProfileId,
  (value) => {
    selectedProfileId.value = value
  },
  { immediate: true }
)

watch(
  () => props.open,
  (value) => {
    if (!value) {
      return
    }

    renameName.value = activeProfileName.value
    createError.value = ''
    renameError.value = ''
  },
  { immediate: true }
)

watch(
  () => props.activeProfileId,
  () => {
    if (!shouldFocusRenameAfterCreate.value) {
      return
    }

    shouldFocusRenameAfterCreate.value = false
    void focusRenameInput()
  }
)

function onSwitchProfile(value: string | number): void {
  if (typeof value !== 'string' || !value || value === props.activeProfileId) {
    return
  }

  selectedProfileId.value = value
  emit('switchProfile', value)
}

function onCreateProfile(): void {
  const name = createName.value.trim()
  if (!name) {
    createError.value = 'Profile 名称不能为空。'
    return
  }

  if (isNameTaken(name)) {
    createError.value = 'Profile 名称已存在，请更换名称。'
    return
  }

  createError.value = ''
  renameName.value = name
  shouldFocusRenameAfterCreate.value = true

  emit('createProfile', name)
  createName.value = ''
  void focusRenameInput()
}

function onRenameProfile(): void {
  if (!activeProfile.value) {
    renameError.value = '当前没有可重命名的 Profile。'
    return
  }

  const name = renameName.value.trim()
  if (!name) {
    renameError.value = 'Profile 名称不能为空。'
    return
  }

  if (isNameTaken(name, activeProfile.value.profileId)) {
    renameError.value = 'Profile 名称已存在，请更换名称。'
    return
  }

  renameError.value = ''

  emit('renameProfile', name)
}

function onCreateNameChange(value: string): void {
  createName.value = value
  if (createError.value) {
    createError.value = ''
  }
}

function onRenameNameChange(value: string): void {
  renameName.value = value
  if (renameError.value) {
    renameError.value = ''
  }
}

function isNameTaken(name: string, excludeProfileId: string | null = null): boolean {
  const target = name.trim().toLocaleLowerCase()
  for (const profile of props.profiles) {
    if (excludeProfileId && profile.profileId === excludeProfileId) {
      continue
    }

    if (profile.name.trim().toLocaleLowerCase() === target) {
      return true
    }
  }

  return false
}

async function focusRenameInput(): Promise<void> {
  await nextTick()
  const container = renameInputContainerRef.value
  if (!container) {
    return
  }

  const input = container.querySelector('input')
  input?.focus()
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Profile 管理"
    description="不同 Profile 的设置、数据库、缓存彼此隔离。"
    :ui="{ footer: 'justify-end' }"
    @update:open="(value) => emit('update:open', value)"
  >
    <template #body>
      <div class="space-y-4">
        <div
          class="rounded-xl border border-slate-200/70 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
        >
          当前 Profile：<span class="font-bold">{{ activeProfileName }}</span>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">切换 Profile</p>
          <USelect
            :items="profileItems"
            :model-value="selectedProfileId"
            value-key="value"
            placeholder="选择 Profile"
            color="neutral"
            variant="outline"
            @update:model-value="onSwitchProfile"
          />
        </div>

        <div class="space-y-2">
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">新建 Profile</p>
          <form class="space-y-2" @submit.prevent="onCreateProfile">
            <div class="flex gap-2">
              <UInput
                :model-value="createName"
                placeholder="输入新 Profile 名称"
                class="flex-1"
                @update:model-value="onCreateNameChange"
              />
              <UButton type="submit" color="primary" icon="i-lucide-user-plus" label="新建" />
            </div>
            <p v-if="createError" class="text-xs text-rose-500 dark:text-rose-300">
              {{ createError }}
            </p>
          </form>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">重命名当前 Profile</p>
          <form class="space-y-2" @submit.prevent="onRenameProfile">
            <div ref="renameInputContainerRef" class="flex gap-2">
              <UInput
                :model-value="renameName"
                placeholder="输入新的 Profile 名称"
                class="flex-1"
                @update:model-value="onRenameNameChange"
              />
              <UButton
                type="submit"
                color="neutral"
                variant="outline"
                icon="i-lucide-pencil"
                label="重命名"
                :disabled="!props.activeProfileId"
              />
            </div>
            <p v-if="renameError" class="text-xs text-rose-500 dark:text-rose-300">
              {{ renameError }}
            </p>
          </form>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton color="neutral" variant="ghost" label="关闭" @click="emit('update:open', false)" />
    </template>
  </UModal>
</template>
