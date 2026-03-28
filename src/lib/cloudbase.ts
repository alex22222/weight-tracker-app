/**
 * CloudBase (腾讯云开发) 数据库客户端 - 真实 SDK 版本
 * 支持 CloudBase 云托管环境自动认证
 */

import tcb from '@cloudbase/node-sdk'

// CloudBase 配置
const envId = (process.env.CLOUDBASE_ENV_ID || 'weight-tracker-1ghr085dd7d6cff2').trim()

// 检测是否在 CloudRun 环境
const isCloudRun = !!(
  process.env.KUBERNETES_SERVICE_HOST ||
  process.env.CLOUDBASE_RUN_ENV ||
  process.env.TCB_ENV_ID ||
  process.env.TCB_SECRET_ID ||  // CloudRun 自动注入
  process.env.TCB_SECRET_KEY    // CloudRun 自动注入
)

// 本地开发环境密钥
const localSecretId = process.env.TENCENT_SECRET_ID?.trim()
const localSecretKey = process.env.TENCENT_SECRET_KEY?.trim()

// 初始化 CloudBase
let app: any

if (!isCloudRun && localSecretId && localSecretKey) {
  // 本地开发环境 - 使用密钥
  console.log('[CloudBase] Local mode with credentials')
  app = tcb.init({
    env: envId,
    secretId: localSecretId,
    secretKey: localSecretKey,
  })
} else {
  // CloudRun 环境 - 使用匿名认证（CloudRun 会自动注入权限）
  console.log('[CloudBase] CloudRun mode (anonymous auth)')
  app = tcb.init({
    env: envId,
    // CloudRun 中不需要传密钥，SDK 会自动从环境获取
  })
}

// 获取数据库实例
export const db = app.database()

// 导出 app 供其他用途
export const cloudbaseApp = app
