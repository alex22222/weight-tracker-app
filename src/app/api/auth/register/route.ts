import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { hashPassword, generateToken, validators } from '../../../../lib/auth'
import { strictRateLimit, getClientIP } from '../../../../lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const clientIP = getClientIP(request)
    const rateLimitResult = strictRateLimit(`register:${clientIP}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message }, 
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    // 输入长度限制
    if (!username || typeof username !== 'string' || username.length > 50) {
      return NextResponse.json({ error: '用户名格式不正确' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length > 100) {
      return NextResponse.json({ error: '密码格式不正确' }, { status: 400 })
    }

    const usernameValidation = validators.username(username)
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.message }, { status: 400 })
    }

    const passwordValidation = validators.password(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const existingUser = await adapter.findUserByUsername(username)
    if (existingUser) {
      return NextResponse.json({ error: '用户名已被注册' }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)
    const user = await adapter.createUser({
      username,
      password: hashedPassword,
      gender: 'male',
    })

    if (!user.id) {
      return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
    }

    await adapter.createUserSettings({
      userId: user.id,
      height: 170,
      targetWeight: 65,
    })

    const token = generateToken(String(user.id), user.username || username)

    return NextResponse.json({
      message: '注册成功',
      token,
      user: { id: user.id, username: user.username, createdAt: user.createdAt, isNewUser: true }
    }, { status: 201 })
  } catch (error) {
    // 生产环境不暴露错误详情
    const isDev = process.env.NODE_ENV !== 'production'
    console.error('[API /auth/register] Error:', isDev ? error : 'Internal error')
    return NextResponse.json(
      { error: '注册失败，请稍后重试' }, 
      { status: 500 }
    )
  }
}
