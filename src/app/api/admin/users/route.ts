import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { resolveFileUrls } from '../../../../lib/cloudbase'

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
    const normalUsers = allUsers.filter(u => u.username !== 'admin')

    // 批量获取所有体重记录（避免 N+1 查询）
    const allWeightEntries = await adapter.getAllWeightEntries()

    // 并行获取每个用户的 settings
    const enrichedUsers = await Promise.all(
      normalUsers
        .filter(u => u.id !== undefined)
        .map(async (u) => {
          const userId = u.id!
          const settings = await adapter.getUserSettings(userId)
          const weightEntriesCount = allWeightEntries.filter(
            w => String(w.userId) === String(userId)
          ).length
          return {
            id: userId,
            username: u.username,
            nickname: u.nickname,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            lastLoginAt: u.lastLoginAt,
            totalUsageTime: u.totalUsageTime || 0,
            settings,
            weightEntriesCount,
          }
        })
    )

    // 批量转换 cloud:// 头像 URL 为临时 HTTP URL
    const avatars = enrichedUsers.map(u => u.settings?.avatar)
    const urlMap = await resolveFileUrls(avatars)
    for (const user of enrichedUsers) {
      if (user.settings?.avatar && urlMap[user.settings.avatar]) {
        user.settings.avatar = urlMap[user.settings.avatar]
      }
    }

    return NextResponse.json(enrichedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
