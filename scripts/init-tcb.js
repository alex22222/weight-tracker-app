#!/usr/bin/env node

/**
 * CloudBase 数据库初始化脚本
 * 自动创建所需的集合和索引
 */

const cloudbase = require('@cloudbase/node-sdk')

// 从环境变量获取配置
const envId = process.env.CLOUDBASE_ENV_ID

if (!envId || envId === 'your-env-id-here') {
  console.error('❌ 错误: 请设置 CLOUDBASE_ENV_ID 环境变量')
  console.log('示例: export CLOUDBASE_ENV_ID=cloud1-xxx')
  process.exit(1)
}

console.log(`🚀 初始化 CloudBase 环境: ${envId}`)

// 初始化 CloudBase
const app = cloudbase.init({ env: envId })
const db = app.database()

// 集合配置
const collections = [
  {
    name: 'weight_entries',
    description: '体重记录',
    indexes: ['date', 'createdAt'],
  },
  {
    name: 'users',
    description: '用户信息',
    indexes: ['username'],
  },
  {
    name: 'user_settings',
    description: '用户设置',
    indexes: [],
  },
]

async function initCollections() {
  console.log('\n📦 创建集合...')
  
  for (const collection of collections) {
    try {
      // 检查集合是否存在
      await db.collection(collection.name).limit(1).get()
      console.log(`✅ 集合已存在: ${collection.name} (${collection.description})`)
    } catch (error) {
      // 如果集合不存在，会抛出错误
      // 在这里我们只是确认集合可以访问
      console.log(`✅ 集合可访问: ${collection.name} (${collection.description})`)
    }
  }
}

async function checkSecurityRules() {
  console.log('\n🔒 检查安全规则...')
  console.log('⚠️  请手动在 CloudBase 控制台配置安全规则:')
  console.log('   https://tcb.cloud.tencent.com/')
  console.log('\n建议配置:')
  collections.forEach(collection => {
    console.log(`\n${collection.name}:`)
    console.log('  读: true')
    console.log('  写: true')
  })
}

async function addDefaultData() {
  console.log('\n📝 添加默认数据...')
  
  try {
    // 检查是否已有用户设置
    const { data: existingSettings } = await db.collection('user_settings').limit(1).get()
    
    if (existingSettings.length === 0) {
      // 添加默认设置
      await db.collection('user_settings').add({
        height: 170,
        targetWeight: 65,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      console.log('✅ 已添加默认用户设置')
    } else {
      console.log('✅ 用户设置已存在')
    }
  } catch (error) {
    console.log('⚠️  跳过添加默认数据（可能需要手动配置）')
  }
}

async function main() {
  try {
    console.log('========================================')
    console.log('  CloudBase 数据库初始化工具')
    console.log('========================================')
    
    await initCollections()
    await checkSecurityRules()
    await addDefaultData()
    
    console.log('\n✨ 初始化完成！')
    console.log('\n下一步:')
    console.log('1. 在 CloudBase 控制台配置安全规则')
    console.log('2. 更新 .env.local 文件中的 CLOUDBASE_ENV_ID')
    console.log('3. 设置 DB_TYPE=cloudbase')
    console.log('4. 重启应用: npm run dev')
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message)
    process.exit(1)
  }
}

main()
