import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../../lib/db-adapter'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/admin/user?adminId={adminId}&userId={userId} - 获取指定用户信息（仅 admin）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const userId = searchParams.get('userId')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // 验证是否是 admin
    const admin = await adapter.getUserById(adminId)

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 获取目标用户
    const user = await adapter.getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 获取用户设置
    const settings = await adapter.getUserSettings(userId)

    return NextResponse.json({
      ...user,
      settings,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/admin/user - 更新用户信息（仅 admin）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, userId, ...updateData } = body

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // 验证是否是 admin
    const admin = await adapter.getUserById(adminId)

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 不能修改 admin 自己通过此 API
    const targetUser = await adapter.getUserById(userId)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 更新用户信息
    if (updateData.username || updateData.password) {
      await adapter.updateUser(userId, {
        username: updateData.username,
        password: updateData.password,
      })
    }

    // 更新用户设置
    if (updateData.height !== undefined || updateData.targetWeight !== undefined || updateData.gender !== undefined) {
      await adapter.updateUserSettings(userId, {
        height: updateData.height,
        targetWeight: updateData.targetWeight,
        gender: updateData.gender,
      })
    }

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/user?adminId={adminId}&userId={userId} - 删除用户（仅 admin）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')
    const userId = searchParams.get('userId')

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // 验证是否是 admin
    const admin = await adapter.getUserById(adminId)

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 不能删除 admin 自己
    const targetUser = await adapter.getUserById(userId)
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.username === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 403 })
    }

    // 删除用户（CloudBase 中需要手动删除关联数据）
    await adapter.deleteUser(userId)

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
