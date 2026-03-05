import cloudbase from '@cloudbase/node-sdk'

// CloudBase 配置
const config = {
  // CloudBase 环境ID
  env: process.env.CLOUDBASE_ENV_ID || 'weight-tracker-1ghr085dd7d6cff2',
  
  // 腾讯云凭证
  secretId: process.env.TENCENTCLOUD_SECRETID,
  secretKey: process.env.TENCENTCLOUD_SECRETKEY,
  
  // 超时时间（毫秒）
  timeout: 5000,
}

// 初始化 CloudBase 实例
const app = cloudbase.init({
  env: config.env,
  secretId: config.secretId,
  secretKey: config.secretKey,
  timeout: config.timeout,
})

// 数据库实例
export const db = app.database()

// 导出配置
export { config }
