import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { hashPassword } from '../../../../lib/auth'
import { strictRateLimit, getClientIP } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

// POST /api/auth/reset-password - 重置密码
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimitResult = strictRateLimit(`reset-password:${clientIP}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
    }

    const body = await request.json()
    const { email, code, newPassword } = body

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '密码长度至少6个字符' }, { status: 400 })
    }

    // 验证验证码
    const valid = await adapter.verifyCode(email, code, 'reset')
    if (!valid) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
    }

    // 查找用户
    const user = await adapter.findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const hashedPassword = hashPassword(newPassword)
    await adapter.updateUserPassword(user.id!, hashedPassword)

    return NextResponse.json({ message: '密码重置成功，请使用新密码登录' })
  } catch (error) {
    console.error('[API /auth/reset-password] Error:', error)
    return NextResponse.json({ error: '重置失败，请稍后重试' }, { status: 500 })
  }
}
