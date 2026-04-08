import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { 
  hashPassword, 
  generateToken,
  validators 
} from '../../../../lib/auth'

// POST /api/auth/register - 用户注册
export async function POST(request: NextRequest) {
  console.log('[API /auth/register] Register request received')
  
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

    // 检查用户名是否已存在
    const existingUser = await adapter.findUserByUsername(username)

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已被注册，请使用其他用户名' },
        { status: 409 }
      )
    }

    // 创建新用户（使用安全哈希）
    const hashedPassword = hashPassword(password)
    const user = await adapter.createUser({
      username,
      password: hashedPassword,
      gender: 'male', // 默认性别
    })

    // 检查用户ID
    if (!user.id) {
      console.error('[API /auth/register] User ID is missing after creation')
      return NextResponse.json(
        { error: '创建用户失败，请稍后重试' },
        { status: 500 }
      )
    }

    // 创建用户设置
    await adapter.createUserSettings({
      userId: user.id,
      height: 170,
      targetWeight: 65,
    })

    // 生成 JWT Token
    const token = generateToken(String(user.id), user.username || username)

    console.log('[API /auth/register] Register successful:', username)

    return NextResponse.json(
      { 
        message: '注册成功', 
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          createdAt: user.createdAt,
          isNewUser: true
        } 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API /auth/register] Error:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
