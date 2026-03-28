import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import { adapter } from '../../../../lib/db-adapter'

// 生成 Token
function generateToken(username: string, userId: string): string {
  return Buffer.from(`${username}:${userId}`).toString('base64')
}

// POST /api/auth/guest - 创建游客用户
export async function POST() {
  try {
    // 生成唯一的游客用户名
    const timestamp = Date.now()
    const guestUsername = `游客_${timestamp}`
    
    // 创建游客用户
    const user = await adapter.createUser({
      username: guestUsername,
      password: 'guest', // 游客密码无实际意义
      gender: 'male',
    })

    // 检查用户ID
    if (!user.id) {
      throw new Error('创建用户失败，未返回用户ID')
    }

    // 创建用户设置
    await adapter.createUserSettings({
      userId: user.id,
      height: 170,
      targetWeight: 65,
    })

    // 生成 token
    const token = generateToken(user.username, String(user.id))

    return NextResponse.json({
      message: '游客登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating guest user:', error)
    return NextResponse.json(
      { error: '游客登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
