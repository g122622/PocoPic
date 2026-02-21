import Database from 'better-sqlite3'
import { dirname } from 'node:path'
import { promises as fs } from 'node:fs'

export class ThumbnailDatabaseService {
  private _db: Database.Database | null = null
  private _dbPath = ''

  public async connect(dbPath: string): Promise<void> {
    await fs.mkdir(dirname(dbPath), { recursive: true })
    this._dbPath = dbPath
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

  public getDatabasePath(): string {
    return this._dbPath
  }

  public upsertThumbnail(thumbnailKey: string, imageWebp: Buffer): void {
    const db = this._requireDb()
    db.prepare(
      `
      INSERT INTO thumbnails (thumbnail_key, image_webp, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(thumbnail_key) DO UPDATE SET
        image_webp = excluded.image_webp,
        updated_at = excluded.updated_at
    `
    ).run(thumbnailKey, imageWebp, Date.now())
  }

  public getThumbnail(thumbnailKey: string): Buffer | null {
    const db = this._requireDb()
    const row = db.prepare('SELECT image_webp FROM thumbnails WHERE thumbnail_key = ?').get(thumbnailKey) as
      | { image_webp: Buffer }
      | undefined

    if (!row) {
      return null
    }

    return row.image_webp
  }

  public clearThumbnails(): void {
    const db = this._requireDb()
    db.prepare('DELETE FROM thumbnails').run()
  }

  private _requireDb(): Database.Database {
    if (!this._db) {
      throw new Error('缩略图数据库尚未初始化，请先设置缩略图目录。')
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
      CREATE TABLE IF NOT EXISTS thumbnails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thumbnail_key TEXT NOT NULL UNIQUE,
        image_webp BLOB NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_thumbnails_key ON thumbnails(thumbnail_key);
    `)
  }
}
