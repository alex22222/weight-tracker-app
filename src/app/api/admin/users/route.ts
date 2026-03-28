import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../../lib/db-adapter'

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
    const admin = await adapter.getUserById(adminId)

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 获取所有用户
    const allUsers = await adapter.getAllUsers()
    
    // 过滤掉 admin 自己
    const users = allUsers
      .filter(u => u.username !== 'admin')
      .map(u => ({
        id: u.id,
        username: u.username,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }))

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
