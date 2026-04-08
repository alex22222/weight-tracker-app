# 质量审查报告

## 审查概述
- **审查日期**: 2026-04-08
- **审查范围**: 微信小程序 + Next.js 后端 API
- **审查类型**: 安全性、健壮性、性能、代码质量

---

## 🔴 严重问题（必须修复）

### 1. 密码哈希不安全
**位置**: `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`

**问题**: 使用简单 SHA256 哈希，无 salt，易被彩虹表攻击
```typescript
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}
```

**风险**: 
- 用户密码泄露风险高
- 相同密码产生相同哈希值

**修复方案**:
```typescript
// 使用 bcrypt 或带 salt 的哈希
import bcrypt from 'bcryptjs'

const saltRounds = 10

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, saltRounds)
}

function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}
```

---

### 2. Token 生成方式不安全
**位置**: 多处 API 文件

**问题**: 
- Token 只是 Base64(username:userId)，无过期时间
- 易被伪造和解码
- 无刷新机制

```typescript
function generateToken(username: string, userId: string): string {
  return Buffer.from(`${username}:${userId}`).toString('base64')
}
```

**修复方案**:
```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

function generateToken(userId: string, username: string): string {
  return jwt.sign(
    { userId, username, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return { userId: decoded.userId, username: decoded.username }
  } catch {
    return null
  }
}
```

---

### 3. 文件上传安全漏洞
**位置**: `src/app/api/upload/route.ts`

**问题**:
- 无文件类型验证（可上传任意文件）
- 无文件大小限制
- 文件名直接拼接可能导致目录遍历
- 扩展名提取可被绕过

```typescript
const ext = filename.split('.').pop() || 'jpg'  // 可被绕过
const newName = `avatar_${user.userId}_${Date.now()}.${ext}`
```

**修复方案**:
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// 验证文件类型
if (!ALLOWED_TYPES.includes(fileField.type)) {
  return NextResponse.json({ error: '不支持的文件类型' }, { status: 400 })
}

// 验证文件大小
if (fileData.length > MAX_FILE_SIZE) {
  return NextResponse.json({ error: '文件大小超过5MB限制' }, { status: 400 })
}

// 安全生成文件名
const ext = fileField.type.split('/')[1] || 'jpg'
const sanitizedUserId = String(user.userId).replace(/[^a-zA-Z0-9]/g, '')
const newName = `avatar_${sanitizedUserId}_${Date.now()}.${ext}`
```

---

### 4. 权限控制缺陷
**位置**: `src/app/api/weight/route.ts`

**问题**: 可通过 query 参数获取任意用户的体重记录
```typescript
// 2. 尝试从 Query 参数获取
const userIdFromQuery = searchParams.get('userId')
if (userIdFromQuery) return userIdFromQuery  // 危险！
```

**风险**: 
- 横向越权访问其他用户数据
- 隐私泄露

**修复方案**:
```typescript
// 移除 query 参数获取 userId 的方式
// 只允许从 Token 获取
async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  
  const user = verifyToken(token)
  return user?.userId || null
}
```

---

## 🟠 中等问题（建议修复）

### 5. 缺乏输入验证
**位置**: 多处 API

**问题**:
- 体重值无范围验证（负数、超大值）
- 日期格式未验证
- 字符串长度无限制
- 缺少防 XSS 过滤

**修复方案**:
```typescript
// 添加验证函数
function validateWeight(weight: any): number {
  const num = parseFloat(weight)
  if (isNaN(num) || num < 20 || num > 300) {
    throw new Error('体重必须在 20-300 kg 之间')
  }
  return num
}

function sanitizeString(str: string, maxLength: number = 500): string {
  return str
    .replace(/[<>]/g, '') // 简单 XSS 防护
    .substring(0, maxLength)
    .trim()
}
```

---

### 6. 缺乏防暴力破解机制
**位置**: `src/app/api/auth/login/route.ts`

**问题**: 无登录失败次数限制，可被暴力破解

**修复方案**:
```typescript
// 使用内存或 Redis 存储登录失败次数
const loginAttempts = new Map<string, { count: number; lockUntil: number }>()

