import { EventEmitter } from 'node:events'
import { Worker } from 'node:worker_threads'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { AppSettings, BuildErrorItem, BuildStatus, BuildTask, BuildTaskResult } from '../../shared/types'
import { MediaScannerService } from './MediaScannerService'
import { DatabaseService } from './DatabaseService'
import { ThumbnailDatabaseService } from './ThumbnailDatabaseService'

interface WorkerSlot {
  worker: Worker
  busy: boolean
  task: BuildTask | null
}

export class BuildService extends EventEmitter {
  private readonly _scannerService: MediaScannerService
  private readonly _databaseService: DatabaseService
  private readonly _thumbnailDatabaseService: ThumbnailDatabaseService

  private _status: BuildStatus = this._createIdleStatus()
  private _queue: BuildTask[] = []
  private _workers: WorkerSlot[] = []
  private _paused = false
  private _cancelled = false
  private _recordsBuffer: Array<BuildTaskResult['record']> = []

  public constructor(
    scannerService: MediaScannerService,
    databaseService: DatabaseService,
    thumbnailDatabaseService: ThumbnailDatabaseService
  ) {
    super()
    this._scannerService = scannerService
    this._databaseService = databaseService
    this._thumbnailDatabaseService = thumbnailDatabaseService
  }

  public getStatus(): BuildStatus {
    return this._status
  }

  public async startBuild(settings: AppSettings): Promise<void> {
    if (this._status.state === 'running' || this._status.state === 'scanning' || this._status.state === 'paused') {
      throw new Error('当前已有构建任务在执行，请先暂停或取消当前任务。')
    }

    if (!settings.indexDbPath || !settings.thumbnailDir) {
      throw new Error('请先设置元数据索引路径与缩略图目录。')
    }

    if (settings.sourceDirs.length === 0) {
      throw new Error('请至少配置一个扫描目录。')
    }

    this._paused = false
    this._cancelled = false
    this._queue = []
    this._workers = []
    this._recordsBuffer = []
    const buildId = randomUUID()

    this._status = {
      buildId,
      state: 'scanning',
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentDirectory: '',
      currentFile: '',
      startedAt: Date.now(),
      endedAt: 0
    }
    this._emitStatus()

    void this._runBuild(settings).catch((error) => {
      this._status = {
        ...this._status,
        state: 'failed',
        endedAt: Date.now()
      }
      this._emitStatus()
      this.emit('fatal', error instanceof Error ? error.message : '构建失败')
    })
  }

  public pauseBuild(): void {
    if (this._status.state !== 'running') {
      return
    }

    this._paused = true
    this._status = {
      ...this._status,
      state: 'paused'
    }
    this._emitStatus()
  }

  public resumeBuild(): void {
    if (this._status.state !== 'paused') {
      return
    }

    this._paused = false
    this._status = {
      ...this._status,
      state: 'running'
    }
    this._emitStatus()
    this._dispatchTasks()
  }

  public async cancelBuild(): Promise<void> {
    if (this._status.state === 'idle' || this._status.state === 'completed' || this._status.state === 'cancelled') {
      return
    }

    this._cancelled = true
    this._paused = false
    this._queue = []

    await this._terminateWorkers()

    this._status = {
      ...this._status,
      state: 'cancelled',
      endedAt: Date.now(),
      currentDirectory: '',
      currentFile: ''
    }
    this._emitStatus()
  }

  private async _runBuild(settings: AppSettings): Promise<void> {
    const scannedFiles = await this._scannerService.scan(
      settings.sourceDirs,
      (directory, file) => {
        this._status = {
          ...this._status,
          currentDirectory: directory,
          currentFile: file
        }
        this._emitStatus()
      },
      () => this._cancelled
    )

    if (this._cancelled) {
      return
    }

    this._databaseService.clearMediaAndErrors()
    this._thumbnailDatabaseService.clearThumbnails()

    this._queue = scannedFiles.map((filePath) => ({
      filePath,
      thumbnailSize: settings.thumbnailSize,
      thumbnailQuality: settings.thumbnailQuality,
      ignoreLocationData: settings.ignoreLocationData
    }))

    this._status = {
      ...this._status,
      state: 'running',
      total: this._queue.length,
      currentDirectory: '',
      currentFile: ''
    }
    this._emitStatus()

    await this._spawnWorkers(settings.workerCount)

    await new Promise<void>((resolve) => {
      this.once('all-done', () => resolve())
      this._dispatchTasks()
    })

    if (this._cancelled) {
      return
    }

    this._flushRecordsBuffer()
    await this._terminateWorkers()

    this._status = {
      ...this._status,
      state: 'completed',
      endedAt: Date.now(),
      currentDirectory: '',
      currentFile: ''
    }
    this._emitStatus()
  }

