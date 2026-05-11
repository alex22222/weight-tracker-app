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

// GET /api/admin/backups/download?adminId={adminId}&date={YYYY-MM-DD}&file={filename}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const date = searchParams.get('date')
    const file = searchParams.get('file')

    const admin = await verifyAdmin(adminId)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!date || !file) {
      return NextResponse.json({ error: 'Missing date or file parameter' }, { status: 400 })
    }

    // 安全检查：只允许下载 backups 目录下的文件
    const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
    const filePath = path.resolve(path.join(BACKUP_DIR, date, file))
    const resolvedBackupDir = path.resolve(BACKUP_DIR)

    if (!filePath.startsWith(resolvedBackupDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const stat = fs.statSync(filePath)
    if (!stat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 })
    }

    const content = fs.readFileSync(filePath)
    const ext = path.extname(file).toLowerCase()

    const contentTypeMap: Record<string, string> = {
      '.json': 'application/json',
      '.sql': 'text/plain',
      '.db': 'application/octet-stream',
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentTypeMap[ext] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file}"`,
        'Content-Length': String(stat.size),
      },
    })
  } catch (error: any) {
    console.error('Error downloading backup:', error)
    return NextResponse.json({ error: 'Failed to download backup', detail: error.message }, { status: 500 })
  }
}
