#!/usr/bin/env node

/**
 * 测试 CloudBase 数据库连接
 */

const cloudbase = require('@cloudbase/node-sdk')

// 配置
const config = {
  env: 'weight-tracker-1ghr085dd7d6cff2',
  secretId: process.env.TENCENTCLOUD_SECRETID,
  secretKey: process.env.TENCENTCLOUD_SECRETKEY,
  timeout: 5000,
}

console.log('========================================')
console.log('  CloudBase 连接测试')
console.log('========================================')
console.log(`环境 ID: ${config.env}`)
console.log(`当前时间: ${new Date().toLocaleString()}`)
console.log('')

async function testConnection() {
  try {
    // 初始化 CloudBase
    console.log('🔄 初始化 CloudBase...')
    const app = cloudbase.init(config)
    const db = app.database()
    console.log('✅ CloudBase 初始化成功')
    
    // 测试数据库连接
    console.log('')
    console.log('🔄 测试数据库连接...')
    
    // 查询 weight_entries 集合
    console.log('   查询 weight_entries 集合...')
    const weightResult = await db.collection('weight_entries').limit(1).get()
    console.log(`   ✅ weight_entries: ${weightResult.data.length} 条记录`)
    
    // 查询 users 集合
    console.log('   查询 users 集合...')
    const usersResult = await db.collection('users').limit(1).get()
    console.log(`   ✅ users: ${usersResult.data.length} 条记录`)
    
    // 查询 user_settings 集合
    console.log('   查询 user_settings 集合...')
    const settingsResult = await db.collection('user_settings').limit(1).get()
    console.log(`   ✅ user_settings: ${settingsResult.data.length} 条记录`)
    
    console.log('')
    console.log('✅ 数据库连接测试成功！')
    
    // 测试写入（可选）
    console.log('')
    console.log('🔄 测试写入数据...')
    try {
      const testData = {
        weight: 70.5,
        note: '测试数据',
        date: new Date(),
        createdAt: new Date(),
      }
      
      const { id } = await db.collection('weight_entries').add(testData)
      console.log(`   ✅ 写入成功，记录 ID: ${id}`)
      
      // 清理测试数据
      await db.collection('weight_entries').doc(id).remove()
      console.log('   ✅ 测试数据已清理')
    } catch (writeError) {
      console.log(`   ⚠️  写入测试失败: ${writeError.message}`)
      console.log('   这可能是权限问题，请在控制台检查安全规则')
    }
    
    console.log('')
    console.log('========================================')
    console.log('  测试完成！')
    console.log('========================================')
    
  } catch (error) {
    console.error('')
    console.error('❌ 连接测试失败')
    console.error(`错误信息: ${error.message}`)
    console.error(`错误代码: ${error.code}`)
    console.error('')
    console.error('请检查:')
    console.error('1. 环境 ID 是否正确: weight-tracker-1ghr085dd7d6cff2')
    console.error('2. secretId 和 secretKey 是否有效')
    console.error('3. 网络连接是否正常')
    process.exit(1)
  }
}

testConnection()