const MAX_ATTEMPTS = 5
const LOCK_TIME = 15 * 60 * 1000 // 15分钟

function checkLoginAttempts(username: string): boolean {
  const attempt = loginAttempts.get(username)
  if (!attempt) return true
  
  if (attempt.lockUntil > Date.now()) {
    return false // 账号被锁定
  }
  
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockUntil = Date.now() + LOCK_TIME
    return false
  }
  
  return true
}
```

---

### 7. 错误信息泄露敏感信息
**位置**: 多处 API

**问题**: 错误信息直接返回，可能泄露系统信息

```typescript
} catch (error: any) {
  console.error('[API /weight] Error:', error.message || error)
  return NextResponse.json({ 
    error: 'Failed to fetch entries',
    details: error.message,  // 可能泄露敏感信息
    entries: []
  }, { status: 500 })
}
```

**修复方案**:
```typescript
} catch (error: any) {
  console.error('[API /weight] Error:', error)
  // 生产环境不返回具体错误信息
  const isDev = process.env.NODE_ENV === 'development'
  return NextResponse.json({ 
    error: '服务器内部错误',
    ...(isDev && { details: error.message })
  }, { status: 500 })
}
```

---

### 8. 数据库操作无事务支持
**位置**: `src/lib/db-adapter.ts`

**问题**: 多步骤操作（如转账、创建关联数据）无事务，可能导致数据不一致

**示例风险**:
```typescript
// 创建好友请求 + 发送消息
await adapter.createFriendRequest({...})  // 成功
await adapter.createMessage({...})         // 失败 -> 数据不一致
```

**修复建议**: 使用 CloudBase 的事务支持或重试机制

---

## 🟡 低等问题（可选优化）

### 9. 代码重复
**位置**: 多处

**问题**: `verifyToken` 函数在多个文件中重复定义

**修复**: 提取到公共模块

---

### 10. 缺乏日志记录
**位置**: 多处

**问题**: 只有控制台日志，无持久化日志

**建议**: 接入 Winston 或类似日志库

---

### 11. API 响应格式不统一
**位置**: 多个 API 文件

**问题**: 错误响应格式不一致
- 有的用 `{ error: 'xxx' }`
- 有的用 `{ message: 'xxx' }`

**修复**: 统一响应格式

---

## 📊 问题统计

| 级别 | 数量 | 状态 |
|-----|------|------|
| 🔴 严重 | 4 | 必须修复 |
| 🟠 中等 | 4 | 建议修复 |
| 🟡 低等 | 3 | 可选优化 |
| **总计** | **11** | - |

---

## ✅ 修复优先级

### 第一优先级（立即修复）
1. 密码哈希不安全 (#1)
2. Token 生成方式不安全 (#2)
3. 文件上传安全漏洞 (#3)
4. 权限控制缺陷 (#4)

### 第二优先级（1周内修复）
5. 缺乏输入验证 (#5)
6. 缺乏防暴力破解机制 (#6)
7. 错误信息泄露敏感信息 (#7)

### 第三优先级（后续优化）
8. 数据库事务支持 (#8)
9. 代码重复 (#9)
10. 日志记录 (#10)
11. API 格式统一 (#11)

---

## 🔧 快速修复清单

### 安装依赖
```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 环境变量配置 (.env.production)
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d
```

---

## 📋 测试建议

### 安全性测试
1. 使用 Burp Suite 或 OWASP ZAP 进行渗透测试
2. 密码破解测试（验证 bcrypt）
3. Token 伪造测试（验证 JWT）
4. 文件上传测试（尝试上传恶意文件）

### 功能测试
1. 越权访问测试
2. 并发操作测试
3. 边界值测试（输入验证）

---

## 📝 总结

项目整体架构清晰，但存在**严重安全风险**，特别是密码存储和 Token 机制。建议在正式上线前完成第一优先级的修复。

**关键风险**: 
- 用户密码易被破解
- Token 易被伪造
- 可越权访问其他用户数据

**建议**: 上线前必须通过安全渗透测试。
