import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import { prisma } from '../../../../lib/db'

// POST /api/auth/guest - 创建游客用户
export async function POST() {
  try {
    // 生成唯一的游客用户名
    const timestamp = Date.now()
    const guestUsername = `游客_${timestamp}`
    
    // 创建游客用户
    const user = await prisma.user.create({
      data: {
        username: guestUsername,
        password: 'guest', // 游客密码无实际意义
        settings: {
          create: {
            height: 170,
            targetWeight: 65,
            gender: 'male',
            age: 25,
            avatar: '',
          }
        }
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: '游客登录成功',
      user,
    })
  } catch (error) {
    console.error('Error creating guest user:', error)
    return NextResponse.json(
      { error: '游客登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
