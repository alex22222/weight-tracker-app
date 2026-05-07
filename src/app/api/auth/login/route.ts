import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { adapter } from '../../../../lib/db-adapter'
import { 
  verifyPassword,
  hashPassword,
  generateToken, 
  checkLoginAttempts, 
  recordFailedLogin,
  clearLoginAttempts,
  validators 
} from '../../../../lib/auth'
import { strictRateLimit, getClientIP } from '../../../../lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const clientIP = getClientIP(request)
    const rateLimitResult = strictRateLimit(`login:${clientIP}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message }, 
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    // 输入验证增强
    if (!username || typeof username !== 'string' || username.length > 50) {
      return NextResponse.json({ error: '用户名格式不正确' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length > 100) {
      return NextResponse.json({ error: '密码格式不正确' }, { status: 400 })
    }

    // 安全日志：仅记录非敏感信息
    console.log(`[Login] Attempt: username=${username}`)
    console.log(`[Login] Password length: ${password?.length}`)

    // 输入验证
    if (!username || typeof username !== 'string') {
      console.log(`[Login] Invalid username type: ${typeof username}`)
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 })
    }

    if (!password || typeof password !== 'string') {
      console.log(`[Login] Invalid password type: ${typeof password}`)
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 })
    }

    // 检查登录限制
    const attemptCheck = checkLoginAttempts(username)
    if (!attemptCheck.allowed) {
      console.log(`[Login] Account locked: ${username}`)
      return NextResponse.json({ error: attemptCheck.message }, { status: 429 })
    }

    // 查找用户
    let user
    try {
      user = await adapter.findUserByUsername(username)
    } catch (dbError) {
      // 安全：不暴露具体数据库错误
      console.error(`[Login] Database error`)
      return NextResponse.json({ error: '服务暂时不可用' }, { status: 503 })
    }
    
    if (!user) {
      console.log(`[Login] User not found: ${username}`)
      recordFailedLogin(username)
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    console.log(`[Login] User found: id=${user.id}`)
    // 安全：不要记录任何密码相关信息

    // 检查密码格式
    const storedPassword = user.password || ''
    const isBcryptHash = storedPassword.startsWith('$2')
    // SHA256 特征是 64 位十六进制字符串
    const isSha256Hash = /^[a-f0-9]{64}$/i.test(storedPassword)
    
    let isPasswordValid = false
    
    if (isBcryptHash) {
      // 使用 bcrypt 验证
      isPasswordValid = verifyPassword(password, storedPassword)
      console.log(`[Login] Bcrypt verification result: ${isPasswordValid}`)
    } else if (isSha256Hash) {
      // 兼容旧数据：SHA256
      const hashedInput = createHash('sha256').update(password).digest('hex')
      isPasswordValid = hashedInput === storedPassword
      console.log(`[Login] SHA256 verification result: ${isPasswordValid}`)
    } else {
      // 兼容旧数据：明文
      isPasswordValid = password === storedPassword
      console.log(`[Login] Plain text comparison result: ${isPasswordValid}`)
    }

    if (!isPasswordValid) {
      console.log(`[Login] Password verification failed for: ${username}`)
      recordFailedLogin(username)
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 如果密码是明文或 SHA256，自动升级为 bcrypt
    if (storedPassword && !isBcryptHash) {
      try {
        const newHashedPassword = hashPassword(password)
        await adapter.updateUserPassword(user.id!, newHashedPassword)
        console.log(`[Login] Password migrated from ${isSha256Hash ? 'SHA256' : 'plain'} to bcrypt for user: ${username}`)
      } catch (err) {
        console.error(`[Login] Failed to migrate password:`, err)
      }
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
      user: { id: user.id, username: user.username, nickname: user.nickname, createdAt: user.createdAt }
    })
  } catch (error) {
    // 生产环境不暴露错误详情
    const isDev = process.env.NODE_ENV !== 'production'
    console.error('[API /auth/login] Error:', isDev ? error : 'Internal error')
    return NextResponse.json(
      { error: '登录失败，请稍后重试' }, 
      { status: 500 }
    )
  }
}
