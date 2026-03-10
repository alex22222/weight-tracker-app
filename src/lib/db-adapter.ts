/**
 * 数据库适配器
 * 支持在 Prisma (SQLite) 和 CloudBase 数据库之间切换
 */

import { prisma } from './db'
import { db as tcbDb } from './cloudbase'

// 日期格式化辅助函数：将 Date 转换为 YYYY-MM-DD 字符串
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 数据库类型
export type DatabaseType = 'prisma' | 'cloudbase'

// 当前使用的数据库类型
export const CURRENT_DB: DatabaseType = process.env.DB_TYPE === 'cloudbase' ? 'cloudbase' : 'prisma'

// 集合/表名称映射
export const COLLECTIONS = {
  WEIGHT_ENTRIES: 'weight_entries',
  USERS: 'users',
  USER_SETTINGS: 'user_settings',
  MESSAGES: 'messages',
  FRIENDS: 'friends',
  FITNESS_CHANNELS: 'fitness_channels',
  CHANNEL_MEMBERS: 'channel_members',
  CHECK_INS: 'check_ins',
}

// ==================== 常量定义 ====================

export const MessageType = {
  SYSTEM_LOGIN: 'SYSTEM_LOGIN',
  SYSTEM_PASSWORD: 'SYSTEM_PASSWORD',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_ACCEPT: 'FRIEND_ACCEPT',
  FRIEND_REJECT: 'FRIEND_REJECT',
  CHANNEL_INVITE: 'CHANNEL_INVITE',      // 频道邀请
  CHANNEL_JOINED: 'CHANNEL_JOINED',       // 有人加入频道
  CHANNEL_CHECKIN: 'CHANNEL_CHECKIN',     // 有人打卡
} as const

export type MessageTypeValue = typeof MessageType[keyof typeof MessageType]

export const FriendStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
} as const

export type FriendStatusValue = typeof FriendStatus[keyof typeof FriendStatus]

// 健身频道状态
export const ChannelStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const

export type ChannelStatusValue = typeof ChannelStatus[keyof typeof ChannelStatus]

// ==================== 数据模型接口 ====================

export interface WeightEntry {
  _id?: string
  id?: number
  weight: number
  note?: string
  date: Date
  createdAt?: Date
  userId?: number | string
  _openid?: string
}

export interface User {
  _id?: string
  id?: number
  username: string
  password: string
  gender?: string  // 性别: male, female, other
  avatar?: string  // 头像URL
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date
  _openid?: string
}

export interface UserSettings {
  _id?: string
  id?: number
  height: number
  targetWeight: number
  createdAt?: Date
  updatedAt?: Date
  _openid?: string
}

export interface Message {
  _id?: string
  id?: number
  type: MessageTypeValue
  title: string
  content: string
  isRead?: boolean
  createdAt?: Date
  fromUserId?: number | string
  toUserId: number | string
  fromUser?: User
  relatedData?: string
}

export interface Friend {
  _id?: string
  id?: number
  status: FriendStatusValue
  createdAt?: Date
  updatedAt?: Date
  fromUserId: number | string
  toUserId: number | string
  fromUser?: User
  toUser?: User
}

// 健身频道
export interface FitnessChannel {
  _id?: string
  id?: number
  name: string
  description?: string
  status: ChannelStatusValue
  startDate: Date
  endDate: Date
  weeklyCheckInCount?: number // 每周至少打卡次数
  checkInMinutes?: number // 每次打卡分钟数
  createdAt?: Date
  updatedAt?: Date
  ownerId: number | string
  owner?: User
  members?: ChannelMember[]
  checkIns?: CheckIn[]
}

// 频道成员
export interface ChannelMember {
  _id?: string
  id?: number
  joinedAt?: Date
  channelId: number | string
  userId: number | string
  user?: User
  channel?: FitnessChannel
}

// 打卡记录
export interface CheckIn {
  _id?: string
  id?: number
  checkDate: Date
  duration?: number // 打卡时长（分钟）
  note?: string
  imageUrl?: string
  createdAt?: Date
  channelId: number | string
  userId: number | string
  user?: User
  channel?: FitnessChannel
}

