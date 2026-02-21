# PocoPic

PocoPic 是一个面向超大规模媒体库（几十万级）的 Electron 桌面相册应用，支持图片/视频统一瀑布网格预览、时间轴排序、收藏夹、文件名与时间范围搜索。

## 技术栈

- Electron + TypeScript
- Vue 3 + Pinia
- Nuxt UI + Tailwind CSS
- SQLite（better-sqlite3）
- `worker_threads` 多线程构建
- 媒体处理：`sharp`、`ffmpeg-static` + `fluent-ffmpeg`、`exifr`

## 核心能力

1. 手动构建索引（不自动监听文件变更）
2. 元数据索引与缩略图分离存储，且路径可配置（缩略图固定存储为 `pocopic-thumb.db`）
3. 视频抽帧临时目录可配置，且为构建必填项
4. 构建状态实时可见：当前目录、当前文件、进度、成功/失败数量
5. 支持暂停、继续、取消构建
6. 构建错误列表展示，失败文件自动跳过继续处理
7. 画廊网格使用虚拟列表渲染，适配超大数据量
8. 双击缩略图使用系统默认方式打开原媒体文件
9. 收藏夹模式（不提供手动相册分组）
10. 支持深色模式与系统主题跟随
11. 设置项支持「构建时忽略位置数据」
12. 侧边栏路由（相册 / 设置 / 关于）
13. 右侧时间轴按年份聚合并可点击筛选

## 时间优先级

媒体时间按以下优先级决定：

1. EXIF / 媒体元数据时间
2. 文件修改时间（`mtime`）

所有时间字段统一使用 UNIX 毫秒级时间戳。

## 数据库性能参数

构建期间 SQLite 会设置：

- `PRAGMA journal_mode = MEMORY`
- `PRAGMA synchronous = NORMAL`
- `PRAGMA cache_size = -5000`
- `PRAGMA temp_store = MEMORY`

## 项目启动

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 类型检查

```bash
npm run typecheck
```

### 打包

```bash
npm run build:win
```

## 首次使用流程

1. 在设置里选择「元数据索引数据库路径」
2. 选择「缩略图目录」（程序会在该目录下创建 `pocopic-thumb.db`）
3. 选择「临时目录」（用于视频抽帧临时文件）
4. 添加至少一个扫描目录
5. 点击「开始构建」
6. 构建完成后进入 gallery 浏览

## 可扩展保留

数据库与类型结构已预留：

- 人脸聚类字段（`faceClusterId`）
- 地点名称字段（`locationName`）
- AI 标签字段（`aiTags`）

便于后续扩展人脸识别聚类、地图视图、AI 标签生成等能力。
