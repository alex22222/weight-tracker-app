import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType } from '../../../../lib/db-adapter'
import { createHash } from 'crypto'

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// 生成简单的 token
function generateToken(username: string, userId: number | string): string {
  return Buffer.from(`${username}:${userId}:${Date.now()}`).toString('base64')
}

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 查找用户
    const user = await adapter.findUserByUsername(username)

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码
    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 获取用户ID
    const userId = (user as unknown as { _id: string })._id || (user as unknown as { id: number }).id

    // 更新最后登录时间
    await adapter.updateUserLoginTime(userId as number)

    // 发送登录提醒消息（如果不是第一次登录）
    if (user.lastLoginAt) {
      const lastLoginTime = new Date(user.lastLoginAt).toLocaleString('zh-CN')
      await adapter.createMessage({
        type: MessageType.SYSTEM_LOGIN,
        title: '登录提醒',
        content: `您的账号于 ${new Date().toLocaleString('zh-CN')} 登录。上次登录时间：${lastLoginTime}`,
        toUserId: userId as number,
      })
    } else {
      // 第一次登录欢迎消息
      await adapter.createMessage({
        type: MessageType.SYSTEM_LOGIN,
        title: '欢迎',
        content: `欢迎使用体重管理器！您的账号已创建成功。`,
        toUserId: userId as number,
      })
    }

    // 生成 token
    const token = generateToken(user.username, userId as number)

    // 登录成功，返回用户信息（不包含密码）
    const userRole = (user as unknown as { role: string }).role || 'user'
    
    return NextResponse.json({
      message: '登录成功',
      token,
      user: {
        id: userId,
        username: user.username,
        role: userRole,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error logging in user:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
