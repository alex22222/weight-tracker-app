import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { sendVerificationCode } from '../../../../lib/email-service'
import { strictRateLimit, getClientIP } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/auth/verify-code - 发送验证码
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimitResult = strictRateLimit(`verify-code:${clientIP}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: rateLimitResult.message }, { status: 429 })
    }

    const body = await request.json()
    const { email, purpose } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: '邮箱地址不能为空' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    if (!purpose || !['register', 'reset'].includes(purpose)) {
      return NextResponse.json({ error: '无效的用途' }, { status: 400 })
    }

    // 注册时检查邮箱是否已存在
    if (purpose === 'register') {
      const existing = await adapter.findUserByEmail(email)
      if (existing) {
        return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 })
      }
    }

    // 重置密码时检查邮箱是否存在
    if (purpose === 'reset') {
      const existing = await adapter.findUserByEmail(email)
      if (!existing) {
        return NextResponse.json({ error: '该邮箱未注册' }, { status: 404 })
      }
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分钟过期

    await adapter.saveVerificationCode({ email, code, purpose, expiresAt })

    const result = await sendVerificationCode(email, code, purpose)

    return NextResponse.json({
      message: result.message,
      // 未配置 SMTP 时返回验证码（仅开发/测试环境）
      ...(result.message.includes('日志') || result.message.includes('未配置') ? { code } : {}),
    })
  } catch (error) {
    console.error('[API /auth/verify-code] Error:', error)
    return NextResponse.json({ error: '发送失败，请稍后重试' }, { status: 500 })
  }
}
