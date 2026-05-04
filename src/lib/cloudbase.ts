/**
 * CloudBase (腾讯云开发) 数据库客户端
 */

import tcb from '@cloudbase/node-sdk'

// 强制使用正确的环境 ID（CloudRun 会自动注入错误的环境变量）
const envId = 'weight-tracker-1ghr085dd7d6cff2'

// 硬编码临时密钥（避免 CloudRun 注入错误的默认值）
// 临时密钥必须配合 sessionToken 使用，否则报 SIGN_PARAM_INVALID
const secretId = 'AKIDYPf2keep7A-hKVfDE0L8CCGxh3zHseUbltbW-Nbd48bxvALJW_qsIPtWToCAYE1L'
const secretKey = 's15q4ImjdnjcJRYqMIzqLNnrzPF1oDBWTEqY4xE372I='
const sessionToken = 'I43rf85VoY1t8OclE6VfTAgMfku98fRa54d3279b55605bf8455335d8e8c83181BW5RGm0C5rRT5NzIg2h2idRtKcCX4fZo-YjzaNQq9OE1oMe0M96wnsGpvs_NpX7U7V8tjqN-UesgXR9e7pJQEH24vpoHbgha2v4uX3-xOqt83UTpgq95THF7xwEhoZ-3E0KGoxTevKljXuB6Ij1tJAZU0V5CzrjgdI3Gde4TflOIRVJRp98OBaI2HeQvH3F0ozLanM0O5evQfTDAoA19XF1I5bYXawxL8ipY2v-8ljH6HgGJZkne9ckamHtIlKS1eYguU4TJpt7N0TG5xGAEeF196D-TTqazjxOn7n7fiAocH-V__DKMFydb9THNE3_3g5Pz4DQEH4XShyi5u8i00TlrvcUy3pEp83EhrFNUY3BxmwyITfhOJR5zUZ2Zz-LsTQkkrSsiHpzzoPvGkQGNSTAk7jwL9yddG8C0iGe9H_U'

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
