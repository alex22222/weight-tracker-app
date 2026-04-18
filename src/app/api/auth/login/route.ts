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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    const usernameValidation = validators.username(username)
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.message }, { status: 400 })
    }

    const passwordValidation = validators.password(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const attemptCheck = checkLoginAttempts(username)
    if (!attemptCheck.allowed) {
      return NextResponse.json({ error: attemptCheck.message }, { status: 429 })
    }

    const user = await adapter.findUserByUsername(username)
    if (!user) {
      recordFailedLogin(username)
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const isPasswordValid = verifyPassword(password, user.password || '')
    if (!isPasswordValid) {
      recordFailedLogin(username)
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    clearLoginAttempts(username)

    if (!user.id) {
      return NextResponse.json({ error: '用户信息异常' }, { status: 500 })
    }

    await adapter.updateUserLoginTime(user.id)
    const token = generateToken(String(user.id), user.username || username)

    return NextResponse.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username, createdAt: user.createdAt }
    })
  } catch (error) {
    console.error('[API /auth/login] Error:', error)
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 })
  }
}
