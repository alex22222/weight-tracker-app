import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType } from '../../../../lib/db-adapter'
import { createHash } from 'crypto'

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// 验证 JWT token 的简单实现
function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId: parseInt(userId), username }
  } catch {
    return null
  }
}

// PUT /api/auth/password - 修改密码
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const body = await request.json()
    const { oldPassword, newPassword } = body

    // 验证输入
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: '请输入旧密码和新密码' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少为 6 个字符' },
        { status: 400 }
      )
    }

    // 查找用户
    const existingUser = await adapter.findUserById(user.userId)
    if (!existingUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 验证旧密码
    const hashedOldPassword = hashPassword(oldPassword)
    if (existingUser.password !== hashedOldPassword) {
      return NextResponse.json({ error: '旧密码错误' }, { status: 401 })
    }

    // 更新密码
    const hashedNewPassword = hashPassword(newPassword)
    await adapter.updateUserPassword(user.userId, hashedNewPassword)

    // 发送密码修改提醒消息
    await adapter.createMessage({
      type: MessageType.SYSTEM_PASSWORD,
      title: '密码修改提醒',
      content: `您的账号密码已于 ${new Date().toLocaleString('zh-CN')} 修改。如非本人操作，请立即联系管理员。`,
      toUserId: user.userId,
    })

    return NextResponse.json({ message: '密码修改成功' })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: '密码修改失败，请稍后重试' },
      { status: 500 }
    )
  }
}
