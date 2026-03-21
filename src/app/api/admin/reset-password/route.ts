import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { prisma } from '../../../../lib/db'
import { createHash } from 'crypto'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// POST /api/admin/reset-password - 重置用户密码为默认密码 111111
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, userId } = body

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

    // 防止重置 admin 自己的密码
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.username === 'admin') {
      return NextResponse.json({ error: 'Cannot reset admin password' }, { status: 403 })
    }

    // 重置密码为 111111
    const defaultPassword = '111111'
    const hashedPassword = hashPassword(defaultPassword)

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ 
      message: 'Password reset successfully',
      defaultPassword 
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
