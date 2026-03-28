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

if (secretId && secretKey) {
  // 使用密钥认证（CloudRun 或本地开发）
  console.log('[CloudBase] Using credential auth')
  app = tcb.init({
    env: envId,
    secretId: secretId,
    secretKey: secretKey,
  })
} else {
  // 匿名认证（仅适用于某些特定环境）
  console.log('[CloudBase] Using anonymous auth')
  app = tcb.init({
    env: envId,
  })
}

// 获取数据库实例
export const db = app.database()

// 导出 app 供其他用途
export const cloudbaseApp = app
