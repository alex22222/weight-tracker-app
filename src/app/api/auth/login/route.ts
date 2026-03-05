import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../../lib/db-adapter'
import { createHash } from 'crypto'

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
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

    // 登录成功，返回用户信息（不包含密码）
    const userId = user._id || user.id
    return NextResponse.json({
      message: '登录成功',
      user: {
        id: userId,
        username: user.username,
        createdAt: user.createdAt,
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