  private async _spawnWorkers(workerCount: number): Promise<void> {
    const count = Math.max(1, workerCount)
    const workerPath = join(__dirname, 'workers', 'MediaBuildWorker.js')

    for (let index = 0; index < count; index += 1) {
      const worker = new Worker(workerPath)
      const slot: WorkerSlot = {
        worker,
        busy: false,
        task: null
      }

      worker.on('message', (result: BuildTaskResult) => {
        this._onWorkerResult(slot, result)
      })

      worker.on('error', (error) => {
        this._onWorkerError(slot, error)
      })

      this._workers.push(slot)
    }
  }

  private _dispatchTasks(): void {
    if (this._paused || this._cancelled || this._status.state === 'completed') {
      return
    }

    for (const slot of this._workers) {
      if (slot.busy) {
        continue
      }

      const nextTask = this._queue.shift()
      if (!nextTask) {
        break
      }

      slot.busy = true
      slot.task = nextTask
      this._status = {
        ...this._status,
        currentDirectory: dirname(nextTask.filePath),
        currentFile: nextTask.filePath
      }
      this._emitStatus()
      slot.worker.postMessage(nextTask)
    }

    this._checkAllDone()
  }

  private _onWorkerResult(slot: WorkerSlot, result: BuildTaskResult): void {
    if (this._cancelled) {
      return
    }

    const currentTask = slot.task
    slot.busy = false
    slot.task = null

    this._status = {
      ...this._status,
      processed: this._status.processed + 1
    }

    if (result.ok && result.record) {
      this._status = {
        ...this._status,
        succeeded: this._status.succeeded + 1
      }

      if (!result.thumbnailKey || !result.thumbnailBytes) {
        this._status = {
          ...this._status,
          succeeded: this._status.succeeded - 1,
          failed: this._status.failed + 1
        }
        const errorItem: Omit<BuildErrorItem, 'id'> = {
          buildId: this._status.buildId,
          filePath: currentTask?.filePath ?? '',
          stage: 'thumbnail',
          message: '缩略图构建结果缺少二进制数据。',
          createdAt: Date.now()
        }
        this._databaseService.addBuildError(errorItem)
        this.emit('error-item', errorItem)
      } else {
        this._thumbnailDatabaseService.upsertThumbnail(result.thumbnailKey, Buffer.from(result.thumbnailBytes))
        this._recordsBuffer.push(result.record)
        if (this._recordsBuffer.length >= 100) {
          this._flushRecordsBuffer()
        }
      }
    } else {
      this._status = {
        ...this._status,
        failed: this._status.failed + 1
      }
      const errorItem: Omit<BuildErrorItem, 'id'> = {
        buildId: this._status.buildId,
        filePath: currentTask?.filePath ?? '',
        stage: result.errorStage ?? 'metadata',
        message: result.errorMessage,
        createdAt: Date.now()
      }
      this._databaseService.addBuildError(errorItem)
      this.emit('error-item', errorItem)
    }

    this._emitStatus()
    this._dispatchTasks()
  }

  private _onWorkerError(slot: WorkerSlot, error: Error): void {
    if (this._cancelled) {
      return
    }

    const failedTaskPath = slot.task?.filePath ?? ''
    slot.busy = false
    slot.task = null

    this._status = {
      ...this._status,
      processed: this._status.processed + 1,
      failed: this._status.failed + 1
    }

    const errorItem: Omit<BuildErrorItem, 'id'> = {
      buildId: this._status.buildId,
      filePath: failedTaskPath,
      stage: 'metadata',
      message: error.message,
      createdAt: Date.now()
    }

    this._databaseService.addBuildError(errorItem)
    this.emit('error-item', errorItem)
    this._emitStatus()
    this._dispatchTasks()
  }

  private _flushRecordsBuffer(): void {
    if (this._recordsBuffer.length === 0) {
      return
    }

    const records = this._recordsBuffer.filter(
      (record): record is NonNullable<BuildTaskResult['record']> => record !== null
    )
    this._recordsBuffer = []
    if (records.length > 0) {
      this._databaseService.saveMediaBatch(records)
    }
  }

  private _checkAllDone(): void {
    if (this._queue.length > 0) {
      return
    }

    for (const slot of this._workers) {
      if (slot.busy) {
        return
      }
    }

    this.emit('all-done')
  }

  private async _terminateWorkers(): Promise<void> {
    const allWorkers = this._workers.map((slot) => slot.worker.terminate())
    await Promise.allSettled(allWorkers)
    this._workers = []
  }

  private _emitStatus(): void {
    this.emit('status', this._status)
  }

  private _createIdleStatus(): BuildStatus {
    return {
      buildId: '',
      state: 'idle',
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentDirectory: '',
      currentFile: '',
      startedAt: 0,
      endedAt: 0
    }
  }
}
