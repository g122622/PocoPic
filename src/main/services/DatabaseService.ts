import Database from 'better-sqlite3'
import { dirname } from 'node:path'
import { promises as fs } from 'node:fs'
import type { BuildErrorItem, MediaItem, MediaQuery, MediaQueryResult } from '../../shared/types'

interface MediaRow {
  id: number
  file_path: string
  file_name: string
  media_type: 'image' | 'video'
  extension: string
  size_bytes: number
  width: number | null
  height: number | null
  duration_ms: number | null
  captured_at: number
  mtime_ms: number
  device_model: string | null
  gps_lat: number | null
  gps_lng: number | null
  thumbnail_path: string
  is_favorite: 0 | 1
  face_cluster_id: string | null
  location_name: string | null
  ai_tags: string | null
}

interface ErrorRow {
  id: number
  build_id: string
  file_path: string
  stage: 'scan' | 'metadata' | 'thumbnail' | 'db'
  message: string
  created_at: number
}

export class DatabaseService {
  private _db: Database.Database | null = null

  public async connect(dbPath: string): Promise<void> {
    await fs.mkdir(dirname(dbPath), { recursive: true })
    this._db = new Database(dbPath)
    this._applyPragma()
    this._initSchema()
  }

  public close(): void {
    if (this._db) {
      this._db.close()
      this._db = null
    }
  }

