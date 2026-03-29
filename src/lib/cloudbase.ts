/**
 * CloudBase (腾讯云开发) 数据库客户端
 */

import tcb from '@cloudbase/node-sdk'

const envId = (process.env.CLOUDBASE_ENV_ID || 'weight-tracker-1ghr085dd7d6cff2').trim()

// 获取密钥 - CloudRun 会自动注入 TCB_SECRET_ID 和 TCB_SECRET_KEY
const secretId = process.env.TCB_SECRET_ID?.trim()
const secretKey = process.env.TCB_SECRET_KEY?.trim()

console.log('[CloudBase] Env:', envId)
console.log('[CloudBase] Has SecretId:', !!secretId)
console.log('[CloudBase] Has SecretKey:', !!secretKey)

let app: any
let initError: Error | null = null

try {
  if (secretId && secretKey) {
    console.log('[CloudBase] Initializing with credentials')
    app = tcb.init({
      env: envId,
      secretId,
      secretKey,
    })
  } else {
    console.log('[CloudBase] No credentials, using default init')
    app = tcb.init({ env: envId })
  }
  console.log('[CloudBase] Initialized')
} catch (error) {
  initError = error as Error
  console.error('[CloudBase] Init failed:', error)
  app = {}
}

export const db = app.database ? app.database() : {}
export const cloudbaseApp = app
export const cloudbaseInitError = initError

export async function testCloudBaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!app.database) return { success: false, error: 'Not initialized' }
    await app.database().collection('users').limit(1).get()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
