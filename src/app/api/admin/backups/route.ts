import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { getBackupStatus } from '../../../../lib/backup-service'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

async function verifyAdmin(adminId: string | null) {
  if (!adminId) return null
  const admin = await adapter.getUserById(adminId)
  if (!admin || admin.username !== 'admin') return null
  return admin
}

// GET /api/admin/backups?adminId={adminId} - 获取备份列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    const admin = await verifyAdmin(adminId)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
    const status = getBackupStatus()

    const backups: any[] = []
    if (fs.existsSync(BACKUP_DIR)) {
      const entries = fs.readdirSync(BACKUP_DIR)
      for (const entry of entries) {
        const entryPath = path.join(BACKUP_DIR, entry)
        const stat = fs.statSync(entryPath)
        if (!stat.isDirectory()) continue
        if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) continue

        // 读取元数据
        const metaPath = path.join(entryPath, 'backup-meta.json')
        let meta: any = null
        if (fs.existsSync(metaPath)) {
          try {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
          } catch { /* ignore */ }
        }

        // 计算目录总大小
        let dirSize = 0
        let fileCount = 0
        for (const f of fs.readdirSync(entryPath)) {
          dirSize += fs.statSync(path.join(entryPath, f)).size
          fileCount++
        }

        backups.push({
          date: entry,
          path: entryPath,
          size: dirSize,
          fileCount,
          type: meta?.type || 'unknown',
          timestamp: meta?.timestamp || stat.mtime.toISOString(),
          env: meta?.env || meta?.envId || null,
          totalRecords: meta?.totalRecords || null,
          files: meta?.files?.map((f: any) => typeof f === 'string' ? f : f.name) || fs.readdirSync(entryPath),
        })
      }
    }

    // 按日期倒序
    backups.sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({
      status,
      backups,
      backupDir: BACKUP_DIR,
    })
  } catch (error: any) {
    console.error('Error fetching backups:', error)
    return NextResponse.json({ error: 'Failed to fetch backups', detail: error.message }, { status: 500 })
  }
}
