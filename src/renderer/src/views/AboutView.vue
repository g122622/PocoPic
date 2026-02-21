<script setup lang="ts">
import appLogo from '@renderer/assets/logo.png'
</script>

<template>
  <div class="flex h-full flex-col gap-4">
    <header class="cute-panel px-6 py-4 flex items-center gap-4">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 to-blue-300 text-white shadow-md shadow-sky-200/50">
        <UIcon name="i-lucide-info" class="h-6 w-6" />
      </div>
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">关于</h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">PocoPic · 本地离线超大媒体库相册。</p>
      </div>
    </header>

    <div class="cute-panel p-8 flex flex-col items-center justify-center flex-1">
        <img :src="appLogo" alt="PocoPic" class="w-45 object-contain mb-10" />

      <h2 class="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">PocoPic</h2>
      <p class="text-slate-500 dark:text-slate-400 font-medium mb-8">可爱极简风 · 超大图库 · 手动构建索引</p>

      <div class="w-full max-w-2xl rounded-3xl bg-slate-50/50 p-8 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-500 dark:bg-emerald-900/50 dark:text-emerald-300">
            <UIcon name="i-lucide-sparkles" class="h-5 w-5" />
          </div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">核心特性</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
              <UIcon name="i-lucide-play-circle" class="h-4 w-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">手动构建索引</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">支持暂停、继续、取消，完全掌控构建过程。</p>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500 dark:bg-violet-900/30 dark:text-violet-400">
              <UIcon name="i-lucide-database" class="h-4 w-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">分离存储</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">元数据索引与缩略图数据库分离存储，更高效。</p>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400">
              <UIcon name="i-lucide-zap" class="h-4 w-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">高性能渲染</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">多线程构建与虚拟列表渲染，轻松适配大规模媒体库。</p>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400">
              <UIcon name="i-lucide-calendar-heart" class="h-4 w-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">便捷浏览</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">支持按时间轴浏览、收藏与多条件筛选。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
