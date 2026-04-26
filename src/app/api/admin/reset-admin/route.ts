import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { hashPassword } from '../../../../lib/auth'

// POST /api/admin/reset-admin - 重置 admin 密码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secretKey, newPassword } = body

    // 简单的安全验证（实际生产环境应该使用更强的验证）
    if (secretKey !== process.env.ADMIN_RESET_KEY && secretKey !== 'reset-admin-2024') {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: '密码长度至少6个字符' }, { status: 400 })
    }

    // 查找 admin 用户
    const admin = await adapter.findUserByUsername('admin')
    
    if (!admin) {
      // 如果 admin 不存在，创建一个
      const hashedPassword = hashPassword(newPassword)
      const newAdmin = await adapter.createUser({
        username: 'admin',
        password: hashedPassword,
        gender: 'male',
      })
      
      if (newAdmin.id) {
        await adapter.createUserSettings({
          userId: newAdmin.id,
          height: 170,
          targetWeight: 65,
        })
      }
      
      return NextResponse.json({ 
        message: 'Admin 用户创建成功',
        userId: newAdmin.id 
      })
    }

    // 重置密码
    const hashedPassword = hashPassword(newPassword)
    await adapter.updateUserPassword(admin.id!, hashedPassword)

    return NextResponse.json({ 
      message: 'Admin 密码重置成功',
      userId: admin.id,
      passwordType: 'bcrypt'
    })

  } catch (error) {
    console.error('[Reset Admin] Error:', error)
    return NextResponse.json({ error: '重置失败' }, { status: 500 })
  }
}
