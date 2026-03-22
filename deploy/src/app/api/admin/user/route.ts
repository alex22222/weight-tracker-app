import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { prisma } from '../../../../lib/db'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/admin/user?adminId={adminId}&userId={userId} - 获取指定用户详情
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
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(adminId) },
    })

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 获取用户详情
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        weightEntries: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/admin/user - 更新用户信息和设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, userId, username, settings } = body

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // 验证是否是 admin
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(adminId) },
    })

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 更新用户信息
    const updateData: any = {}
    if (username !== undefined) updateData.username = username

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData,
    })

    // 更新用户设置
    if (settings) {
      const { height, targetWeight, gender, age, avatar } = settings
      const updateSettingsData: any = {}
      if (height !== undefined) updateSettingsData.height = parseFloat(height)
      if (targetWeight !== undefined) updateSettingsData.targetWeight = parseFloat(targetWeight)
      if (gender !== undefined) updateSettingsData.gender = gender
      if (age !== undefined) updateSettingsData.age = parseInt(age)
      if (avatar !== undefined) updateSettingsData.avatar = avatar

      await prisma.userSettings.update({
        where: { userId: parseInt(userId) },
        data: updateSettingsData,
      })
    }

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/user?adminId={adminId}&userId={userId} - 删除用户
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
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(adminId) },
    })

    if (!admin || admin.username !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 防止删除 admin 自己
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.username === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 403 })
    }

    // 删除用户（级联删除体重记录和设置）
    await prisma.user.delete({
      where: { id: parseInt(userId) },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
