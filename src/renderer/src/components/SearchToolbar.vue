<script setup lang="ts">
const props = defineProps<{
  keyword: string
  favoritesOnly: boolean
}>()

const emit = defineEmits<{
  updateKeyword: [value: string]
  updateDateRange: [start: number | null, end: number | null]
  updateFavoritesOnly: [value: boolean]
  apply: []
}>()

function onStartDateChange(value: string): void {
  if (!value) {
    emit('updateDateRange', null, null)
    return
  }

  const timestamp = new Date(`${value}T00:00:00`).getTime()
  emit('updateDateRange', timestamp, null)
}

function onEndDateChange(value: string): void {
  if (!value) {
    emit('updateDateRange', null, null)
    return
  }

  const timestamp = new Date(`${value}T23:59:59`).getTime()
  emit('updateDateRange', null, timestamp)
}
</script>

<template>
  <div class="cute-panel flex flex-wrap items-center gap-4 p-4">
    <div class="flex items-center gap-2 flex-1 min-w-[240px]">
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-primary-900/30 dark:text-primary-300">
        <UIcon name="i-lucide-search" class="h-5 w-5" />
      </div>
      <UInput
        :model-value="props.keyword"
        placeholder="按文件名搜索..."
        class="cute-input flex-1"
        size="lg"
        color="primary"
        variant="outline"
        :ui="{ rounded: 'rounded-2xl' }"
        @update:model-value="(value) => emit('updateKeyword', value)"
      />
    </div>

    <div class="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-700/50">
      <UIcon name="i-lucide-calendar" class="h-5 w-5 text-slate-400 ml-2" />
      <UInput type="date" class="cute-input w-36" size="md" color="white" variant="outline" :ui="{ rounded: 'rounded-xl' }" @update:model-value="onStartDateChange" />
      <span class="text-slate-300 font-bold">-</span>
      <UInput type="date" class="cute-input w-36" size="md" color="white" variant="outline" :ui="{ rounded: 'rounded-xl' }" @update:model-value="onEndDateChange" />
    </div>

    <div class="flex items-center gap-3 bg-amber-50/50 dark:bg-amber-900/10 p-2 pr-4 rounded-2xl border border-amber-100/50 dark:border-amber-800/30">
      <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-900/50 dark:text-amber-300">
        <UIcon name="i-lucide-star" class="h-4 w-4" />
      </div>
      <USwitch
        :model-value="props.favoritesOnly"
        color="amber"
        size="md"
        @update:model-value="(value) => emit('updateFavoritesOnly', value)"
      />
      <span class="text-sm font-bold text-amber-700 dark:text-amber-400">仅收藏</span>
    </div>

    <UButton class="cute-button ml-auto" size="lg" color="primary" icon="i-lucide-sparkles" label="开始搜索" @click="emit('apply')" />
  </div>
</template>
