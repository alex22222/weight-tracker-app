/**
 * API 速率限制模块
 * 防止暴力破解和 DDoS 攻击
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// 内存存储（生产环境建议使用 Redis）
const rateLimitMap = new Map<string, RateLimitEntry>()

// 清理过期的条目（每小时）
setInterval(() => {
  const now = Date.now()
  // 使用 Array.from 避免 TypeScript 迭代器问题
  Array.from(rateLimitMap.entries()).forEach(([key, entry]) => {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key)
    }
  })
}, 60 * 60 * 1000)

interface RateLimitOptions {
  windowMs?: number      // 时间窗口（毫秒）
  maxRequests?: number   // 最大请求数
  identifier?: string    // 自定义标识符
}

/**
 * 检查是否超出速率限制
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const { windowMs = 60 * 1000, maxRequests = 100 } = options // 默认：每分钟100请求
  
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)
  
  // 如果没有记录或已过期，创建新记录
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    }
    rateLimitMap.set(identifier, newEntry)
    return { allowed: true, remaining: maxRequests - 1, resetTime: newEntry.resetTime }
  }
  
  // 增加计数
  entry.count++
  
  // 检查是否超过限制
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }
  
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime }
}

/**
 * 获取客户端 IP 地址
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  // 使用更通用的方式获取 IP
  return 'unknown'
}

/**
 * 为敏感 API 创建更严格的限制
 */
export function strictRateLimit(identifier: string): { allowed: boolean; message?: string } {
  // 登录/注册等敏感接口：每15分钟最多5次
  const result = checkRateLimit(identifier, { windowMs: 15 * 60 * 1000, maxRequests: 5 })
  
  if (!result.allowed) {
    const minutes = Math.ceil((result.resetTime - Date.now()) / 60000)
    return { 
      allowed: false, 
      message: `请求过于频繁，请 ${minutes} 分钟后重试` 
    }
  }
  
  return { allowed: true }
}
