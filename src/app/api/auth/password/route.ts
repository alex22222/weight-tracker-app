import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter, MessageType } from '../../../../lib/db-adapter'
import { getUserFromRequest, verifyPassword, hashPassword } from '../../../../lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请输入旧密码和新密码' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少为6个字符' }, { status: 400 })
    }

    const existingUser = await adapter.findUserById(user.userId)
    if (!existingUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (!verifyPassword(oldPassword, existingUser.password || '')) {
      return NextResponse.json({ error: '旧密码错误' }, { status: 401 })
    }

    const hashedNewPassword = hashPassword(newPassword)
    await adapter.updateUserPassword(user.userId, hashedNewPassword)

    await adapter.createMessage({
      type: MessageType.SYSTEM_PASSWORD_CHANGE,
      content: `您的账号密码已于 ${new Date().toLocaleString('zh-CN')} 修改。如非本人操作，请立即联系管理员。`,
      senderId: 0,
      receiverId: user.userId,
    })

    return NextResponse.json({ message: '密码修改成功' })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: '密码修改失败' }, { status: 500 })
  }
}
