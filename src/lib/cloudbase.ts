/**
 * CloudBase (腾讯云开发) 数据库客户端 - 真实 SDK 版本
 * 支持 CloudBase 云托管环境自动认证
 */

import tcb from '@cloudbase/node-sdk'

// CloudBase 配置
const envId = (process.env.CLOUDBASE_ENV_ID || 'weight-tracker-1ghr085dd7d6cff2').trim()

// 尝试获取各种可能的环境变量
const tcbSecretId = process.env.TCB_SECRET_ID?.trim()
const tcbSecretKey = process.env.TCB_SECRET_KEY?.trim()
const localSecretId = process.env.TENCENT_SECRET_ID?.trim()
const localSecretKey = process.env.TENCENT_SECRET_KEY?.trim()

// 确定使用哪组密钥
const secretId = tcbSecretId || localSecretId
const secretKey = tcbSecretKey || localSecretKey

// 初始化 CloudBase
let app: any
let initError: Error | null = null

try {
  if (secretId && secretKey) {
    // 使用密钥认证（CloudRun 或本地开发）
    console.log('[CloudBase] Using credential auth with env:', envId)
    app = tcb.init({
      env: envId,
      secretId: secretId,
      secretKey: secretKey,
    })
  } else {
    // 匿名认证（仅适用于某些特定环境）
    console.log('[CloudBase] Using anonymous auth with env:', envId)
    app = tcb.init({
      env: envId,
    })
  }
  console.log('[CloudBase] Initialized successfully')
} catch (error) {
  initError = error as Error
  console.error('[CloudBase] Initialization failed:', error)
  // 创建一个空的 app 对象防止崩溃
  app = {}
}

// 获取数据库实例
export const db = app.database ? app.database() : {}

// 导出 app 供其他用途
export const cloudbaseApp = app
export const cloudbaseInitError = initError

// 测试连接函数
export async function testCloudBaseConnection(): Promise<{ success: boolean; error?: string; collections?: string[] }> {
  try {
    if (!app.database) {
      return { success: false, error: 'CloudBase app not initialized' }
    }
    
    const database = app.database()
    // 尝试获取集合列表来测试连接
    try {
      // 尝试查询 users 集合
      const testResult = await database.collection('users').limit(1).get()
      console.log('[CloudBase] Connection test successful, users count:', testResult.data?.length || 0)
      return { 
        success: true, 
        collections: ['users'] 
      }
    } catch (e: any) {
      console.error('[CloudBase] Connection test failed:', e)
      return { 
        success: false, 
        error: e.message || 'Connection failed' 
      }
    }
  } catch (error: any) {
    console.error('[CloudBase] Test connection error:', error)
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    }
  }
}

// 初始化时测试连接
testCloudBaseConnection().then(result => {
  if (result.success) {
    console.log('[CloudBase] ✅ Database connection verified')
  } else {
    console.error('[CloudBase] ❌ Database connection failed:', result.error)
  }
})
