import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../../lib/db-adapter'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

async function verifyAdmin(adminId: string | null) {
  if (!adminId) return null
  const admin = await adapter.getUserById(adminId)
  if (!admin || admin.username !== 'admin') return null
  return admin
}

// POST /api/admin/backups/restore - 触发数据库还原
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, date, confirm } = body

    const admin = await verifyAdmin(adminId)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!date) {
      return NextResponse.json({ error: 'Missing backup date' }, { status: 400 })
    }

    const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
    const backupPath = path.resolve(path.join(BACKUP_DIR, date))
    const resolvedBackupDir = path.resolve(BACKUP_DIR)

    if (!backupPath.startsWith(resolvedBackupDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    // 读取元数据判断备份类型
    const metaPath = path.join(backupPath, 'backup-meta.json')
    let backupType = 'sqlite'
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        backupType = meta.type || 'sqlite'
      } catch { /* ignore */ }
    }

    // 不支持 CloudBase 通过此 API 还原（需要 CLI 工具）
    if (backupType === 'cloudbase') {
      return NextResponse.json({
        error: 'CloudBase restore must be done via CLI. Run: NODE_ENV=production CLOUDBASE_ENV_ID=xxx CB_SECRET_ID=xxx CB_SECRET_KEY=xxx node scripts/restore-database.js ' + backupPath + ' --cloudbase',
      }, { status: 400 })
    }

    // SQLite 还原
    const DB_PATH = (process.env.DATABASE_URL || 'file:./prisma/dev.db').replace('file:', '')

    // 1. 先备份当前数据库
    const currentBackup = `${DB_PATH}.pre-restore-${Date.now()}`
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, currentBackup)
    }

    // 2. 查找 .db 备份文件
    const dbFiles = fs.readdirSync(backupPath).filter(f => f.endsWith('.db'))
    if (dbFiles.length === 0) {
      return NextResponse.json({ error: 'No .db file found in backup' }, { status: 400 })
    }

    const sourceDb = path.join(backupPath, dbFiles[0])
    fs.copyFileSync(sourceDb, DB_PATH)

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully',
      from: date,
      sourceFile: dbFiles[0],
      currentDbBackup: path.basename(currentBackup),
    })
  } catch (error: any) {
    console.error('Error restoring backup:', error)
    return NextResponse.json({ error: 'Failed to restore backup', detail: error.message }, { status: 500 })
  }
}
