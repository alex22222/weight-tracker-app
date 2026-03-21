import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import { prisma } from '../../../../lib/db'
import { createHash } from 'crypto'

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// POST /api/admin/init - 初始化 admin 用户
export async function POST() {
  try {
    // 检查 admin 用户是否已存在
    let admin = await prisma.user.findUnique({
      where: { username: 'admin' },
    })

    if (!admin) {
      // 创建 admin 用户
      const hashedPassword = hashPassword('123123')
      admin = await prisma.user.create({
        data: {
          username: 'admin',
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
      })
      return NextResponse.json({ message: 'Admin user created', admin: { id: admin.id, username: admin.username } })
    }

    return NextResponse.json({ message: 'Admin user already exists', admin: { id: admin.id, username: admin.username } })
  } catch (error) {
    console.error('Error initializing admin:', error)
    return NextResponse.json({ error: 'Failed to initialize admin' }, { status: 500 })
  }
}