// ==================== Prisma 适配器 ====================

const prismaAdapter = {
  // ========== 体重记录 ==========
  async getWeightEntries(userId?: number) {
    const where = userId ? { userId } : {}
    return prisma.weightEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    })
  },

  async createWeightEntry(data: Omit<WeightEntry, '_id' | 'createdAt'>) {
    return prisma.weightEntry.create({
      data: {
        weight: data.weight,
        note: data.note || null,
        date: data.date,
        userId: data.userId as number || 1,
      },
    })
  },

  async deleteWeightEntry(id: string | number) {
    return prisma.weightEntry.delete({
      where: { id: typeof id === 'string' ? parseInt(id) : id },
    })
  },

  // ========== 用户 ==========
  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    })
  },

  async findUserById(id: number | string) {
    return prisma.user.findUnique({
      where: { id: typeof id === 'string' ? parseInt(id) : id },
    })
  },

  async createUser(data: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'id'>) {
    return prisma.user.create({
      data: {
        username: data.username,
        password: data.password,
      },
    })
  },

  async updateUserLoginTime(userId: number | string) {
    return prisma.user.update({
      where: { id: typeof userId === 'string' ? parseInt(userId) : userId },
      data: { lastLoginAt: new Date() },
    })
  },

  async updateUserPassword(userId: number | string, newPassword: string) {
    return prisma.user.update({
      where: { id: typeof userId === 'string' ? parseInt(userId) : userId },
      data: { password: newPassword },
    })
  },

  async updateUserGender(userId: number | string, gender: string) {
    return prisma.user.update({
      where: { id: typeof userId === 'string' ? parseInt(userId) : userId },
      data: { gender },
    })
  },

  async updateUserAvatar(userId: number | string, avatar: string) {
    return prisma.user.update({
      where: { id: typeof userId === 'string' ? parseInt(userId) : userId },
      data: { avatar },
    })
  },

  async getUserProfile(userId: number | string) {
    return prisma.user.findUnique({
      where: { id: typeof userId === 'string' ? parseInt(userId) : userId },
      select: {
        id: true,
        username: true,
        gender: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })
  },

  // ========== 用户设置 ==========
  async getUserSettings() {
    const settings = await prisma.userSettings.findFirst()
    if (!settings) {
      return prisma.userSettings.create({
        data: {
          height: 170,
          targetWeight: 65,
        },
      })
    }
    return settings
  },

  async updateUserSettings(data: Partial<UserSettings>) {
    const existing = await prisma.userSettings.findFirst()
    if (existing) {
      return prisma.userSettings.update({
        where: { id: existing.id },
        data: {
          height: data.height ?? existing.height,
          targetWeight: data.targetWeight ?? existing.targetWeight,
        },
      })
    }
    return prisma.userSettings.create({
      data: {
        height: data.height || 170,
        targetWeight: data.targetWeight || 65,
      },
    })
  },

  // ========== 消息系统 ==========
  async createMessage(data: { type: MessageTypeValue; title: string; content: string; toUserId: number | string; fromUserId?: number | string; relatedData?: string }) {
    return prisma.message.create({
      data: {
        type: data.type,
        title: data.title,
        content: data.content,
        fromUserId: data.fromUserId ? (typeof data.fromUserId === 'string' ? parseInt(data.fromUserId) : data.fromUserId) : undefined,
        toUserId: typeof data.toUserId === 'string' ? parseInt(data.toUserId) : data.toUserId,
        relatedData: data.relatedData,
      },
    })
  },

  async getMessagesByUser(userId: number | string) {
    const uid = typeof userId === 'string' ? parseInt(userId) : userId
    return prisma.message.findMany({
      where: { toUserId: uid },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: { id: true, username: true }
        }
      }
    })
  },

  async getUnreadMessageCount(userId: number | string) {
    const uid = typeof userId === 'string' ? parseInt(userId) : userId
    return prisma.message.count({
      where: {
        toUserId: uid,
        isRead: false,
      },
    })
  },

  async markMessageAsRead(messageId: number | string) {
    const mid = typeof messageId === 'string' ? parseInt(messageId) : messageId
    return prisma.message.update({
      where: { id: mid },
      data: { isRead: true },
    })
  },

  async markAllMessagesAsRead(userId: number | string) {
    const uid = typeof userId === 'string' ? parseInt(userId) : userId
    return prisma.message.updateMany({
      where: {
        toUserId: uid,
        isRead: false,
      },
      data: { isRead: true },
    })
  },

  async deleteMessage(messageId: number | string) {
    const mid = typeof messageId === 'string' ? parseInt(messageId) : messageId
    return prisma.message.delete({
      where: { id: mid },
    })
  },

  // ========== 好友系统 ==========
  async createFriendRequest(fromUserId: number | string, toUserId: number | string) {
    return prisma.friend.create({
      data: {
        fromUserId: typeof fromUserId === 'string' ? parseInt(fromUserId) : fromUserId,
        toUserId: typeof toUserId === 'string' ? parseInt(toUserId) : toUserId,
        status: FriendStatus.PENDING,
      },
    })
  },

  async findFriendRequest(fromUserId: number | string, toUserId: number | string) {
    return prisma.friend.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: typeof fromUserId === 'string' ? parseInt(fromUserId) : fromUserId,
          toUserId: typeof toUserId === 'string' ? parseInt(toUserId) : toUserId,
        }
      },
    })
  },

  async findFriendById(friendId: number | string) {
    const fid = typeof friendId === 'string' ? parseInt(friendId) : friendId
    return prisma.friend.findUnique({
      where: { id: fid },
      include: {
        fromUser: { select: { id: true, username: true } },
        toUser: { select: { id: true, username: true } },
      }
    })
  },

  async updateFriendStatus(friendId: number | string, status: FriendStatusValue) {
    const fid = typeof friendId === 'string' ? parseInt(friendId) : friendId
    return prisma.friend.update({
      where: { id: fid },
      data: { status, updatedAt: new Date() },
    })
  },

  async getFriendsByUser(userId: number | string) {
    const uid = typeof userId === 'string' ? parseInt(userId) : userId
    return prisma.friend.findMany({
      where: {
        OR: [
          { fromUserId: uid },
          { toUserId: uid },
        ],
      },
      include: {
        fromUser: { select: { id: true, username: true } },
        toUser: { select: { id: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  },

  async getPendingFriendRequests(userId: number | string) {
    const uid = typeof userId === 'string' ? parseInt(userId) : userId
    return prisma.friend.findMany({
      where: {
        toUserId: uid,
        status: FriendStatus.PENDING,
      },
      include: {
        fromUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async deleteFriend(friendId: number | string) {
    const fid = typeof friendId === 'string' ? parseInt(friendId) : friendId
    return prisma.friend.delete({
      where: { id: fid },
    })
  },

  // ========== 管理员功能 ==========
  async getAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        createdAt: true,
        lastLoginAt: true,
      }
    })
  },

  // ========== 健身频道 ==========
  async createFitnessChannel(data: { name: string; description?: string; startDate: Date; endDate: Date; ownerId: number; weeklyCheckInCount?: number; checkInMinutes?: number; maxLeaveDays?: number }) {
    return prisma.fitnessChannel.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        ownerId: data.ownerId,
        status: ChannelStatus.PENDING,
        weeklyCheckInCount: data.weeklyCheckInCount || 3,
        checkInMinutes: data.checkInMinutes || 30,
        maxLeaveDays: data.maxLeaveDays ?? 3,
      },
    })
  },

  // 检查用户是否有进行中的频道（PENDING 或 ACTIVE）
  async getUserActiveChannel(userId: number) {
    const now = new Date()
    return prisma.fitnessChannel.findFirst({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
        AND: [
          { status: { in: [ChannelStatus.PENDING, ChannelStatus.ACTIVE] } },
          { endDate: { gte: now } },
        ],
      },
      include: {
        owner: { select: { id: true, username: true } },
      },
    })
  },

  async getFitnessChannelsByUser(userId: number) {
    return prisma.fitnessChannel.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getFitnessChannelById(channelId: number) {
    return prisma.fitnessChannel.findUnique({
      where: { id: channelId },
      include: {
        owner: { select: { id: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        checkIns: {
          include: {
            user: { select: { id: true, username: true } },
          },
          orderBy: { checkDate: 'desc' },
        },
      },
    })
  },

  async updateChannelStatus(channelId: number, status: ChannelStatusValue) {
    return prisma.fitnessChannel.update({
      where: { id: channelId },
      data: { status },
    })
  },

  async deleteFitnessChannel(channelId: number) {
    return prisma.fitnessChannel.delete({
      where: { id: channelId },
    })
  },

  // ========== 频道成员 ==========
  async addChannelMember(channelId: number, userId: number) {
    return prisma.channelMember.create({
      data: {
        channelId,
        userId,
      },
    })
  },

  async removeChannelMember(channelId: number, userId: number) {
    return prisma.channelMember.deleteMany({
      where: {
        channelId,
        userId,
      },
    })
  },

  async isChannelMember(channelId: number, userId: number) {
    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    })
    return !!member
  },

  // ========== 打卡记录 ==========
  async createCheckIn(data: { channelId: number; userId: number; checkDate: Date; duration?: number; note?: string; imageUrl?: string }) {
    return prisma.checkIn.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        checkDate: data.checkDate,
        duration: data.duration || 30,
        note: data.note,
        imageUrl: data.imageUrl,
      },
    })
  },

  async getCheckInsByChannel(channelId: number) {
    return prisma.checkIn.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { checkDate: 'desc' },
    })
  },

  async getCheckInsByUserAndChannel(channelId: number, userId: number) {
    return prisma.checkIn.findMany({
      where: { channelId, userId },
      orderBy: { checkDate: 'desc' },
    })
  },

  async getCheckInByDate(channelId: number, userId: number, dateInput: Date | string) {
    // 处理输入（可能是 Date 对象或 YYYY-MM-DD 字符串）
    const dateStr = typeof dateInput === 'string' ? dateInput : formatDateToYYYYMMDD(dateInput)
    
    // 使用 UTC 时间构建查询范围，确保与数据库中存储的 UTC 时间匹配
    const [year, month, day] = dateStr.split('-').map(Number)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    
    return prisma.checkIn.findFirst({
      where: {
        channelId,
        userId,
        checkDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })
  },

  // 获取用户本周打卡次数
  async getWeeklyCheckInCount(channelId: number, userId: number) {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ...
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)) // 周一
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // 周日
    endOfWeek.setHours(23, 59, 59, 999)
    
    return prisma.checkIn.count({
      where: {
        channelId,
        userId,
        checkDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    })
  },

  // 获取频道所有成员的本周打卡统计
  async getChannelWeeklyStats(channelId: number) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    // 获取频道信息
    const channel = await prisma.fitnessChannel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        owner: { select: { id: true, username: true } },
      },
    })
    
    if (!channel) return null
    
    // 获取所有打卡记录
    const checkIns = await prisma.checkIn.findMany({
      where: {
        channelId,
        checkDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      select: {
        userId: true,
      },
    })
    
    // 统计每个用户的打卡次数
    const stats: Record<number, number> = {}
    checkIns.forEach((ci) => {
      stats[ci.userId] = (stats[ci.userId] || 0) + 1
    })
    
    // 合并成员和创建者
    const allMembers = [
      { userId: channel.ownerId, user: channel.owner },
      ...channel.members,
    ]
    
    return {
      weeklyRequired: channel.weeklyCheckInCount,
      checkInMinutes: channel.checkInMinutes,
      members: allMembers.map((m) => ({
        userId: m.userId,
        username: m.user?.username,
        completed: stats[m.userId] || 0,
        remaining: Math.max(0, (channel.weeklyCheckInCount || 3) - (stats[m.userId] || 0)),
      })),
    }
  },

  // ========== 频道评论 ==========
  async createChannelComment(data: { channelId: number; userId: number; content: string }) {
    return prisma.channelComment.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        content: data.content,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
  },

  async getChannelComments(channelId: number) {
    return prisma.channelComment.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async deleteChannelComment(commentId: number, userId: number) {
    // 验证评论是否属于该用户
    const comment = await prisma.channelComment.findFirst({
      where: { id: commentId, userId },
    })
    if (!comment) return null
    
    return prisma.channelComment.delete({
      where: { id: commentId },
    })
  },

  // ========== 请假申请 ==========
  async createLeaveRequest(data: { channelId: number; userId: number; startDate: Date; endDate: Date; reason?: string }) {
    return prisma.leaveRequest.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    })
  },

  async getLeaveRequests(channelId: number) {
    return prisma.leaveRequest.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getUserLeaveRequests(userId: number) {
    return prisma.leaveRequest.findMany({
      where: { userId },
      include: {
        channel: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async updateLeaveStatus(requestId: number, status: 'APPROVED' | 'REJECTED') {
    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status },
    })
  },

  // 获取用户在频道的请假天数（已批准的）
  async getUserLeaveDays(channelId: number, userId: number) {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        channelId,
        userId,
        status: 'APPROVED',
      },
    })
    
    // 计算总请假天数
    let totalDays = 0
    for (const leave of leaves) {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      totalDays += days
    }
    
    return { totalDays, leaves }
  },

  // 检查用户今天是否请假
  async isUserOnLeaveToday(channelId: number, userId: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const leave = await prisma.leaveRequest.findFirst({
      where: {
        channelId,
        userId,
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    })
    
    return !!leave
  },
}

