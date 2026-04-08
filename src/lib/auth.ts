/**
 * 认证工具模块
 * 提供安全的密码哈希和 JWT Token 管理
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { NextRequest } from 'next/server'

// 配置
const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// 登录失败限制配置
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_TIME = 15 * 60 * 1000 // 15分钟

interface LoginAttempt {
  count: number
  lockUntil: number
}

// 内存中存储登录失败次数（生产环境建议使用 Redis）
const loginAttempts = new Map<string, LoginAttempt>()

/**
 * 密码哈希
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS)
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

/**
 * 生成 JWT Token
 */
export function generateToken(userId: string, username: string): string {
  return jwt.sign(
    { 
      userId, 
      username, 
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return { 
      userId: decoded.userId, 
      username: decoded.username 
    }
  } catch {
    return null
  }
}

/**
 * 从请求中获取并验证 Token
 */
export function getUserFromRequest(request: NextRequest): { userId: string; username: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

/**
 * 检查登录尝试次数
 * @returns true 表示允许登录，false 表示账号被锁定
 */
export function checkLoginAttempts(identifier: string): { allowed: boolean; message?: string } {
  const attempt = loginAttempts.get(identifier)
  
  if (!attempt) {
    return { allowed: true }
  }
  
  // 检查是否还在锁定时间内
  if (attempt.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil((attempt.lockUntil - Date.now()) / 60000)
    return { 
      allowed: false, 
      message: `账号已被锁定，请 ${remainingMinutes} 分钟后重试`
    }
  }
  
  // 锁定时间已过，重置计数
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    loginAttempts.delete(identifier)
    return { allowed: true }
  }
  
  return { allowed: true }
}

/**
 * 记录登录失败
 */
export function recordFailedLogin(identifier: string): void {
  const attempt = loginAttempts.get(identifier)
  
  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, lockUntil: 0 })
  } else {
    attempt.count++
    
    // 达到最大尝试次数，锁定账号
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      attempt.lockUntil = Date.now() + LOCK_TIME
    }
  }
}

/**
 * 清除登录失败记录（登录成功时调用）
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}

/**
 * 输入验证工具
 */
export const validators = {
  /**
   * 验证用户名
   */
  username(username: string): { valid: boolean; message?: string } {
    if (!username || typeof username !== 'string') {
      return { valid: false, message: '用户名不能为空' }
    }
    
    if (username.length < 3 || username.length > 20) {
      return { valid: false, message: '用户名长度应为 3-20 个字符' }
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: '用户名只能包含字母、数字和下划线' }
    }
    
    return { valid: true }
  },

  /**
   * 验证密码
   */
  password(password: string): { valid: boolean; message?: string } {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: '密码不能为空' }
    }
    
    if (password.length < 6) {
      return { valid: false, message: '密码长度至少为 6 个字符' }
    }
    
    if (password.length > 100) {
      return { valid: false, message: '密码长度不能超过 100 个字符' }
    }
    
    return { valid: true }
  },

  /**
   * 验证体重
   */
  weight(weight: any): { valid: boolean; value?: number; message?: string } {
    const num = parseFloat(weight)
    
    if (isNaN(num)) {
      return { valid: false, message: '体重必须是数字' }
    }
    
    if (num < 20 || num > 300) {
      return { valid: false, message: '体重必须在 20-300 kg 之间' }
    }
    
    return { valid: true, value: num }
  },

  /**
   * 验证日期
   */
  date(dateStr: string): { valid: boolean; value?: Date; message?: string } {
    if (!dateStr) {
      return { valid: false, message: '日期不能为空' }
    }
    
    const date = new Date(dateStr)
    
    if (isNaN(date.getTime())) {
      return { valid: false, message: '无效的日期格式' }
    }
    
    // 检查日期是否在合理范围内（1900年至今）
    const now = new Date()
    const minDate = new Date('1900-01-01')
    
    if (date > now) {
      return { valid: false, message: '日期不能是未来' }
    }
    
    if (date < minDate) {
      return { valid: false, message: '日期不能早于 1900 年' }
    }
    
    return { valid: true, value: date }
  },

  /**
   * 清理字符串（防 XSS）
   */
  sanitizeString(str: string, maxLength: number = 500): string {
    if (!str || typeof str !== 'string') return ''
    
    return str
      .replace(/[<>]/g, '') // 移除尖括号，防止简单的 XSS
      .substring(0, maxLength)
      .trim()
  }
}

/**
 * 文件上传验证
 */
export const uploadValidators = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

  validateFile(file: File): { valid: boolean; message?: string } {
    // 验证文件类型
    if (!this.ALLOWED_TYPES.includes(file.type as any)) {
      return { 
        valid: false, 
        message: `不支持的文件类型: ${file.type}，仅支持 JPEG、PNG、GIF、WebP`
      }
    }

    // 验证文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        message: `文件大小超过 5MB 限制`
      }
    }

    return { valid: true }
  },

  /**
   * 安全生成文件名
   */
  generateSafeFilename(userId: string, originalType: string): string {
    const ext = originalType.split('/')[1] || 'jpg'
    const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9]/g, '')
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    
    return `avatar_${sanitizedUserId}_${timestamp}_${random}.${ext}`
  }
}
