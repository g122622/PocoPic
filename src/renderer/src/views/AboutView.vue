<template>
  <div class="flex h-full flex-col gap-3">
    <header class="rounded-3xl bg-white/70 px-5 py-3 shadow-sm backdrop-blur-md dark:bg-black/20">
      <h1 class="text-xl font-bold text-slate-700 dark:text-slate-100">关于</h1>
      <p class="text-xs text-slate-500 dark:text-slate-300">PocoPic · 本地离线超大媒体库相册。</p>
    </header>

    <div class="rounded-3xl bg-white/70 p-6 text-sm text-slate-600 shadow-sm backdrop-blur-md dark:bg-black/20 dark:text-slate-300">
      <p>核心特性：</p>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li>手动构建索引，支持暂停、继续、取消。</li>
        <li>元数据索引与缩略图数据库分离存储。</li>
        <li>多线程构建与虚拟列表渲染，适配大规模媒体库。</li>
        <li>按时间轴浏览、收藏与筛选。</li>
      </ul>
    </div>
  </div>
</template>
