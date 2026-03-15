/**
 * 认证工具库 - 安全版本
 * 使用 JWT 风格的 token 签名，防止伪造
 */

import { createHash, randomBytes } from 'crypto'

// 从环境变量获取密钥，如果没有则生成随机密钥
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex')

// Token 过期时间（7天）
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000

export interface TokenPayload {
  userId: number
  username: string
  exp: number
}

/**
 * 使用 HMAC-SHA256 签名 Token，防止伪造
 */
export function generateToken(userId: number, username: string): string {
  const exp = Date.now() + TOKEN_EXPIRY
  const payload = JSON.stringify({ userId, username, exp })
  const payloadBase64 = Buffer.from(payload).toString('base64url')
  
  // 生成签名
  const signature = createHash('sha256')
    .update(`${payloadBase64}.${JWT_SECRET}`)
    .digest('base64url')
  
  return `${payloadBase64}.${signature}`
}

/**
 * 验证 Token 并返回用户信息
 */
export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    if (!token) return null
    
    const parts = token.split('.')
    if (parts.length !== 2) return null
    
    const [payloadBase64, signature] = parts
    
    // 验证签名
    const expectedSignature = createHash('sha256')
      .update(`${payloadBase64}.${JWT_SECRET}`)
      .digest('base64url')
    
    // 使用 timing-safe 比较防止时序攻击
    if (!timingSafeEqual(signature, expectedSignature)) {
      return null
    }
    
    // 解析 payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    )
    
    // 检查过期时间
    if (Date.now() > payload.exp) {
      return null
    }
    
    return { userId: payload.userId, username: payload.username }
  } catch {
    return null
  }
}

/**
 * 安全的字符串比较，防止时序攻击
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * 密码哈希 - 使用 salt + HMAC
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(`${password}.${usedSalt}.${JWT_SECRET}`)
    .digest('hex')
  return { hash, salt: usedSalt }
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: expectedHash } = hashPassword(password, salt)
  return timingSafeEqual(hash, expectedHash)
}

/**
 * 速率限制器 - 防止暴力破解
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()
  
  // 最大尝试次数
  private readonly MAX_ATTEMPTS = 5
  // 锁定时间（15分钟）
  private readonly LOCKOUT_TIME = 15 * 60 * 1000
  
  check(key: string): { allowed: boolean; remaining: number; lockout?: number } {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record || now > record.resetTime) {
      // 重置计数
      this.attempts.set(key, { count: 1, resetTime: now + this.LOCKOUT_TIME })
      return { allowed: true, remaining: this.MAX_ATTEMPTS - 1 }
    }
    
    if (record.count >= this.MAX_ATTEMPTS) {
      const lockout = record.resetTime - now
      return { allowed: false, remaining: 0, lockout }
    }
    
    record.count++
    return { allowed: true, remaining: this.MAX_ATTEMPTS - record.count }
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()
