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

// 从环境变量获取腾讯云凭证
const secretId = process.env.TENCENTCLOUD_SECRETID
const secretKey = process.env.TENCENTCLOUD_SECRETKEY

// 初始化 CloudBase
const app = cloudbase.init({ 
  env: envId,
  secretId,
  secretKey,
})
const db = app.database()

// 集合配置 - 包含所有业务需要的集合和索引
const collections = [
  {
    name: 'weight_entries',
    description: '体重记录',
    indexes: [
      { field: 'date', type: 'desc' },
      { field: 'createdAt', type: 'desc' },
      { field: 'userId', type: 'asc' },
    ],
  },
  {
    name: 'users',
    description: '用户信息',
    indexes: [
      { field: 'username', type: 'asc', unique: true },
      { field: 'wechatOpenId', type: 'asc' },
      { field: 'createdAt', type: 'desc' },
    ],
  },
  {
    name: 'user_settings',
    description: '用户设置',
    indexes: [
      { field: 'userId', type: 'asc' },
    ],
  },
  {
    name: 'messages',
    description: '系统消息',
    indexes: [
      { field: 'toUserId', type: 'asc' },
      { field: 'createdAt', type: 'desc' },
      { field: 'isRead', type: 'asc' },
      { field: 'type', type: 'asc' },
    ],
  },
  {
    name: 'friends',
    description: '好友关系',
    indexes: [
      { field: 'fromUserId', type: 'asc' },
      { field: 'toUserId', type: 'asc' },
      { field: 'status', type: 'asc' },
      { field: 'createdAt', type: 'desc' },
    ],
  },
  {
    name: 'fitness_channels',
    description: '健身频道',
    indexes: [
      { field: 'ownerId', type: 'asc' },
      { field: 'status', type: 'asc' },
      { field: 'startDate', type: 'asc' },
      { field: 'endDate', type: 'asc' },
      { field: 'createdAt', type: 'desc' },
    ],
  },
  {
    name: 'channel_members',
    description: '频道成员',
    indexes: [
      { field: 'channelId', type: 'asc' },
      { field: 'userId', type: 'asc' },
      { field: 'joinedAt', type: 'desc' },
    ],
  },
  {
    name: 'channel_comments',
    description: '频道评论',
    indexes: [
      { field: 'channelId', type: 'asc' },
      { field: 'createdAt', type: 'desc' },
      { field: 'userId', type: 'asc' },
    ],
  },
  {
    name: 'check_ins',
    description: '打卡记录',
    indexes: [
      { field: 'channelId', type: 'asc' },
      { field: 'userId', type: 'asc' },
      { field: 'checkDate', type: 'desc' },
      { field: 'createdAt', type: 'desc' },
    ],
  },
  {
    name: 'leave_requests',
    description: '请假申请',
    indexes: [
      { field: 'channelId', type: 'asc' },
      { field: 'userId', type: 'asc' },
      { field: 'status', type: 'asc' },
      { field: 'createdAt', type: 'desc' },
    ],
  },
]

// 初始化所有集合
async function initCollections() {
  console.log('\n📦 检查并创建集合...')
  
  for (const collection of collections) {
    try {
      // 尝试访问集合，如果不存在会报错
      await db.collection(collection.name).limit(1).get()
      console.log(`✅ 集合已存在: ${collection.name} (${collection.description})`)
    } catch (error) {
      // 集合可能不存在，尝试添加文档来创建集合
      try {
        // CloudBase 集合会在第一次写入时自动创建
        // 我们添加一个占位文档然后删除它
        const { id } = await db.collection(collection.name).add({
          _init: true,
          createdAt: new Date(),
        })
        await db.collection(collection.name).doc(id).remove()
        console.log(`✅ 创建集合: ${collection.name} (${collection.description})`)
      } catch (createError) {
        console.log(`⚠️  请手动创建集合: ${collection.name} (${collection.description})`)
        console.log(`   错误: ${createError.message}`)
      }
    }
  }
}

// 创建索引
async function createIndexes() {
  console.log('\n📊 创建索引...')
  
  for (const collection of collections) {
    if (!collection.indexes || collection.indexes.length === 0) continue
    
    for (const index of collection.indexes) {
      try {
        // 创建索引
        await db.collection(collection.name).createIndex({
          field: index.field,
          type: index.type || 'asc',
        })
        console.log(`✅ ${collection.name} 索引: ${index.field} (${index.type})`)
      } catch (error) {
        // 索引可能已存在
        console.log(`⚠️  ${collection.name} 索引: ${index.field} (${error.message || '已存在'})`)
      }
    }
  }
}

// 显示安全规则配置
async function showSecurityRules() {
  console.log('\n🔒 安全规则配置（请在 CloudBase 控制台手动配置）:')
  console.log('   控制台地址: https://tcb.cloud.tencent.com/')
  console.log('\n推荐配置（开发环境）:\n')
  
  const rules = {}
  collections.forEach(collection => {
    rules[collection.name] = {
      read: true,
      write: true,
    }
  })
  
  console.log(JSON.stringify(rules, null, 2))
  
  console.log('\n推荐配置（生产环境 - 需配合微信登录）:\n')
  const prodRules = {}
  collections.forEach(collection => {
    prodRules[collection.name] = {
      read: 'auth != null',
      write: 'auth != null',
    }
  })
  console.log(JSON.stringify(prodRules, null, 2))
}

// 添加默认数据
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
    console.log(`⚠️  跳过添加默认数据: ${error.message}`)
  }
}

// 验证数据库连接
async function verifyConnection() {
  console.log('\n🔌 验证数据库连接...')
  
  try {
    const { data } = await db.collection('users').limit(1).get()
    console.log(`✅ 数据库连接正常`)
    return true
  } catch (error) {
    console.error(`❌ 数据库连接失败: ${error.message}`)
    return false
  }
}

// 主函数
async function main() {
  try {
    console.log('========================================')
    console.log('  CloudBase 数据库初始化工具')
    console.log('========================================')
    
    // 验证连接
    const connected = await verifyConnection()
    if (!connected) {
      console.log('\n⚠️  警告: 数据库连接失败，请检查:')
      console.log('   1. CLOUDBASE_ENV_ID 是否正确')
      console.log('   2. CloudBase 环境是否已开通数据库')
      console.log('   3. 网络连接是否正常')
      process.exit(1)
    }
    
    // 初始化集合
    await initCollections()
    
    // 创建索引
    await createIndexes()
    
    // 显示安全规则
    await showSecurityRules()
    
    // 添加默认数据
    await addDefaultData()
    
    console.log('\n========================================')
    console.log('✨ 初始化完成！')
    console.log('========================================')
    console.log('\n下一步操作:')
    console.log('1. 在 CloudBase 控制台配置安全规则')
    console.log('2. 更新 .env.local 文件:')
    console.log('   DB_TYPE=cloudbase')
    console.log('   CLOUDBASE_ENV_ID=' + envId)
    console.log('3. 运行 npm run dev 测试本地连接')
    console.log('4. 运行 ./deploy.sh 部署到云端')
    
  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()
