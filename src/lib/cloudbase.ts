/**
 * CloudBase (腾讯云开发) 数据库客户端
 */

import tcb from '@cloudbase/node-sdk'

// 强制使用正确的环境 ID（CloudRun 会自动注入错误的环境变量）
const envId = 'weight-tracker-1ghr085dd7d6cff2'

// 硬编码临时密钥（避免 CloudRun 注入错误的默认值）
// 临时密钥必须配合 sessionToken 使用，否则报 SIGN_PARAM_INVALID
const secretId = 'AKIDlhNtN4-hwzBgDIt1Md0j9NyNOaPA1A3T7MGmVwll2Wx8vaqDKKjE4MeYJtkY8zV3'
const secretKey = 'khikgrrb/VDlpEljCYQYjVvSk0zSvHz36gQWiw1uFCI='
const sessionToken = 'OcclGwV1Ri6zvd9gjDrueacOG1jK79Ta424f08dca35aae55abd2c8aabe88b473vwYVbz7PFfGu2IW-bFQWaEIco9an3RLzCP9TI8-P44wdrOhbxBRokNYsCZeWhdRn7DjXaPGvY6YfMm3f-zbOIAMbQ67b8cJBk7ht6t5lXj8nEwnyxjK60CdJwnFjD-Jj9Q-FkiiBpkxSJvB3d1nI4MqVdIyYHAXIWQOKVf47DOPDAqW9GbW4fH9wRArRq73BQIWVpe5Jhuw74EAfisuVulWM9jIXsondPbo-e4BEqzHRW4bZV4bTO0TEVz0T3-H-BHkdBCA5zCurEWPZf5PmJFzkHjCDFO--qEwx057ahNSfp9ny0Itugaqg36SEYhV1_V2eGTEy0Q9fnvGttmSyqCVOgx95tCr1MzqT7wKtmrtq8eLq_Mrj6gB-e8h3UeED17Z2sT79kQKi8PmML6HufEuozkympXxcV3lQIaVNDfY'

// 清除 CloudRun 可能注入的错误环境变量，防止 SDK 内部误用
if (process.env.TENCENT_SECRET_ID) {
  console.log('[CloudBase] Removing injected TENCENT_SECRET_ID')
  delete (process.env as any).TENCENT_SECRET_ID
}
if (process.env.TENCENT_SECRET_KEY) {
  console.log('[CloudBase] Removing injected TENCENT_SECRET_KEY')
  delete (process.env as any).TENCENT_SECRET_KEY
}

console.log('[CloudBase] Env:', envId)
console.log('[CloudBase] Has SecretId:', !!secretId)
console.log('[CloudBase] Has SecretKey:', !!secretKey)
console.log('[CloudBase] Has SessionToken:', !!sessionToken)

let app: any = null
let initError: Error | null = null

try {
  if (secretId && secretKey) {
    console.log('[CloudBase] Initializing with credentials + sessionToken')
    app = tcb.init({
      env: envId,
      secretId,
      secretKey,
      sessionToken,
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
