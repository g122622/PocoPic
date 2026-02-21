import { parentPort } from 'node:worker_threads'
import { createHash } from 'node:crypto'
import { basename, extname, join } from 'node:path'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import exifr from 'exifr'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import type { BuildTask, BuildTaskResult } from '../../shared/types'

if (!parentPort) {
  throw new Error('Worker 初始化失败，无法建立通信通道。')
}

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.heic',
  '.heif',
  '.avif',
  '.tif',
  '.tiff'
])

parentPort.on('message', async (task: BuildTask) => {
  try {
    const result = await processTask(task)
    parentPort?.postMessage(result)
  } catch (error) {
    parentPort?.postMessage({
      ok: false,
      record: null,
      thumbnailKey: null,
      thumbnailBytes: null,
      errorStage: 'metadata',
      errorMessage: error instanceof Error ? error.message : '未知错误'
    } satisfies BuildTaskResult)
  }
})

async function processTask(task: BuildTask): Promise<BuildTaskResult> {
  const stat = await fs.stat(task.filePath)
  const extension = extname(task.filePath).toLowerCase()
  const mediaType = IMAGE_EXTENSIONS.has(extension) ? 'image' : 'video'
  const exifInfo = await safeReadMetadata(task.filePath, task.ignoreLocationData)
  const capturedAt = resolveCaptureTime(exifInfo, stat.mtimeMs)

  const thumbnailKey = createHash('sha1').update(task.filePath).digest('hex')

  let width: number | null = null
  let height: number | null = null
  let thumbnailBytes: Buffer

  if (mediaType === 'image') {
    const metadata = await sharp(task.filePath).metadata()
    width = metadata.width ?? null
    height = metadata.height ?? null

    thumbnailBytes = await sharp(task.filePath)
      .rotate()
      .resize(task.thumbnailSize, task.thumbnailSize, {
        fit: 'cover',
        position: 'attention'
      })
      .webp({ quality: task.thumbnailQuality })
      .toBuffer()
  } else {
    const tempFramePath = join(tmpdir(), `pocopic-frame-${Date.now()}-${Math.random()}.jpg`)
    try {
      await extractVideoFrame(task.filePath, tempFramePath)
      const metadata = await sharp(tempFramePath).metadata()
      width = metadata.width ?? null
      height = metadata.height ?? null

      thumbnailBytes = await sharp(tempFramePath)
        .resize(task.thumbnailSize, task.thumbnailSize, {
          fit: 'cover',
          position: 'centre'
        })
        .webp({ quality: task.thumbnailQuality })
        .toBuffer()
    } catch (error) {
      return {
        ok: false,
        record: null,
        thumbnailKey: null,
        thumbnailBytes: null,
        errorStage: 'thumbnail',
        errorMessage: error instanceof Error ? error.message : `视频缩略图失败: ${basename(task.filePath)}`
      }
    } finally {
      await fs.rm(tempFramePath, { force: true })
    }
  }

  return {
    ok: true,
    thumbnailKey,
    thumbnailBytes,
    errorStage: null,
    errorMessage: '',
    record: {
      filePath: task.filePath,
      fileName: basename(task.filePath),
      mediaType,
      extension,
      sizeBytes: stat.size,
      width,
      height,
      durationMs: null,
      capturedAt,
      mtimeMs: stat.mtimeMs,
      deviceModel: toStringOrNull((exifInfo as Record<string, unknown>)?.Model),
      gpsLat: task.ignoreLocationData ? null : toNumberOrNull((exifInfo as Record<string, unknown>)?.latitude),
      gpsLng: task.ignoreLocationData ? null : toNumberOrNull((exifInfo as Record<string, unknown>)?.longitude),
      thumbnailPath: thumbnailKey
    }
  }
}

async function safeReadMetadata(filePath: string, ignoreLocationData: boolean): Promise<unknown> {
  try {
    return await exifr.parse(filePath, {
      tiff: true,
      exif: true,
      gps: !ignoreLocationData,
      pick: [
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'CreationDate',
        'creation_time',
        'Model',
        'latitude',
        'longitude'
      ]
    })
  } catch {
    return {}
  }
}

function resolveCaptureTime(metadata: unknown, fallbackMtimeMs: number): number {
  const info =
    metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : ({} as Record<string, unknown>)

  const orderedCandidates = [
    info.DateTimeOriginal,
    info.CreateDate,
    info.CreationDate,
    info.creation_time,
    info.ModifyDate
  ]

  for (const candidate of orderedCandidates) {
    const timestamp = parseDateLike(candidate)
    if (timestamp !== null) {
      return timestamp
    }
  }

  return fallbackMtimeMs
}

function parseDateLike(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const timestamp = new Date(value).getTime()
    if (Number.isFinite(timestamp)) {
      return timestamp
    }
  }

  return null
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }
  return null
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return null
}

async function extractVideoFrame(filePath: string, outputPath: string): Promise<void> {
  return await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .inputOptions(['-hide_banner'])
      .outputOptions(['-y', '-vf', 'select=eq(pict_type\\,I)', '-frames:v', '1'])
      .output(outputPath)
      .on('end', () => {
        resolve()
      })
      .on('error', (error) => {
        reject(error)
      })
      .run()
  })
}
