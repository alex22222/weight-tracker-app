import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { 
  verifyPassword, 
  generateToken, 
  checkLoginAttempts, 
  recordFailedLogin,
  clearLoginAttempts,
  validators 
} from '../../../../lib/auth'

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  console.log('[API /auth/login] Login request received')
  
  try {
    const body = await request.json()
    const { username, password } = body

    // 验证用户名
    const usernameValidation = validators.username(username)
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.message },
        { status: 400 }
      )
    }

    // 验证密码
    const passwordValidation = validators.password(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // 检查登录尝试次数
    const attemptCheck = checkLoginAttempts(username)
    if (!attemptCheck.allowed) {
      return NextResponse.json(
        { error: attemptCheck.message },
        { status: 429 }
      )
    }

    // 查找用户
    const user = await adapter.findUserByUsername(username)

    if (!user) {
      recordFailedLogin(username)
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码
    const isPasswordValid = verifyPassword(password, user.password || '')
    if (!isPasswordValid) {
      recordFailedLogin(username)
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 登录成功，清除失败记录
    clearLoginAttempts(username)

    // 检查用户ID
    if (!user.id) {
      console.error('[API /auth/login] User ID is missing')
      return NextResponse.json(
        { error: '用户信息异常' },
        { status: 500 }
      )
    }

    // 更新最后登录时间
    await adapter.updateUserLoginTime(user.id)

    // 生成 JWT Token
    const token = generateToken(String(user.id), user.username || username)

    console.log('[API /auth/login] Login successful:', username)

    // 登录成功，返回用户信息和 token
    return NextResponse.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('[API /auth/login] Error:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
