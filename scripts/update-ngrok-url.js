#!/usr/bin/env node

/**
 * 自动更新 ngrok URL 到小程序配置
 * 使用方法: node scripts/update-ngrok-url.js https://xxxx.ngrok-free.app
 */

const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '..', 'weapp', 'config.js')

// 获取命令行参数
const ngrokUrl = process.argv[2]

if (!ngrokUrl) {
  console.error('❌ 请提供 ngrok URL')
  console.error('用法: node scripts/update-ngrok-url.js https://xxxx.ngrok-free.app')
  process.exit(1)
}

// 验证 URL 格式
if (!ngrokUrl.startsWith('http')) {
  console.error('❌ 无效的 URL，必须以 http 或 https 开头')
  process.exit(1)
}

// 读取当前配置
let configContent = fs.readFileSync(configPath, 'utf8')

// 替换 apiBaseUrl
const newUrl = ngrokUrl.replace(/\/$/, '') + '/api'  // 确保以 /api 结尾
const updatedContent = configContent.replace(
  /apiBaseUrl:\s*['"][^'"]+['"]/,
  `apiBaseUrl: '${newUrl}'`
)

// 写回文件
fs.writeFileSync(configPath, updatedContent)

console.log('✅ 已更新小程序配置')
console.log(`   apiBaseUrl: ${newUrl}`)
console.log('')
console.log('📱 下一步:')
console.log('   1. 在微信开发者工具中按 Cmd+R 重新编译')
console.log('   2. 确保开启「不校验合法域名」设置')
