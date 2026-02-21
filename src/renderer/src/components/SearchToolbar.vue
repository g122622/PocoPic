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
  <div class="flex flex-wrap items-center gap-2 rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-md dark:bg-black/20">
    <UInput
      :model-value="props.keyword"
      placeholder="按文件名搜索"
      class="min-w-[220px] flex-1"
      @update:model-value="(value) => emit('updateKeyword', value)"
    />
    <UInput type="date" class="w-40" @update:model-value="onStartDateChange" />
    <UInput type="date" class="w-40" @update:model-value="onEndDateChange" />
    <USwitch
      :model-value="props.favoritesOnly"
      label="仅收藏"
      @update:model-value="(value) => emit('updateFavoritesOnly', value)"
    />
    <UButton label="搜索" color="primary" @click="emit('apply')" />
  </div>
</template>
