import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../../lib/db-adapter'
import { hashPassword, rateLimiter } from '../../../../lib/auth'

// POST /api/auth/register - 用户注册
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

    // 用户名格式验证
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: '用户名长度应在 3-20 个字符之间' },
        { status: 400 }
      )
    }
    
    // 用户名只能包含字母、数字和下划线
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: '用户名只能包含字母、数字和下划线' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为 6 个字符' },
        { status: 400 }
      )
    }

    // 速率限制检查
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitKey = `register:${clientIp}`
    const rateCheck = rateLimiter.check(rateLimitKey)
    
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.lockout || 0) / 60000)
      return NextResponse.json(
        { error: `注册尝试次数过多，请 ${minutes} 分钟后重试` },
        { status: 429 }
      )
    }

    // 检查用户名是否已存在
    const existingUser = await adapter.findUserByUsername(username)

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已被注册，请使用其他用户名' },
        { status: 409 }
      )
    }

    // 使用 salt + HMAC 哈希密码
    const { hash, salt } = hashPassword(password)

    // 创建新用户
    const user = await adapter.createUser({
      username,
      password: hash,
      salt,
    } as any)

    const userId = (user as any)._id || (user as any).id
    
    // 注册成功，重置速率限制
    rateLimiter.reset(rateLimitKey)
    
    return NextResponse.json(
      { 
        message: '注册成功', 
        user: { 
          id: userId, 
          username: user.username, 
          createdAt: user.createdAt 
        } 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
