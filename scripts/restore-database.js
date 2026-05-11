#!/usr/bin/env node

/**
 * 数据库恢复脚本
 * 
 * 用法:
 *   node scripts/restore-database.js <备份目录> [选项]
 * 
 * 示例:
 *   # 从最新备份恢复
 *   node scripts/restore-database.js backups/2026-05-11
 * 
 *   # 从 SQL 转储恢复（SQLite）
 *   node scripts/restore-database.js backups/2026-05-11/dev_xxx.sql --from-sql
 * 
 *   # 恢复到 CloudBase
 *   node scripts/restore-database.js backups/2026-05-11 --cloudbase
 * 
 * 环境变量:
 *   DATABASE_URL          - 目标数据库路径 (默认: prisma/dev.db)
 *   CLOUDBASE_ENV_ID      - CloudBase 环境 ID
 *   CB_SECRET_ID          - 腾讯云 API 密钥 ID
 *   CB_SECRET_KEY         - 腾讯云 API 密钥 Key
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const readline = require('readline')

// ==================== 配置 ====================

const DB_PATH = (process.env.DATABASE_URL || 'file:./prisma/dev.db').replace('file:', '')
const args = process.argv.slice(2)

// ==================== 工具函数 ====================

function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'yes')
    })
  })
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ==================== SQLite 恢复 ====================

async function restoreSQLite(backupPath, fromSql = false) {
  console.log(`\n[SQLite] Restoring from: ${backupPath}`)
  console.log(`  Target: ${DB_PATH}`)

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup not found: ${backupPath}`)
  }

  // 确认恢复
  const confirmed = await confirm(
    `WARNING: This will OVERWRITE the current database at ${DB_PATH}. Continue?`
  )
  if (!confirmed) {
    console.log('Restore cancelled.')
    return
  }

  // 备份当前数据库
  if (fs.existsSync(DB_PATH)) {
    const currentBackup = `${DB_PATH}.backup-${Date.now()}`
    fs.copyFileSync(DB_PATH, currentBackup)
    console.log(`  Current DB backed up to: ${currentBackup}`)
  }

  if (fromSql) {
    // 从 SQL 转储恢复
    fs.unlinkSync(DB_PATH)
    execSync(`sqlite3 "${DB_PATH}" < "${backupPath}"`, { stdio: 'inherit' })
    console.log('  ✓ Restored from SQL dump')
  } else {
    // 从数据库文件复制恢复
    const dbFiles = fs.readdirSync(backupPath).filter(f => f.endsWith('.db'))
    if (dbFiles.length === 0) {
      throw new Error('No .db file found in backup directory')
    }

    const sourceDb = path.join(backupPath, dbFiles[0])
    fs.copyFileSync(sourceDb, DB_PATH)
    console.log(`  ✓ Restored from: ${sourceDb}`)
  }

  const size = fs.statSync(DB_PATH).size
  console.log(`  Database size: ${formatBytes(size)}`)
}

// ==================== CloudBase 恢复 ====================

async function restoreCloudBase(backupPath) {
  console.log(`\n[CloudBase] Restoring from: ${backupPath}`)

  const envId = process.env.CLOUDBASE_ENV_ID
  if (!envId) {
    throw new Error('CLOUDBASE_ENV_ID not set')
  }

  const tcb = require('@cloudbase/node-sdk')
  const app = tcb.init({
    env: envId,
    secretId: process.env.CB_SECRET_ID,
    secretKey: process.env.CB_SECRET_KEY,
  })

  const db = app.database()

  // 确认恢复
  const confirmed = await confirm(
    `WARNING: This will OVERWRITE data in CloudBase environment "${envId}". Continue?`
  )
  if (!confirmed) {
    console.log('Restore cancelled.')
    return
  }

  const metaPath = path.join(backupPath, 'backup-meta.json')
  let meta = null
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    console.log(`  Backup time: ${meta.timestamp}`)
    console.log(`  Collections: ${meta.collections?.join(', ') || 'unknown'}`)
  }

  const collections = meta?.collections || [
    'users', 'weight_entries', 'user_settings', 'messages',
    'friends', 'fitness_channels', 'channel_members', 'check_ins',
  ]

  for (const collection of collections) {
    const filePath = path.join(backupPath, `${collection}.json`)
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Skipping ${collection}: file not found`)
      continue
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`  → ${collection}: 0 records`)
      continue
    }

    console.log(`  Restoring ${collection}: ${data.length} records...`)

    // 先清空集合（谨慎操作）
    try {
      const existing = await db.collection(collection).limit(1).get()
      if (existing.data.length > 0) {
        const deleteConfirmed = await confirm(
          `  Collection "${collection}" has existing data. Delete before restore?`
        )
        if (deleteConfirmed) {
          // 批量删除（CloudBase 限制每次最多 100 条）
          let deleted = 0
          while (true) {
            const batch = await db.collection(collection).limit(100).get()
            if (batch.data.length === 0) break
            for (const doc of batch.data) {
              await db.collection(collection).doc(doc._id).delete()
              deleted++
            }
          }
          console.log(`    Cleared ${deleted} existing records`)
        }
      }
    } catch (e) {
      console.warn(`    Warning during cleanup: ${e.message}`)
    }

    // 批量写入
    const batchSize = 100
    let inserted = 0
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      try {
        await db.collection(collection).add(batch)
        inserted += batch.length
      } catch (e) {
        console.warn(`    Batch insert failed: ${e.message}`)
      }
    }

    console.log(`  ✓ ${collection}: ${inserted}/${data.length} records restored`)
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log('='.repeat(60))
  console.log('Weight Tracker Database Restore')
  console.log('='.repeat(60))

  if (args.length === 0) {
    console.log('\nUsage:')
    console.log('  node scripts/restore-database.js <backup-path> [options]')
    console.log('\nOptions:')
    console.log('  --from-sql    Restore from SQL dump file (SQLite only)')
    console.log('  --cloudbase   Restore to CloudBase (instead of SQLite)')
    console.log('\nExamples:')
    console.log('  node scripts/restore-database.js backups/2026-05-11')
    console.log('  node scripts/restore-database.js backups/2026-05-11/dev_xxx.sql --from-sql')
    console.log('  node scripts/restore-database.js backups/2026-05-11 --cloudbase')
    process.exit(1)
  }

  const backupPath = path.resolve(args[0])
  const fromSql = args.includes('--from-sql')
  const toCloudBase = args.includes('--cloudbase')

  try {
    if (toCloudBase) {
      await restoreCloudBase(backupPath)
    } else {
      await restoreSQLite(backupPath, fromSql)
    }

    console.log('\n✓ Restore completed successfully')
    console.log('='.repeat(60))
    process.exit(0)
  } catch (error) {
    console.error('\n✗ Restore failed:')
    console.error(error.message)
    console.error('='.repeat(60))
    process.exit(1)
  }
}

main()
