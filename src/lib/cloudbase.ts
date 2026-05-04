/**
 * CloudBase (腾讯云开发) 数据库客户端
 */

import tcb from '@cloudbase/node-sdk'

// 强制使用正确的环境 ID（CloudRun 会自动注入错误的环境变量）
const envId = 'weight-tracker-1ghr085dd7d6cff2'

// 硬编码临时密钥（避免 CloudRun 注入错误的默认值）
// 临时密钥必须配合 sessionToken 使用，否则报 SIGN_PARAM_INVALID
const secretId = 'AKIDkpKzFrfMF384Gd7CVW9AKBObUxvRsK91WeO0_5Xa5J-byNi9s3BRhg_odDuNnHwd'
const secretKey = 'SKbKNgejvZN8GClZtHkawc0SwzAbUyZYWzwcVQffMQc='
const sessionToken = 'I43rf85VoY1t8OclE6VfTAgMfku98fRa9d9621a44ce81d41ec2037316cb1b182BW5RGm0C5rRT5NzIg2h2iQUdv5DLltdjI3Skrtjx186W_WhL1V42Y9jhTEJwBijnh9xG4R0nwcfb30d7BZUxotLxyWGDo-NEiscl6t65WvSXY1qmXtoOiF5W0qfIK2ukORGOOWnzCvciJG_kMDsduKZVWxyKCELX9LRWWBQM_rHJ71kGInIQfkDrLC2R6TFpzTA9D8k7-ZSIH2OL8cWLPLfI0yNcCVO2Kr3OsCtW6e7hQtL51n5kRp3Seh0FJ_E6D-lRwZUiQ4djW6E1uIPoiDbNMYlmzYfWvoAdy2bxKxxIUt2mQGWR1CGR4JbQHUhyBSScOU7Tt4-yqyVs0yh-8GhfRT9XTyPytpoOyygY5rAK6RnEtVERxlwPQsUvS7ju0-OAg2QLxHe1YY3xXSZILw'

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

// 将 CloudBase fileID (cloud://...) 转换为临时访问 URL
export async function resolveFileUrl(fileIDOrUrl?: string | null): Promise<string | null> {
  if (!fileIDOrUrl) return null
  // 如果不是 cloud:// 格式，直接返回（可能是 http URL 或 emoji）
  if (!fileIDOrUrl.startsWith('cloud://')) return fileIDOrUrl
  try {
    if (!app?.getTempFileURL) return fileIDOrUrl
    const result = await app.getTempFileURL({ fileList: [fileIDOrUrl] })
    if (result.fileList?.[0]?.tempFileURL) {
      return result.fileList[0].tempFileURL
    }
    return fileIDOrUrl
  } catch (e) {
    console.error('[resolveFileUrl] Failed to resolve:', fileIDOrUrl, e)
    return fileIDOrUrl
  }
}

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