// ==================== CloudBase 适配器 ====================

const cloudbaseAdapter = {
  // ========== 体重记录 ==========
  async getWeightEntries(userId?: string) {
    const query = userId ? { userId } : {}
    const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .where(query)
      .orderBy('date', 'desc')
      .get()
    return data
  },

  async createWeightEntry(data: Omit<WeightEntry, '_id' | 'createdAt'>) {
    const entry = {
      weight: data.weight,
      note: data.note,
      date: data.date,
      userId: data.userId || 'guest',
      createdAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES).add(entry)
    return { _id: id, ...entry }
  },

  async deleteWeightEntry(id: string | number) {
    await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES).doc(String(id)).remove()
    return { success: true }
  },

  // ========== 用户 ==========
  async findUserByUsername(username: string) {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .where({ username })
      .limit(1)
      .get()
    return data[0] || null
  },

  async findUserById(id: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(id))
      .get()
    return data[0] || null
  },

  async createUser(data: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'id'>) {
    const user = {
      username: data.username,
      password: data.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.USERS).add(user)
    return { _id: id, ...user }
  },

  async updateUserLoginTime(userId: number | string) {
    await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(userId))
      .update({ lastLoginAt: new Date() })
    return { success: true }
  },

  async updateUserPassword(userId: number | string, newPassword: string) {
    await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(userId))
      .update({ password: newPassword, updatedAt: new Date() })
    return { success: true }
  },

  async updateUserGender(userId: number | string, gender: string) {
    await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(userId))
      .update({ gender, updatedAt: new Date() })
    return { success: true }
  },

  async updateUserAvatar(userId: number | string, avatar: string) {
    await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(userId))
      .update({ avatar, updatedAt: new Date() })
    return { success: true }
  },

  async getUserProfile(userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(userId))
      .get()
    if (data[0]) {
      return {
        id: data[0]._id,
        username: data[0].username,
        gender: data[0].gender,
        avatar: data[0].avatar,
        createdAt: data[0].createdAt,
        lastLoginAt: data[0].lastLoginAt,
      }
    }
    return null
  },

  // ========== 用户设置 ==========
  async getUserSettings() {
    const { data } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS)
      .limit(1)
      .get()
    
    if (data.length === 0) {
      const defaultSettings = {
        height: 170,
        targetWeight: 65,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const { id } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS).add(defaultSettings)
      return { _id: id, ...defaultSettings }
    }
    return data[0]
  },

  async updateUserSettings(data: Partial<UserSettings>) {
    const { data: existingData } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS)
      .limit(1)
      .get()
    
    if (existingData.length > 0) {
      const existing = existingData[0]
      await tcbDb.collection(COLLECTIONS.USER_SETTINGS)
        .doc(existing._id)
        .update({
          height: data.height ?? existing.height,
          targetWeight: data.targetWeight ?? existing.targetWeight,
          updatedAt: new Date(),
        })
      return { ...existing, ...data, updatedAt: new Date() }
    }
    
    const newSettings = {
      height: data.height || 170,
      targetWeight: data.targetWeight || 65,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS).add(newSettings)
    return { _id: id, ...newSettings }
  },

  // ========== 消息系统 ==========
  async createMessage(data: { type: MessageTypeValue; title: string; content: string; toUserId: number | string; fromUserId?: number | string; relatedData?: string }) {
    const message = {
      type: data.type,
      title: data.title,
      content: data.content,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      relatedData: data.relatedData,
      isRead: false,
      createdAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.MESSAGES).add(message)
    return { _id: id, ...message }
  },

  async getMessagesByUser(userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({ toUserId: userId })
      .orderBy('createdAt', 'desc')
      .get()
    return data
  },

  async getUnreadMessageCount(userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({ toUserId: userId, isRead: false })
      .count()
    return data.total
  },

  async markMessageAsRead(messageId: number | string) {
    await tcbDb.collection(COLLECTIONS.MESSAGES)
      .doc(String(messageId))
      .update({ isRead: true })
    return { success: true }
  },

  async markAllMessagesAsRead(userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({ toUserId: userId, isRead: false })
      .get()
    
    for (const msg of data) {
      await tcbDb.collection(COLLECTIONS.MESSAGES)
        .doc(msg._id)
        .update({ isRead: true })
    }
    return { success: true }
  },

  async deleteMessage(messageId: number | string) {
    await tcbDb.collection(COLLECTIONS.MESSAGES)
      .doc(String(messageId))
      .remove()
    return { success: true }
  },

  // ========== 好友系统 ==========
  async createFriendRequest(fromUserId: number | string, toUserId: number | string) {
    const friend = {
      fromUserId,
      toUserId,
      status: FriendStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.FRIENDS).add(friend)
    return { _id: id, ...friend }
  },

  async findFriendRequest(fromUserId: number | string, toUserId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({ fromUserId, toUserId })
      .limit(1)
      .get()
    return data[0] || null
  },

  async findFriendById(friendId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(friendId))
      .get()
    return data[0] || null
  },

  async updateFriendStatus(friendId: number | string, status: FriendStatusValue) {
    await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(friendId))
      .update({ status, updatedAt: new Date() })
    return { success: true }
  },

  async getFriendsByUser(userId: number | string) {
    const { data: sent } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({ fromUserId: userId })
      .get()
    const { data: received } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({ toUserId: userId })
      .get()
    return [...sent, ...received].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  },

  async getPendingFriendRequests(userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({ toUserId: userId, status: FriendStatus.PENDING })
      .orderBy('createdAt', 'desc')
      .get()
    return data
  },

  async deleteFriend(friendId: number | string) {
    await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(friendId))
      .remove()
    return { success: true }
  },

  // ========== 健身频道 ==========
  async createFitnessChannel(data: { name: string; description?: string; startDate: Date; endDate: Date; ownerId: number | string; weeklyCheckInCount?: number; checkInMinutes?: number }) {
    const channel = {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      ownerId: data.ownerId,
      status: ChannelStatus.PENDING,
      weeklyCheckInCount: data.weeklyCheckInCount || 3,
      checkInMinutes: data.checkInMinutes || 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS).add(channel)
    return { _id: id, ...channel }
  },

  // 检查用户是否有进行中的频道
  async getUserActiveChannel(userId: number | string) {
    const now = new Date()
    
    // 获取拥有的进行中频道
    const { data: owned } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({
        ownerId: userId,
        status: { $in: [ChannelStatus.PENDING, ChannelStatus.ACTIVE] },
        endDate: { $gte: now },
      })
      .limit(1)
      .get()
    
    if (owned[0]) return owned[0]
    
    // 获取作为成员的进行中频道
    const { data: memberships } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ userId })
      .get()
    
    for (const membership of memberships) {
      const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
        .where({
          _id: membership.channelId,
          status: { $in: [ChannelStatus.PENDING, ChannelStatus.ACTIVE] },
          endDate: { $gte: now },
        })
        .limit(1)
        .get()
      if (data[0]) return data[0]
    }
    
    return null
  },

  async getFitnessChannelsByUser(userId: number | string) {
    // 获取拥有的频道
    const { data: owned } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({ ownerId: userId })
      .get()
    
    // 获取作为成员的频道
    const { data: memberships } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ userId })
      .get()
    
    const memberChannelIds = memberships.map((m: ChannelMember) => m.channelId)
    const memberChannels: FitnessChannel[] = []
    
    for (const channelId of memberChannelIds) {
      const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
        .doc(String(channelId))
        .get()
      if (data[0]) memberChannels.push(data[0])
    }
    
    return [...owned, ...memberChannels].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  async getFitnessChannelById(channelId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(channelId))
      .get()
    return data[0] || null
  },

  async updateChannelStatus(channelId: number | string, status: ChannelStatusValue) {
    await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(channelId))
      .update({ status, updatedAt: new Date() })
    return { success: true }
  },

  async deleteFitnessChannel(channelId: number | string) {
    await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(channelId))
      .remove()
    return { success: true }
  },

  // ========== 频道成员 ==========
  async addChannelMember(channelId: number | string, userId: number | string) {
    const member = {
      channelId,
      userId,
      joinedAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS).add(member)
    return { _id: id, ...member }
  },

  async removeChannelMember(channelId: number | string, userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ channelId, userId })
      .limit(1)
      .get()
    
    if (data[0]) {
      await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS).doc(data[0]._id).remove()
    }
    return { success: true }
  },

  async isChannelMember(channelId: number | string, userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ channelId, userId })
      .limit(1)
      .get()
    return data.length > 0
  },

  // ========== 打卡记录 ==========
  async createCheckIn(data: { channelId: number | string; userId: number | string; checkDate: Date; duration?: number; note?: string; imageUrl?: string }) {
    const checkIn = {
      channelId: data.channelId,
      userId: data.userId,
      checkDate: data.checkDate,
      duration: data.duration || 30,
      note: data.note,
      imageUrl: data.imageUrl,
      createdAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.CHECK_INS).add(checkIn)
    return { _id: id, ...checkIn }
  },

  async getCheckInsByChannel(channelId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({ channelId })
      .orderBy('checkDate', 'desc')
      .get()
    return data
  },

  async getCheckInsByUserAndChannel(channelId: number | string, userId: number | string) {
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({ channelId, userId })
      .orderBy('checkDate', 'desc')
      .get()
    return data
  },

  async getCheckInByDate(channelId: number | string, userId: number | string, dateInput: Date | string) {
    // 处理输入（可能是 Date 对象或 YYYY-MM-DD 字符串）
    const dateStr = typeof dateInput === 'string' ? dateInput : formatDateToYYYYMMDD(dateInput)
    
    // 使用 UTC 时间构建查询范围，确保与数据库中存储的 UTC 时间匹配
    const [year, month, day] = dateStr.split('-').map(Number)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
    
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({
        channelId,
        userId,
        checkDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .limit(1)
      .get()
    return data[0] || null
  },

  // 获取用户本周打卡次数
  async getWeeklyCheckInCount(channelId: number | string, userId: number | string) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({
        channelId,
        userId,
        checkDate: {
          $gte: startOfWeek,
          $lte: endOfWeek,
        },
      })
      .get()
    
    return data.length
  },

  // 获取频道所有成员的本周打卡统计
  async getChannelWeeklyStats(channelId: number | string) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    // 获取频道信息
    const { data: channelData } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(channelId))
      .get()
    
    if (!channelData[0]) return null
    
    const channel = channelData[0]
    
    // 获取本周所有打卡记录
    const { data: checkIns } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({
        channelId,
        checkDate: {
          $gte: startOfWeek,
          $lte: endOfWeek,
        },
      })
      .get()
    
    // 统计每个用户的打卡次数
    const stats: Record<string, number> = {}
    checkIns.forEach((ci: CheckIn) => {
      const uid = String(ci.userId)
      stats[uid] = (stats[uid] || 0) + 1
    })
    
    // 获取所有成员
    const { data: memberships } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ channelId })
      .get()
    
    const allMembers = [
      { userId: channel.ownerId, username: '' }, // 创建者
      ...memberships.map((m: ChannelMember) => ({ 
        userId: m.userId, 
        username: '' 
      })),
    ]
    
    return {
      weeklyRequired: channel.weeklyCheckInCount || 3,
      checkInMinutes: channel.checkInMinutes || 30,
      members: allMembers.map((m) => ({
        userId: m.userId,
        username: m.username || String(m.userId),
        completed: stats[String(m.userId)] || 0,
        remaining: Math.max(0, (channel.weeklyCheckInCount || 3) - (stats[String(m.userId)] || 0)),
      })),
    }
  },

  // ========== 管理员功能 ==========
  async getAllUsers() {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((u: User) => ({
      id: u._id,
      username: u.username,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    }))
  },

  // ========== 频道评论 (CloudBase 占位符) ==========
  async createChannelComment(data: { channelId: number | string; userId: number | string; content: string }) {
    // TODO: CloudBase 实现
    console.log('CloudBase createChannelComment not implemented', data)
    return null
  },

  async getChannelComments(channelId: number | string) {
    // TODO: CloudBase 实现
    console.log('CloudBase getChannelComments not implemented', channelId)
    return []
  },

  async deleteChannelComment(commentId: number | string, userId: number | string) {
    // TODO: CloudBase 实现
    console.log('CloudBase deleteChannelComment not implemented', commentId, userId)
    return null
  },

  // ========== 请假申请 (CloudBase 占位符) ==========
  async createLeaveRequest(data: { channelId: number | string; userId: number | string; startDate: Date; endDate: Date; reason?: string }) {
    // TODO: CloudBase 实现
    console.log('CloudBase createLeaveRequest not implemented', data)
    return null
  },

  async getLeaveRequests(channelId: number | string) {
    // TODO: CloudBase 实现
    console.log('CloudBase getLeaveRequests not implemented', channelId)
    return []
  },

  async getUserLeaveRequests(userId: number | string) {
    // TODO: CloudBase 实现
    console.log('CloudBase getUserLeaveRequests not implemented', userId)
    return []
  },

  async updateLeaveStatus(requestId: number | string, status: 'APPROVED' | 'REJECTED') {
    // TODO: CloudBase 实现
    console.log('CloudBase updateLeaveStatus not implemented', requestId, status)
    return null
  },

  async getUserLeaveDays(channelId: number | string, userId: number | string) {
    // TODO: CloudBase 实现
    console.log('CloudBase getUserLeaveDays not implemented', channelId, userId)
    return { totalDays: 0, leaves: [] }
  },

  async isUserOnLeaveToday(channelId: number | string, userId: number | string) {
    // TODO: CloudBase 实现
    console.log('CloudBase isUserOnLeaveToday not implemented', channelId, userId)
    return false
  },
}

// ==================== 导出适配器 ====================

export const adapter = CURRENT_DB === 'cloudbase' ? cloudbaseAdapter : prismaAdapter
