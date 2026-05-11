/**
 * L1 全量数据库备份服务
 *
 * 支持 SQLite（开发环境）和 CloudBase NoSQL（生产环境）
 * 通过定时任务每2天自动执行
 */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// ==================== 配置 ====================

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'prisma', 'dev.db')
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10)

// CloudBase 集合列表
export const CLOUDBASE_COLLECTIONS = [
  'users',
  'weight_entries',
  'user_settings',
  'messages',
  'friends',
  'fitness_channels',
  'channel_members',
  'check_ins',
  'channel_comments',
  'leave_requests',
  'goals',
  'tasks',
  'task_members',
  'task_check_ins',
  'feedback',
  'verification_codes',
  'book_recommendations',
  'diet_records',
  'running_entries',
  'cycling_entries',
  'reading_entries',
] as const

export type CollectionName = (typeof CLOUDBASE_COLLECTIONS)[number]

// ==================== 工具函数 ====================

function ensureBackupDir(): string {
  const today = new Date().toISOString().split('T')[0]
  const dailyDir = path.join(BACKUP_DIR, today)
  if (!fs.existsSync(dailyDir)) {
    fs.mkdirSync(dailyDir, { recursive: true })
  }
  return dailyDir
}

function getTimestampedFilename(prefix: string, ext: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${prefix}_${timestamp}.${ext}`
}

// ==================== 清理过期备份 ====================

export async function cleanupOldBackups(): Promise<void> {
  if (!fs.existsSync(BACKUP_DIR)) return

  const entries = fs.readdirSync(BACKUP_DIR)
  const now = new Date()
  const cutoffDate = new Date(now)
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

  for (const entry of entries) {
    const entryPath = path.join(BACKUP_DIR, entry)
    const stat = fs.statSync(entryPath)

    if (!stat.isDirectory()) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) continue

    const entryDate = new Date(entry)
    if (entryDate >= cutoffDate) continue
    if (entry.endsWith('-01')) continue // 保留每月1号归档

    fs.rmSync(entryPath, { recursive: true, force: true })
    console.log(`[Backup] Cleaned up old backup: ${entry}`)
  }
}

// ==================== 全量备份 ====================

export interface FullBackupResult {
  success: boolean
  backupPath?: string
  sqlDumpPath?: string
  error?: string
  timestamp: string
}

async function backupSQLite(): Promise<FullBackupResult> {
  const timestamp = new Date().toISOString()
  const dailyDir = ensureBackupDir()

  try {
    // 1. 复制数据库文件
    const dbBackupPath = path.join(dailyDir, getTimestampedFilename('dev', 'db'))
    fs.copyFileSync(DB_PATH, dbBackupPath)

    // 2. 生成 SQL 转储
    const sqlDumpPath = path.join(dailyDir, getTimestampedFilename('dev', 'sql'))
    await execAsync(`sqlite3 "${DB_PATH}" .dump > "${sqlDumpPath}"`)

    // 3. 生成元数据
    const metaPath = path.join(dailyDir, 'backup-meta.json')
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          timestamp,
          type: 'sqlite',
          source: DB_PATH,
          files: [
            { name: path.basename(dbBackupPath), type: 'db-copy', size: fs.statSync(dbBackupPath).size },
            { name: path.basename(sqlDumpPath), type: 'sql-dump', size: fs.statSync(sqlDumpPath).size },
          ],
        },
        null,
        2
      )
    )

    console.log(`[Backup] SQLite backup completed: ${dailyDir}`)
    return { success: true, backupPath: dbBackupPath, sqlDumpPath, timestamp }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[Backup] SQLite backup failed:', errMsg)
    return { success: false, error: errMsg, timestamp }
  }
}

async function backupCloudBase(): Promise<FullBackupResult> {
  const timestamp = new Date().toISOString()
  const dailyDir = ensureBackupDir()

  try {
    const { db } = await import('./cloudbase')
    const backupFiles: string[] = []
    let totalRecords = 0

    for (const collection of CLOUDBASE_COLLECTIONS) {
      try {
        const allData: any[] = []
        const batchSize = 1000
        let offset = 0
        let hasMore = true

        while (hasMore) {
          const result = await db
            .collection(collection)
            .limit(batchSize)
            .skip(offset)
            .get()

          const batch = result.data || []
          allData.push(...batch)
          hasMore = batch.length === batchSize
          offset += batchSize
        }

        const filePath = path.join(dailyDir, `${collection}.json`)
        fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf-8')
        backupFiles.push(filePath)
        totalRecords += allData.length

        console.log(`[Backup] ${collection}: ${allData.length} records`)
      } catch (e: any) {
        console.warn(`[Backup] Failed to backup "${collection}": ${e.message}`)
      }
    }

    const metaPath = path.join(dailyDir, 'backup-meta.json')
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          timestamp,
          type: 'cloudbase',
          collections: CLOUDBASE_COLLECTIONS,
          totalRecords,
          files: backupFiles.map((f) => path.basename(f)),
          env: process.env.CLOUDBASE_ENV_ID || 'unknown',
        },
        null,
        2
      )
    )

    console.log(`[Backup] CloudBase backup completed: ${dailyDir} (${totalRecords} total records)`)
    return { success: true, backupPath: dailyDir, timestamp }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('[Backup] CloudBase backup failed:', errMsg)
    return { success: false, error: errMsg, timestamp }
  }
}

/**
 * 执行全量备份（自动判断环境）
 */
export async function performFullBackup(): Promise<FullBackupResult> {
  const isCloudBase = process.env.NODE_ENV === 'production' || !!process.env.CLOUDBASE_ENV_ID
  return isCloudBase ? backupCloudBase() : backupSQLite()
}

// ==================== 备份状态查询 ====================

export interface BackupStatus {
  lastBackupAt: string | null
  lastBackupPath: string | null
  totalBackups: number
  totalSizeBytes: number
  oldestBackupAt: string | null
}

export function getBackupStatus(): BackupStatus {
  if (!fs.existsSync(BACKUP_DIR)) {
    return { lastBackupAt: null, lastBackupPath: null, totalBackups: 0, totalSizeBytes: 0, oldestBackupAt: null }
  }

  const backupDirs = fs
    .readdirSync(BACKUP_DIR)
    .map((e) => {
      const p = path.join(BACKUP_DIR, e)
      const stat = fs.statSync(p)
      return { name: e, path: p, date: stat.mtime, isDir: stat.isDirectory() }
    })
    .filter((e) => e.isDir && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  let totalSize = 0
  for (const dir of backupDirs) {
    for (const f of fs.readdirSync(dir.path)) {
      totalSize += fs.statSync(path.join(dir.path, f)).size
    }
  }

  return {
    lastBackupAt: backupDirs[0]?.date.toISOString() || null,
    lastBackupPath: backupDirs[0]?.path || null,
    totalBackups: backupDirs.length,
    totalSizeBytes: totalSize,
    oldestBackupAt: backupDirs[backupDirs.length - 1]?.date.toISOString() || null,
  }
}
