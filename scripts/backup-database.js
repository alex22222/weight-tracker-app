#!/usr/bin/env node

/**
 * L1 全量数据库备份脚本
 *
 * 用法:
 *   node scripts/backup-database.js
 *
 * 环境变量:
 *   DATABASE_URL          - 数据库文件路径 (默认: prisma/dev.db)
 *   BACKUP_DIR            - 备份存储目录 (默认: ./backups)
 *   BACKUP_RETENTION_DAYS - 保留天数 (默认: 30)
 *   NODE_ENV              - 环境 (production 时使用 CloudBase)
 *
 * 定时任务配置（每2天执行一次）:
 *   Cron: 0 3 * /2 * * cd /app && node scripts/backup-database.js >> logs/backup.log 2>&1
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ==================== 配置 ====================

const DB_PATH = (process.env.DATABASE_URL || 'file:./prisma/dev.db').replace('file:', '')
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10)
const IS_CLOUD_BASE = process.env.NODE_ENV === 'production'

// ==================== 工具函数 ====================

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function getTodayDir() {
  const today = new Date().toISOString().split('T')[0]
  const dir = path.join(BACKUP_DIR, today)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ==================== SQLite 备份 ====================

function backupSQLite() {
  console.log(`[${new Date().toISOString()}] Starting SQLite backup...`)
  console.log(`  Database: ${DB_PATH}`)

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found: ${DB_PATH}`)
  }

  const dailyDir = getTodayDir()
  const timestamp = getTimestamp()

  // 1. 复制数据库文件
  const dbBackupPath = path.join(dailyDir, `dev_${timestamp}.db`)
  fs.copyFileSync(DB_PATH, dbBackupPath)
  const dbSize = fs.statSync(dbBackupPath).size
  console.log(`  ✓ Database copy: ${dbBackupPath} (${formatBytes(dbSize)})`)

  // 2. 生成 SQL 转储
  const sqlDumpPath = path.join(dailyDir, `dev_${timestamp}.sql`)
  try {
    execSync(`sqlite3 "${DB_PATH}" .dump > "${sqlDumpPath}"`, { stdio: 'pipe' })
    const sqlSize = fs.statSync(sqlDumpPath).size
    console.log(`  ✓ SQL dump: ${sqlDumpPath} (${formatBytes(sqlSize)})`)
  } catch (e) {
    console.warn(`  ⚠ SQL dump failed: ${e.message}`)
  }

  // 3. 生成元数据
  const metaPath = path.join(dailyDir, 'backup-meta.json')
  const meta = {
    timestamp: new Date().toISOString(),
    type: 'sqlite',
    source: DB_PATH,
    files: [
      { name: path.basename(dbBackupPath), type: 'db-copy' },
      { name: path.basename(sqlDumpPath), type: 'sql-dump' },
    ],
  }
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
  console.log(`  ✓ Metadata: ${metaPath}`)

  return dailyDir
}

// ==================== CloudBase 备份 ====================

async function backupCloudBase() {
  console.log(`[${new Date().toISOString()}] Starting CloudBase backup...`)

  const tcb = require('@cloudbase/node-sdk')
  const envId = process.env.CLOUDBASE_ENV_ID

  if (!envId) {
    throw new Error('CLOUDBASE_ENV_ID not set')
  }

  const app = tcb.init({
    env: envId,
    secretId: process.env.CB_SECRET_ID,
    secretKey: process.env.CB_SECRET_KEY,
  })

  const db = app.database()
  const dailyDir = getTodayDir()

  const collections = [
    'users', 'weight_entries', 'user_settings', 'messages',
    'friends', 'fitness_channels', 'channel_members', 'check_ins',
    'channel_comments', 'leave_requests', 'goals', 'tasks',
    'task_members', 'task_check_ins', 'feedback',
    'verification_codes', 'book_recommendations',
    'diet_records', 'running_entries', 'cycling_entries',
    'reading_entries',
  ]

  let totalRecords = 0

  for (const collection of collections) {
    try {
      const allData = []
      const batchSize = 1000
      let offset = 0
      let hasMore = true

      while (hasMore) {
        const result = await db.collection(collection).limit(batchSize).skip(offset).get()
        const batch = result.data || []
        allData.push(...batch)
        hasMore = batch.length === batchSize
        offset += batchSize
      }

      const filePath = path.join(dailyDir, `${collection}.json`)
      fs.writeFileSync(filePath, JSON.stringify(allData, null, 2))
      totalRecords += allData.length

      console.log(`  ✓ ${collection}: ${allData.length} records`)
    } catch (e) {
      console.warn(`  ✗ ${collection}: ${e.message}`)
    }
  }

  const metaPath = path.join(dailyDir, 'backup-meta.json')
  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'cloudbase',
      envId,
      collections,
      totalRecords,
    }, null, 2)
  )
  console.log(`  ✓ Metadata: ${metaPath}`)
  console.log(`  Total records: ${totalRecords}`)

  return dailyDir
}

// ==================== 清理旧备份 ====================

function cleanupOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return

  const entries = fs.readdirSync(BACKUP_DIR)
  const now = new Date()
  const cutoffDate = new Date(now)
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

  let cleaned = 0

  for (const entry of entries) {
    const entryPath = path.join(BACKUP_DIR, entry)
    const stat = fs.statSync(entryPath)

    if (!stat.isDirectory()) continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) continue

    const entryDate = new Date(entry)
    if (entryDate >= cutoffDate) continue
    if (entry.endsWith('-01')) continue // 保留月度归档

    fs.rmSync(entryPath, { recursive: true, force: true })
    cleaned++
    console.log(`  ✓ Cleaned: ${entry}`)
  }

  if (cleaned > 0) {
    console.log(`  Cleaned ${cleaned} old backup(s) (retention: ${RETENTION_DAYS} days)`)
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('='.repeat(60))
  console.log('Weight Tracker L1 Full Backup')
  console.log(`Environment: ${IS_CLOUD_BASE ? 'CloudBase (Production)' : 'SQLite (Development)'}`)
  console.log(`Backup directory: ${BACKUP_DIR}`)
  console.log('='.repeat(60))

  try {
    const startTime = Date.now()

    if (IS_CLOUD_BASE) {
      await backupCloudBase()
    } else {
      backupSQLite()
    }

    cleanupOldBackups()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n[${new Date().toISOString()}] Backup completed in ${duration}s`)
    console.log('='.repeat(60))

    process.exit(0)
  } catch (error) {
    console.error(`\n[${new Date().toISOString()}] Backup failed:`)
    console.error(error.message)
    console.error('='.repeat(60))
    process.exit(1)
  }
}

main()
