#!/usr/bin/env node

/**
 * 初始化管理员账号
 * 用户名：admin，密码：admin
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

// 管理员信息
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '222222'
const ADMIN_ROLE = 'admin'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

async function initAdmin() {
  console.log('========================================')
  console.log('  初始化管理员账号')
  console.log('========================================')
  console.log(`环境 ID: ${config.env}`)
  console.log(`管理员用户名: ${ADMIN_USERNAME}`)
  console.log(`管理员密码: ${ADMIN_PASSWORD}`)
  console.log('')

  try {
    // 初始化 CloudBase
    console.log('🔄 初始化 CloudBase...')
    const app = cloudbase.init(config)
    const db = app.database()
    console.log('✅ CloudBase 初始化成功')

    // 检查管理员是否已存在
    console.log('')
    console.log('🔄 检查管理员账号是否存在...')
    const { data: existingAdmin } = await db.collection('users')
      .where({ username: ADMIN_USERNAME })
      .limit(1)
      .get()

    if (existingAdmin.length > 0) {
      console.log('⚠️  管理员账号已存在，更新密码和权限...')
      
      // 更新现有管理员
      await db.collection('users')
        .doc(existingAdmin[0]._id)
        .update({
          password: hashPassword(ADMIN_PASSWORD),
          role: ADMIN_ROLE,
          updatedAt: new Date(),
        })
      
      console.log('✅ 管理员账号已更新')
    } else {
      console.log('🔄 创建新的管理员账号...')
      
      // 创建管理员账号
      const adminUser = {
        username: ADMIN_USERNAME,
        password: hashPassword(ADMIN_PASSWORD),
        role: ADMIN_ROLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      const { id } = await db.collection('users').add(adminUser)
      console.log(`✅ 管理员账号创建成功，ID: ${id}`)
    }

    console.log('')
    console.log('========================================')
    console.log('  管理员账号初始化完成！')
    console.log('========================================')
    console.log('')
    console.log('管理员登录信息：')
    console.log(`用户名: ${ADMIN_USERNAME}`)
    console.log(`密码: ${ADMIN_PASSWORD}`)
    console.log('')
    console.log('管理员功能：')
    console.log('- 查看所有用户信息')
    console.log('- 管理用户数据')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ 初始化失败')
    console.error(`错误信息: ${error.message}`)
    process.exit(1)
  }
}

initAdmin()
