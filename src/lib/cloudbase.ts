/**
 * CloudBase (腾讯云开发) 数据库客户端
 */

import tcb from '@cloudbase/node-sdk'

const envId = (process.env.CLOUDBASE_ENV_ID || 'weight-tracker-1ghr085dd7d6cff2').trim()

// 获取密钥 - CloudRun 会自动注入 TCB_SECRET_ID 和 TCB_SECRET_KEY
const secretId = process.env.TCB_SECRET_ID?.trim() || process.env.TENCENT_SECRET_ID?.trim()
const secretKey = process.env.TCB_SECRET_KEY?.trim() || process.env.TENCENT_SECRET_KEY?.trim()

console.log('[CloudBase] Env:', envId)
console.log('[CloudBase] Has SecretId:', !!secretId)
console.log('[CloudBase] Has SecretKey:', !!secretKey)

let app: any = null
let initError: Error | null = null

try {
  if (secretId && secretKey) {
    console.log('[CloudBase] Initializing with credentials')
    app = tcb.init({
      env: envId,
      secretId,
      secretKey,
      timeout: 10000, // 10秒超时
    })
    console.log('[CloudBase] Initialized with credentials')
  } else {
    console.log('[CloudBase] No credentials, using default init')
    app = tcb.init({ 
      env: envId,
      timeout: 10000,
    })
    console.log('[CloudBase] Initialized without credentials')
  }
} catch (error) {
  initError = error as Error
  console.error('[CloudBase] Init failed:', error)
  // 创建一个空对象避免后续崩溃
  app = {}
}

// 安全地获取数据库实例
export const db = app?.database ? app.database() : {
  collection: () => ({
    add: async () => { throw new Error('CloudBase not initialized') },
    where: () => ({ get: async () => ({ data: [] }), count: async () => ({ total: 0 }) }),
    doc: () => ({ get: async () => ({ data: null }), update: async () => {}, delete: async () => {} }),
  })
}

export const cloudbaseApp = app
export const cloudbaseInitError = initError

export async function testCloudBaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!app?.database) {
      return { success: false, error: 'CloudBase not initialized' }
    }
    await app.database().collection('users').limit(1).get()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
