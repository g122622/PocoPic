<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  open: boolean
  sourceDirs: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  addSourceDir: []
  removeSourceDir: [path: string]
  openPath: [path: string]
  reorderSourceDirs: [next: string[]]
}>()

const dragSourceIndex = ref<number | null>(null)
const dragTargetIndex = ref<number | null>(null)

function onDragStart(index: number): void {
  dragSourceIndex.value = index
}

function onDragOver(index: number, event: DragEvent): void {
  event.preventDefault()
  dragTargetIndex.value = index
}

function onDrop(index: number, event: DragEvent): void {
  event.preventDefault()
  _moveItem(index)
}

function onDragEnd(): void {
  dragSourceIndex.value = null
  dragTargetIndex.value = null
}

function _moveItem(targetIndex: number): void {
  if (dragSourceIndex.value === null || dragSourceIndex.value === targetIndex) {
    onDragEnd()
    return
  }

  const next = [...props.sourceDirs]
  const movedItems = next.splice(dragSourceIndex.value, 1)
  const moved = movedItems[0]

  if (!moved) {
    onDragEnd()
    return
  }

  next.splice(targetIndex, 0, moved)
  emit('reorderSourceDirs', next)
  onDragEnd()
}
</script>

<template>
  <UModal
    :open="props.open"
    title="扫描目录管理"
    description="支持拖动排序，排序结果会影响扫描优先顺序。"
    :ui="{ footer: 'justify-between' }"
    @update:open="(value) => emit('update:open', value)"
  >
    <template #body>
      <div class="space-y-3">
        <div
          class="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60"
        >
          <p class="text-xs font-medium text-slate-600 dark:text-slate-300">
            当前共 {{ props.sourceDirs.length }} 个扫描目录，拖动左侧图标即可排序。
          </p>
          <UButton
            color="amber"
            variant="soft"
            size="sm"
            icon="i-lucide-folder-plus"
            label="添加目录"
            @click="emit('addSourceDir')"
          />
        </div>

        <div
          v-if="props.sourceDirs.length === 0"
          class="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
        >
          暂无扫描目录，请先添加。
        </div>

        <ul v-else class="max-h-96 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
          <li
            v-for="(dir, index) in props.sourceDirs"
            :key="`${dir}-${index}`"
            class="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900"
            :class="{
              'ring-2 ring-primary-300 dark:ring-primary-700': dragTargetIndex === index,
              'opacity-60': dragSourceIndex === index
            }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover="onDragOver(index, $event)"
            @drop="onDrop(index, $event)"
            @dragend="onDragEnd"
          >
            <div class="flex min-w-0 items-center gap-2">
              <button
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                type="button"
                title="拖动排序"
              >
                <UIcon name="i-lucide-grip-vertical" class="h-4 w-4" />
              </button>
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
              >
                <UIcon name="i-lucide-folder" class="h-4 w-4" />
              </div>
              <span
                class="truncate text-xs font-medium text-slate-700 dark:text-slate-300"
                :title="dir"
              >
                {{ dir }}
              </span>
            </div>

            <div class="flex shrink-0 gap-1.5">
              <UButton
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-external-link"
                @click="emit('openPath', dir)"
              />
              <UButton
                size="xs"
                color="rose"
                variant="soft"
                icon="i-lucide-x"
                @click="emit('removeSourceDir', dir)"
              />
            </div>
          </li>
        </ul>
      </div>
    </template>

    <template #footer>
      <span class="text-xs text-slate-500 dark:text-slate-400">提示：拖动后会自动保存排序。</span>
      <UButton
        color="neutral"
        variant="ghost"
        label="关闭"
        @click="emit('update:open', false)"
      />
    </template>
  </UModal>
</template>
