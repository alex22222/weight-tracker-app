import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType } from '../../../../lib/db-adapter'
import { generateToken, verifyPassword, rateLimiter } from '../../../../lib/auth'

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 输入验证
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 速率限制检查
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = `login:${clientIp}:${username.toLowerCase()}`
    const rateCheck = rateLimiter.check(rateLimitKey)
    
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.lockout || 0) / 60000)
      return NextResponse.json(
        { error: `登录尝试次数过多，请 ${minutes} 分钟后重试` },
        { status: 429 }
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
    const userWithSalt = user as unknown as { 
      id: number
      _id: string
      username: string
      password: string
      salt?: string
      role?: string
      avatar?: string
      createdAt: Date
      lastLoginAt?: Date
    }
    
    // 兼容旧密码（无 salt）和新密码格式
    let isValidPassword = false
    if (userWithSalt.salt) {
      isValidPassword = verifyPassword(password, userWithSalt.password, userWithSalt.salt)
    } else {
      // 旧版本使用简单 SHA256，需要迁移
      const { createHash } = await import('crypto')
      const oldHash = createHash('sha256').update(password).digest('hex')
      isValidPassword = oldHash === userWithSalt.password
    }
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 登录成功，重置速率限制
    rateLimiter.reset(rateLimitKey)

    // 获取用户ID
    const userId = userWithSalt.id || parseInt(userWithSalt._id)

    // 更新最后登录时间
    await adapter.updateUserLoginTime(userId)

    // 发送登录提醒消息（如果不是第一次登录）
    if (user.lastLoginAt) {
      const lastLoginTime = new Date(user.lastLoginAt).toLocaleString('zh-CN')
      await adapter.createMessage({
        type: MessageType.SYSTEM_LOGIN,
        title: '登录提醒',
        content: `您的账号于 ${new Date().toLocaleString('zh-CN')} 登录。上次登录时间：${lastLoginTime}`,
        toUserId: userId,
      })
    } else {
      // 第一次登录欢迎消息
      await adapter.createMessage({
        type: MessageType.SYSTEM_LOGIN,
        title: '欢迎',
        content: `欢迎使用体重管理器！您的账号已创建成功。`,
        toUserId: userId,
      })
    }

    // 生成安全 token
    const token = generateToken(userId, user.username)

    // 返回用户信息（不包含密码）
    return NextResponse.json({
      message: '登录成功',
      token,
      user: {
        id: userId,
        username: user.username,
        role: userWithSalt.role || 'user',
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
