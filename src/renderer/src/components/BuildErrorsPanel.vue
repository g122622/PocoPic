<script setup lang="ts">
import { computed, h } from 'vue'
import type { BuildErrorItem } from '@shared/types'
import type { TableColumn } from '@nuxt/ui'
import { formatTime } from '@renderer/utils/format'

const props = defineProps<{
  errors: BuildErrorItem[]
}>()

const emit = defineEmits<{
  clear: []
}>()

interface AggregatedBuildError {
  key: string
  stage: BuildErrorItem['stage']
  signature: string
  displayMessage: string
  count: number
  latestAt: number
  sampleFilePath: string
  fileCount: number
}

const columns: TableColumn<AggregatedBuildError>[] = [
  {
    accessorKey: 'stage',
    header: '阶段',
    cell: ({ row }) => {
      return h(
        'span',
        {
          class:
            'rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-600 uppercase tracking-wider dark:bg-rose-900/50 dark:text-rose-300'
        },
        row.original.stage
      )
    }
  },
  {
    accessorKey: 'count',
    header: '次数',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center'
      }
    }
  },
  {
    accessorKey: 'latestAt',
    header: '最近时间',
    cell: ({ row }) => {
      return formatTime(row.original.latestAt)
    }
  },
  {
    accessorKey: 'sampleFilePath',
    header: '示例文件',
    cell: ({ row }) => {
      return h(
        'p',
        {
          class: 'max-w-[420px] truncate text-xs font-medium text-slate-700 dark:text-slate-300',
          title: row.original.sampleFilePath || '-'
        },
        row.original.sampleFilePath || '-'
      )
    }
  },
  {
    accessorKey: 'displayMessage',
    header: '错误说明',
    cell: ({ row }) => {
      return h(
        'p',
        {
          class: 'max-w-[420px] truncate text-xs leading-relaxed text-rose-600/80 dark:text-rose-400/80',
          title: row.original.displayMessage
        },
        row.original.displayMessage
      )
    }
  },
  {
    accessorKey: 'fileCount',
    header: '影响文件数',
    meta: {
      class: {
        th: 'text-center',
        td: 'text-center'
      }
    }
  }
]

const groupedErrors = computed<AggregatedBuildError[]>(() => {
  const grouped = new Map<string, AggregatedBuildError>()
  const groupedFiles = new Map<string, Set<string>>()

  for (const item of props.errors) {
    const signature = resolveMessageSignature(item.message)
    const key = `${item.stage}::${signature}`
    const existing = grouped.get(key)

    if (!existing) {
      grouped.set(key, {
        key,
        stage: item.stage,
        signature,
        displayMessage: resolveDisplayMessage(item.message),
        count: 1,
        latestAt: item.createdAt,
        sampleFilePath: item.filePath,
        fileCount: item.filePath ? 1 : 0
      })

      const files = new Set<string>()
      if (item.filePath) {
        files.add(item.filePath)
      }
      groupedFiles.set(key, files)
      continue
    }

    existing.count += 1
    if (item.createdAt > existing.latestAt) {
      existing.latestAt = item.createdAt
    }

    const files = groupedFiles.get(key)
    if (files && item.filePath) {
      files.add(item.filePath)
      existing.fileCount = files.size
      existing.sampleFilePath = item.filePath
    }
  }

  return Array.from(grouped.values()).sort((left, right) => {
    if (right.latestAt !== left.latestAt) {
      return right.latestAt - left.latestAt
    }

    return right.count - left.count
  })
})

function resolveDisplayMessage(message: string): string {
  if (message.includes('Support for this compression format has not been built in')) {
    return 'HEIC/HEIF 编码插件缺失或不兼容，已触发解码失败。'
  }

  if (message.includes('Warning treated as error due to failOn setting')) {
    return '图像库将警告视为错误，导致缩略图构建中断。'
  }

  if (message.includes('bad seek to')) {
    return '文件内部索引损坏或不完整，读取偏移失败。'
  }

  const lineBreakIndex = message.indexOf('\n')
  if (lineBreakIndex > 0) {
    return message.slice(0, lineBreakIndex)
  }

  return message
}

function resolveMessageSignature(message: string): string {
  if (message.includes('Support for this compression format has not been built in')) {
    return 'heif-plugin-missing'
  }

  if (message.includes('Warning treated as error due to failOn setting')) {
    return 'sharp-warning-as-error'
  }

  if (message.includes('bad seek to')) {
    return 'heif-bad-seek'
  }

  const lineBreakIndex = message.indexOf('\n')
  if (lineBreakIndex > 0) {
    return message.slice(0, lineBreakIndex)
  }

  return message
}
</script>

<template>
  <div class="cute-panel flex h-full min-h-0 flex-col space-y-4 p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-900/50 dark:text-rose-300">
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5" />
        </div>
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">构建错误</h2>
      </div>
      <div class="flex items-center gap-2">
        <span class="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
          {{ groupedErrors.length }} 类 / {{ errors.length }} 条
        </span>
        <UTooltip :delay-duration="0" text="清空全部构建错误记录">
          <UButton class="cute-button" size="sm" color="rose" variant="soft" icon="i-lucide-trash-2" label="清空" @click="emit('clear')" />
        </UTooltip>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-rose-100/50 bg-rose-50/30 dark:border-rose-800/30 dark:bg-rose-900/10">
      <UTable
        :data="groupedErrors"
        :columns="columns"
        sticky="header"
        empty="暂无错误，一切运行正常 ✨"
        class="h-full"
      />
    </div>
  </div>
</template>
