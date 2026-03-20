#!/usr/bin/env node

/**
 * CloudBase 数据库重置脚本
 * 警告: 此脚本会清空所有数据！
 */

const cloudbase = require('@cloudbase/node-sdk')
const readline = require('readline')

const envId = process.env.CLOUDBASE_ENV_ID

if (!envId || envId === 'your-env-id-here') {
  console.error('❌ 错误: 请设置 CLOUDBASE_ENV_ID 环境变量')
  process.exit(1)
}

const app = cloudbase.init({ env: envId })
const db = app.database()

const collections = [
  'weight_entries',
  'users',
  'user_settings',
  'messages',
  'friends',
  'fitness_channels',
  'channel_members',
  'channel_comments',
  'check_ins',
  'leave_requests',
]

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log('⚠️  警告: 此操作将删除所有数据！')
console.log(`环境 ID: ${envId}`)
console.log('受影响的集合:', collections.join(', '))

rl.question('\n请输入 "DELETE" 确认删除所有数据: ', (answer) => {
  if (answer !== 'DELETE') {
    console.log('❌ 操作已取消')
    rl.close()
    process.exit(0)
  }

  resetDatabase().then(() => {
    rl.close()
    process.exit(0)
  }).catch((error) => {
    console.error('❌ 重置失败:', error.message)
    rl.close()
    process.exit(1)
  })
})

async function resetDatabase() {
  console.log('\n🗑️  开始清空数据...')
  
  for (const collectionName of collections) {
    try {
      // 删除集合中的所有文档
      const { deleted } = await db.collection(collectionName).where({}).remove()
      console.log(`✅ ${collectionName}: 已删除 ${deleted || 0} 条数据`)
    } catch (error) {
      console.log(`⚠️  ${collectionName}: ${error.message}`)
    }
  }
  
  console.log('\n✨ 重置完成！')
}