  public clearMediaAndErrors(): void {
    const db = this._requireDb()
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM media').run()
      db.prepare('DELETE FROM build_errors').run()
    })
    transaction()
  }

  public clearAllFavorites(): void {
    const db = this._requireDb()
    db.prepare('UPDATE media SET is_favorite = 0').run()
  }

  public saveMediaBatch(records: Array<Omit<MediaItem, 'id' | 'isFavorite' | 'faceClusterId' | 'locationName' | 'aiTags'>>): void {
    const db = this._requireDb()
    const stmt = db.prepare(`
      INSERT INTO media (
        file_path,
        file_name,
        media_type,
        extension,
        size_bytes,
        width,
        height,
        duration_ms,
        captured_at,
        mtime_ms,
        device_model,
        gps_lat,
        gps_lng,
        thumbnail_path,
        updated_at
      ) VALUES (
        @filePath,
        @fileName,
        @mediaType,
        @extension,
        @sizeBytes,
        @width,
        @height,
        @durationMs,
        @capturedAt,
        @mtimeMs,
        @deviceModel,
        @gpsLat,
        @gpsLng,
        @thumbnailPath,
        @updatedAt
      )
      ON CONFLICT(file_path) DO UPDATE SET
        file_name = excluded.file_name,
        media_type = excluded.media_type,
        extension = excluded.extension,
        size_bytes = excluded.size_bytes,
        width = excluded.width,
        height = excluded.height,
        duration_ms = excluded.duration_ms,
        captured_at = excluded.captured_at,
        mtime_ms = excluded.mtime_ms,
        device_model = excluded.device_model,
        gps_lat = excluded.gps_lat,
        gps_lng = excluded.gps_lng,
        thumbnail_path = excluded.thumbnail_path,
        updated_at = excluded.updated_at
    `)

    const now = Date.now()
    const transaction = db.transaction(() => {
      for (const record of records) {
        stmt.run({
          ...record,
          updatedAt: now
        })
      }
    })
    transaction()
  }

  public addBuildError(item: Omit<BuildErrorItem, 'id'>): void {
    const db = this._requireDb()
    db.prepare(
      'INSERT INTO build_errors (build_id, file_path, stage, message, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(item.buildId, item.filePath, item.stage, item.message, item.createdAt)
  }

  public queryBuildErrors(limit: number): BuildErrorItem[] {
    const db = this._requireDb()
    const rows = db
      .prepare('SELECT id, build_id, file_path, stage, message, created_at FROM build_errors ORDER BY id DESC LIMIT ?')
      .all(limit) as ErrorRow[]

    return rows.map((row) => ({
      id: row.id,
      buildId: row.build_id,
      filePath: row.file_path,
      stage: row.stage,
      message: row.message,
      createdAt: row.created_at
    }))
  }

  public clearBuildErrors(): void {
    const db = this._requireDb()
    db.prepare('DELETE FROM build_errors').run()
  }

  public queryMedia(query: MediaQuery): MediaQueryResult {
    const db = this._requireDb()
    const conditions: string[] = []
    const params: Array<string | number> = []

    if (query.keyword.trim().length > 0) {
      conditions.push('file_name LIKE ?')
      params.push(`%${query.keyword.trim()}%`)
    }

    if (query.startTime !== null) {
      conditions.push('captured_at >= ?')
      params.push(query.startTime)
    }

    if (query.endTime !== null) {
      conditions.push('captured_at <= ?')
      params.push(query.endTime)
    }

    if (query.favoritesOnly) {
      conditions.push('is_favorite = 1')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const totalRow = db.prepare(`SELECT COUNT(1) as total FROM media ${whereClause}`).get(...params) as {
      total: number
    }

    const rows = db
      .prepare(
        `
      SELECT
        id,
        file_path,
        file_name,
        media_type,
        extension,
        size_bytes,
        width,
        height,
        duration_ms,
        captured_at,
        mtime_ms,
        device_model,
        gps_lat,
        gps_lng,
        thumbnail_path,
        is_favorite,
        face_cluster_id,
        location_name,
        ai_tags
      FROM media
      ${whereClause}
      ORDER BY captured_at DESC, id DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(...params, query.limit, query.offset) as MediaRow[]

    return {
      total: totalRow.total,
      items: rows.map((row) => this._toMediaItem(row))
    }
  }

  public toggleFavorite(mediaId: number, isFavorite: boolean): void {
    const db = this._requireDb()
    const result = db.prepare('UPDATE media SET is_favorite = ? WHERE id = ?').run(isFavorite ? 1 : 0, mediaId)
    if (result.changes === 0) {
      throw new Error('未找到指定媒体，无法更新收藏状态。')
    }
  }

  private _toMediaItem(row: MediaRow): MediaItem {
    return {
      id: row.id,
      filePath: row.file_path,
      fileName: row.file_name,
      mediaType: row.media_type,
      extension: row.extension,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      durationMs: row.duration_ms,
      capturedAt: row.captured_at,
      mtimeMs: row.mtime_ms,
      deviceModel: row.device_model,
      gpsLat: row.gps_lat,
      gpsLng: row.gps_lng,
      thumbnailPath: row.thumbnail_path,
      isFavorite: row.is_favorite,
      faceClusterId: row.face_cluster_id,
      locationName: row.location_name,
      aiTags: row.ai_tags
    }
  }

  private _requireDb(): Database.Database {
    if (!this._db) {
      throw new Error('数据库尚未初始化，请先配置元数据索引路径。')
    }
    return this._db
  }

  private _applyPragma(): void {
    const db = this._requireDb()
    db.pragma('journal_mode = MEMORY')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = -5000')
    db.pragma('temp_store = MEMORY')
  }

  private _initSchema(): void {
    const db = this._requireDb()
    db.exec(`
      CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        media_type TEXT NOT NULL,
        extension TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        duration_ms INTEGER,
        captured_at INTEGER NOT NULL,
        mtime_ms INTEGER NOT NULL,
        device_model TEXT,
        gps_lat REAL,
        gps_lng REAL,
        thumbnail_path TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        face_cluster_id TEXT,
        location_name TEXT,
        ai_tags TEXT,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_media_captured_at ON media(captured_at);
      CREATE INDEX IF NOT EXISTS idx_media_file_name ON media(file_name);
      CREATE INDEX IF NOT EXISTS idx_media_favorite ON media(is_favorite);

      CREATE TABLE IF NOT EXISTS build_errors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        build_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        stage TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `)
  }
}
