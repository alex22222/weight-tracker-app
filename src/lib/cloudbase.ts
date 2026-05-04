/**
 * CloudBase (腾讯云开发) 数据库客户端 — 长期方案
 * 
 * 不再使用临时密钥（2小时过期），改为从环境变量读取腾讯云永久 API 密钥。
 * 用户需在 CloudBase 控制台 → 云托管 → 环境变量中配置：
 *   CB_SECRET_ID  = 腾讯云 API 密钥 ID
 *   CB_SECRET_KEY = 腾讯云 API 密钥 Key
 * 
 * 获取方式：腾讯云控制台 → 访问管理(CAM) → API 密钥管理 → 新建密钥
 * 安全建议：使用子账号密钥，只授予 CloudBase 最小权限。
 */

import tcb from '@cloudbase/node-sdk'

const envId = 'weight-tracker-1ghr085dd7d6cff2'

// 长期方案：从环境变量读取永久密钥（不需要 sessionToken）
const secretId = process.env.CB_SECRET_ID || ''
const secretKey = process.env.CB_SECRET_KEY || ''

// 清除 CloudRun 自动注入的临时密钥（防止与我们的永久密钥冲突）
if (process.env.TENCENT_SECRET_ID) {
  console.log('[CloudBase] Removing auto-injected TENCENT_SECRET_ID')
  delete (process.env as any).TENCENT_SECRET_ID
}
if (process.env.TENCENT_SECRET_KEY) {
  console.log('[CloudBase] Removing auto-injected TENCENT_SECRET_KEY')
  delete (process.env as any).TENCENT_SECRET_KEY
}

console.log('[CloudBase] Env:', envId)
console.log('[CloudBase] Has SecretId:', !!secretId)
console.log('[CloudBase] Has SecretKey:', !!secretKey)

let app: any = null
let initError: Error | null = null

if (!secretId || !secretKey) {
  initError = new Error(
    'CB_SECRET_ID / CB_SECRET_KEY 未设置。' +
    '请在 CloudBase 控制台 → 云托管 → 环境变量中配置腾讯云永久 API 密钥。'
  )
  console.error('[CloudBase]', initError.message)
} else {
  try {
    app = tcb.init({
      env: envId,
      secretId,
      secretKey,
      timeout: 10000,
    })
    console.log('[CloudBase] Initialized with permanent credentials')
  } catch (error) {
    initError = error as Error
    console.error('[CloudBase] Init failed:', error)
  }
}

// 安全兜底：如果初始化失败，返回空对象避免后续崩溃
if (!app) {
  app = {}
}

export const db = app?.database
  ? app.database()
  : {
      collection: () => ({
        add: async () => { throw initError || new Error('CloudBase not initialized') },
        where: () => ({ get: async () => ({ data: [] }), count: async () => ({ total: 0 }) }),
        doc: () => ({ get: async () => ({ data: null }), update: async () => {}, delete: async () => {} }),
      })
    }

export const cloudbaseApp = app
export const cloudbaseInitError = initError

// 将 CloudBase fileID (cloud://...) 转换为临时访问 URL
export async function resolveFileUrl(fileIDOrUrl?: string | null): Promise<string | null> {
  if (!fileIDOrUrl) return null
  if (!fileIDOrUrl.startsWith('cloud://')) return fileIDOrUrl
  try {
    if (!app?.getTempFileURL) return fileIDOrUrl
    const result = await app.getTempFileURL({ fileList: [fileIDOrUrl] })
    return result.fileList?.[0]?.tempFileURL || fileIDOrUrl
  } catch (e) {
    console.error('[resolveFileUrl] Failed:', fileIDOrUrl, e)
    return fileIDOrUrl
  }
}

export async function testCloudBaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!app?.database) {
      return { success: false, error: initError?.message || 'CloudBase not initialized' }
    }
    await app.database().collection('users').limit(1).get()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
