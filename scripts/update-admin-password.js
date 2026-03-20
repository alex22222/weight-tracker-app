#!/usr/bin/env node

/**
 * 更新管理员密码
 * 新密码：222222
 */

const cloudbase = require('@cloudbase/node-sdk')
const { createHash } = require('crypto')

// 配置
const config = {
  env: process.env.CLOUDBASE_ENV_ID || 'weight-tracker-1ghr085dd7d6cff2',
  secretId: process.env.TENCENTCLOUD_SECRETID,
  secretKey: process.env.TENCENTCLOUD_SECRETKEY,
  timeout: 5000,
}

const ADMIN_USERNAME = 'admin'
const NEW_PASSWORD = '222222'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

async function updateAdminPassword() {
  console.log('========================================')
  console.log('  更新管理员密码')
  console.log('========================================')
  console.log(`环境 ID: ${config.env}`)
  console.log(`管理员用户名: ${ADMIN_USERNAME}`)
  console.log(`新密码: ${NEW_PASSWORD}`)
  console.log('')

  try {
    // 初始化 CloudBase
    console.log('🔄 初始化 CloudBase...')
    const app = cloudbase.init(config)
    const db = app.database()
    console.log('✅ CloudBase 初始化成功')

    // 查找管理员用户
    console.log('')
    console.log('🔄 查找管理员账号...')
    const { data: adminUsers } = await db.collection('users')
      .where({ username: ADMIN_USERNAME })
      .limit(1)
      .get()

    if (adminUsers.length === 0) {
      console.log('❌ 未找到管理员账号')
      return
    }

    const admin = adminUsers[0]
    const newPasswordHash = hashPassword(NEW_PASSWORD)

    console.log(`🔄 更新密码...`)
    console.log(`   用户ID: ${admin._id}`)
    
    // 更新密码
    await db.collection('users')
      .doc(admin._id)
      .update({
        password: newPasswordHash,
        updatedAt: new Date(),
      })

    console.log('')
    console.log('✅ 管理员密码更新成功！')
    console.log('')
    console.log('========================================')
    console.log('  更新完成！')
    console.log('========================================')
    console.log('')
    console.log('新的登录信息：')
    console.log(`用户名: ${ADMIN_USERNAME}`)
    console.log(`密码: ${NEW_PASSWORD}`)
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ 更新失败')
    console.error(`错误信息: ${error.message}`)
    process.exit(1)
  }
}

updateAdminPassword()
