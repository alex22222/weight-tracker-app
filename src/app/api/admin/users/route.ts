import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { prisma } from '../../../../lib/db'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/admin/users?adminId={adminId} - 获取所有用户列表（仅 admin）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 401 })
    }

    // 验证是否是 admin
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(adminId) },
    })

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 获取所有用户（排除 admin 自己）
    const users = await prisma.user.findMany({
      where: {
        username: { not: 'admin' }
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        _count: {
          select: {
            weightEntries: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
