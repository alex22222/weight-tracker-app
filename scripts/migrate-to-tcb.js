#!/usr/bin/env node

/**
 * 数据迁移脚本: SQLite (Prisma) -> CloudBase
 * 将本地 SQLite 数据迁移到 CloudBase 云数据库
 */

const { PrismaClient } = require('@prisma/client')
const cloudbase = require('@cloudbase/node-sdk')

const prisma = new PrismaClient()

const envId = process.env.CLOUDBASE_ENV_ID
if (!envId || envId === 'your-env-id-here') {
  console.error('❌ 错误: 请设置 CLOUDBASE_ENV_ID 环境变量')
  process.exit(1)
}

const app = cloudbase.init({ env: envId })
const db = app.database()

// 映射表: Prisma 表名 -> CloudBase 集合名
const collections = {
  users: 'users',
  userSettings: 'user_settings',
  weightEntry: 'weight_entries',
  message: 'messages',
  friend: 'friends',
  fitnessChannel: 'fitness_channels',
  channelMember: 'channel_members',
  channelComment: 'channel_comments',
  checkIn: 'check_ins',
  leaveRequest: 'leave_requests',
}

async function migrate() {
  console.log('========================================')
  console.log('  数据迁移: SQLite -> CloudBase')
  console.log('========================================')
  console.log(`\n目标环境: ${envId}\n`)
  
  try {
    // 1. 迁移用户
    await migrateUsers()
    
    // 2. 迁移用户设置
    await migrateUserSettings()
    
    // 3. 迁移体重记录
    await migrateWeightEntries()
    
    // 4. 迁移消息
    await migrateMessages()
    
    // 5. 迁移好友关系
    await migrateFriends()
    
    // 6. 迁移健身频道
    await migrateFitnessChannels()
    
    // 7. 迁移频道成员
    await migrateChannelMembers()
    
    // 8. 迁移频道评论
    await migrateChannelComments()
    
    // 9. 迁移打卡记录
    await migrateCheckIns()
    
    // 10. 迁移请假申请
    await migrateLeaveRequests()
    
    console.log('\n========================================')
    console.log('✨ 迁移完成！')
    console.log('========================================')
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

async function migrateUsers() {
  console.log('👤 迁移用户...')
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    try {
      const { id, ...data } = user
      await db.collection('users').add({
        ...data,
        _oldId: id, // 保留旧 ID 用于关联
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过用户 ${user.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${users.length} 个用户`)
}

async function migrateUserSettings() {
  console.log('⚙️  迁移用户设置...')
  const settings = await prisma.userSettings.findMany()
  
  for (const setting of settings) {
    try {
      const { id, ...data } = setting
      await db.collection('user_settings').add({
        ...data,
        _oldId: id,
      })
    } catch (error) {
      console.log(`   ⚠️  跳过设置 ${setting.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${settings.length} 条用户设置`)
}

async function migrateWeightEntries() {
  console.log('⚖️  迁移体重记录...')
  const entries = await prisma.weightEntry.findMany()
  
  for (const entry of entries) {
    try {
      const { id, ...data } = entry
      await db.collection('weight_entries').add({
        ...data,
        _oldId: id,
        date: data.date || new Date(),
        createdAt: data.createdAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过记录 ${entry.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${entries.length} 条体重记录`)
}

async function migrateMessages() {
  console.log('💬 迁移消息...')
  const messages = await prisma.message.findMany()
  
  for (const message of messages) {
    try {
      const { id, ...data } = message
      await db.collection('messages').add({
        ...data,
        _oldId: id,
        createdAt: data.createdAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过消息 ${message.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${messages.length} 条消息`)
}

async function migrateFriends() {
  console.log('👥 迁移好友关系...')
  const friends = await prisma.friend.findMany()
  
  for (const friend of friends) {
    try {
      const { id, ...data } = friend
      await db.collection('friends').add({
        ...data,
        _oldId: id,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过好友 ${friend.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${friends.length} 条好友关系`)
}

async function migrateFitnessChannels() {
  console.log('🏋️ 迁移健身频道...')
  const channels = await prisma.fitnessChannel.findMany()
  
  for (const channel of channels) {
    try {
      const { id, ...data } = channel
      await db.collection('fitness_channels').add({
        ...data,
        _oldId: id,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过频道 ${channel.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${channels.length} 个健身频道`)
}

async function migrateChannelMembers() {
  console.log('🏃 迁移频道成员...')
  const members = await prisma.channelMember.findMany()
  
  for (const member of members) {
    try {
      const { id, ...data } = member
      await db.collection('channel_members').add({
        ...data,
        _oldId: id,
        joinedAt: data.joinedAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过成员 ${member.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${members.length} 个频道成员`)
}

async function migrateChannelComments() {
  console.log('💭 迁移频道评论...')
  const comments = await prisma.channelComment.findMany()
  
  for (const comment of comments) {
    try {
      const { id, ...data } = comment
      await db.collection('channel_comments').add({
        ...data,
        _oldId: id,
        createdAt: data.createdAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过评论 ${comment.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${comments.length} 条频道评论`)
}

async function migrateCheckIns() {
  console.log('✅ 迁移打卡记录...')
  const checkIns = await prisma.checkIn.findMany()
  
  for (const checkIn of checkIns) {
    try {
      const { id, ...data } = checkIn
      await db.collection('check_ins').add({
        ...data,
        _oldId: id,
        checkDate: data.checkDate || new Date(),
        createdAt: data.createdAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过打卡 ${checkIn.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${checkIns.length} 条打卡记录`)
}

async function migrateLeaveRequests() {
  console.log('📝 迁移请假申请...')
  const requests = await prisma.leaveRequest.findMany()
  
  for (const request of requests) {
    try {
      const { id, ...data } = request
      await db.collection('leave_requests').add({
        ...data,
        _oldId: id,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
        createdAt: data.createdAt || new Date(),
      })
    } catch (error) {
      console.log(`   ⚠️  跳过请假 ${request.id}: ${error.message}`)
    }
  }
  console.log(`   ✅ 已迁移 ${requests.length} 条请假申请`)
}

migrate()
