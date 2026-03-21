import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { prisma } from '../../../../lib/db'
import { createHash } from 'crypto'

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// POST /api/auth/register - 用户注册
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

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: '用户名长度应在 3-20 个字符之间' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为 6 个字符' },
        { status: 400 }
      )
    }

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已被注册，请使用其他用户名' },
        { status: 409 }
      )
    }

    // 创建新用户
    const hashedPassword = hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
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

    return NextResponse.json(
      { message: '注册成功', user },
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
