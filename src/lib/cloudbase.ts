/**
 * CloudBase (腾讯云开发) 数据库客户端 - 真实 SDK 版本
 */

import tcb from '@cloudbase/node-sdk'

// 初始化 CloudBase
const app = tcb.init({
  env: process.env.CLOUDBASE_ENV_ID || 'weight-tracker-1ghr085dd7d6cff2',
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
})

// 获取数据库实例
export const db = app.database()

// 导出 app 供其他用途
export const cloudbaseApp = app
