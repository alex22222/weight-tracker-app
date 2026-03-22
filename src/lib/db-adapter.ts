/**
 * 数据库适配器
 * 支持在 Prisma (SQLite) 和 CloudBase 数据库之间切换
 */

import { prisma } from './db'
import { db as tcbDb } from './cloudbase'

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
  CHANNEL_COMMENTS: 'channel_comments',
  LEAVE_REQUESTS: 'leave_requests',
}

// ==================== 常量定义 ====================

export const MessageType = {
  SYSTEM_LOGIN: 'SYSTEM_LOGIN',
  SYSTEM_LOGOUT: 'SYSTEM_LOGOUT',
  SYSTEM_REGISTER: 'SYSTEM_REGISTER',
  SYSTEM_PASSWORD_CHANGE: 'SYSTEM_PASSWORD_CHANGE',
  SYSTEM_FRIEND_REQUEST: 'SYSTEM_FRIEND_REQUEST',
  SYSTEM_FRIEND_ACCEPT: 'SYSTEM_FRIEND_ACCEPT',
  SYSTEM_FRIEND_REJECT: 'SYSTEM_FRIEND_REJECT',
  WEIGHT_RECORD: 'WEIGHT_RECORD',
  WEIGHT_UPDATE: 'WEIGHT_UPDATE',
  WEIGHT_DELETE: 'WEIGHT_DELETE',
  TARGET_ACHIEVED: 'TARGET_ACHIEVED',
  CHANNEL_JOIN: 'CHANNEL_JOIN',
  CHANNEL_INVITE: 'CHANNEL_INVITE',
  CHANNEL_LEAVE: 'CHANNEL_LEAVE',
  CHANNEL_CHECKIN: 'CHANNEL_CHECKIN',
  CHANNEL_CHAT: 'CHANNEL_CHAT',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_ACCEPT: 'FRIEND_ACCEPT',
  FRIEND_REJECT: 'FRIEND_REJECT',
  FRIEND_CHAT: 'FRIEND_CHAT',
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

// 日期格式化辅助函数：将 Date 转换为 YYYY-MM-DD 字符串
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ==================== 数据模型接口 ====================

export interface WeightEntry {
  id?: number | string
  weight: number
  note?: string | null
  date: Date
  createdAt?: Date
  userId?: number | string
}

export interface User {
  id?: number | string
  username: string
  password: string
  nickname?: string | null
  gender?: string | null
  avatar?: string | null
  wechatOpenId?: string | null
  wechatUnionId?: string | null
  role?: string
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date | null
}

export interface UserSettings {
  id?: number | string
  height: number
  targetWeight: number
  createdAt?: Date
  updatedAt?: Date
  userId?: number | string
}

export interface Message {
  id?: number | string
  senderId: number | string
  receiverId?: number | string | null
  channelId?: number | string | null
  content: string
  type: MessageTypeValue
  createdAt?: Date
  isRead?: boolean
}

export interface Friend {
  id?: number | string
  userId: number | string
  friendId: number | string
  status: FriendStatusValue
  createdAt?: Date
  updatedAt?: Date
}

export interface FitnessChannel {
  id?: number | string
  name: string
  description: string
  creatorId: number | string
  targetDays: number
  targetCheckIns: number
  startDate?: Date
  endDate?: Date
  status?: ChannelStatusValue
  createdAt?: Date
  updatedAt?: Date
}

export interface ChannelMember {
  id?: number | string
  channelId: number | string
  userId: number | string
  role?: string
  joinedAt?: Date
}

export interface ChannelComment {
  id?: number | string
  channelId: number | string
  userId: number | string
  content: string
  createdAt?: Date
}

export interface CheckIn {
  id?: number | string
  channelId: number | string
  userId: number | string
  checkDate: Date
  duration?: number
  note?: string | null
  imageUrl?: string | null
  createdAt?: Date
}

export interface LeaveRequest {
  id?: number | string
  channelId: number | string
  userId: number | string
  startDate: Date
  endDate: Date
  reason?: string
  status: string
  createdAt?: Date
}

// ==================== Prisma 适配器 ====================

const prismaAdapter = {
  // ========== 用户相关 ==========
  async createUser(data: { username: string; password: string; gender?: string }): Promise<User> {
    return prisma.user.create({
      data: {
        username: data.username,
        password: data.password,
        gender: data.gender || 'other',
      },
    })
  },

  async getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    })
  },

  async findUserByUsername(username: string): Promise<User | null> {
    return this.getUserByUsername(username)
  },

  async getUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  },

  async findUserById(id: number): Promise<User | null> {
    return this.getUserById(id)
  },

  async findUserByWechatOpenId(openId: string): Promise<User | null> {
    // TODO: 添加 wechatOpenId 字段到 Prisma schema
    return null
  },

  async createWechatUser(data: { wechatOpenId: string; wechatUnionId?: string | null; nickname?: string | null; avatar?: string | null; gender?: string | null; role?: string }): Promise<User> {
    // TODO: 添加微信相关字段到 Prisma schema
    throw new Error('微信登录需要更新 Prisma schema')
  },

  async updateUserPassword(id: number, password: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password },
    })
  },

  async updateUser(id: number | string, data: Partial<User>): Promise<User> {
    const userId = typeof id === 'string' ? parseInt(id) || 0 : id
    const { id: _, ...updateData } = data as any
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    })
  },

  async updateUserLoginTime(id: number | string): Promise<void> {
    const userId = typeof id === 'string' ? parseInt(id) || 0 : id
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    })
  },

  async updateUserLastLogin(id: number): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    })
  },

  async updateUserGender(id: number, gender: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { gender },
    })
  },

  // ========== 体重记录相关 ==========
  async createWeightEntry(data: { weight: number; note?: string; date: Date; userId: number }): Promise<WeightEntry> {
    return prisma.weightEntry.create({
      data: {
        weight: data.weight,
        note: data.note,
        date: data.date,
        userId: data.userId,
      },
    })
  },

  async getWeightEntriesByUser(userId: number): Promise<WeightEntry[]> {
    return prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    })
  },

  async getWeightEntryById(id: number): Promise<WeightEntry | null> {
    return prisma.weightEntry.findUnique({
      where: { id },
    })
  },

  async updateWeightEntry(id: number, data: { weight?: number; note?: string; date?: Date }): Promise<WeightEntry> {
    return prisma.weightEntry.update({
      where: { id },
      data,
    })
  },

  async deleteWeightEntry(id: number): Promise<void> {
    await prisma.weightEntry.delete({
      where: { id },
    })
  },

  // ========== 用户设置相关 ==========
  async getUserSettings(userId: number): Promise<UserSettings | null> {
    return prisma.userSettings.findUnique({
      where: { userId },
    })
  },

  async createUserSettings(data: { userId: number; height: number; targetWeight: number }): Promise<UserSettings> {
    return prisma.userSettings.create({
      data,
    })
  },

  async updateUserSettings(userId: number, data: { height?: number; targetWeight?: number }): Promise<UserSettings> {
    return prisma.userSettings.update({
      where: { userId },
      data,
    })
  },

  // ========== 消息相关 ==========
  async createMessage(data: { senderId: number | string; receiverId?: number | string | null; channelId?: number | string | null; content: string; type: MessageTypeValue }): Promise<Message> {
    return prisma.message.create({
      data: {
        senderId: typeof data.senderId === 'string' ? parseInt(data.senderId) || 0 : data.senderId,
        receiverId: data.receiverId != null ? (typeof data.receiverId === 'string' ? parseInt(data.receiverId) || 0 : data.receiverId) : null,
        channelId: data.channelId != null ? (typeof data.channelId === 'string' ? parseInt(data.channelId) || 0 : data.channelId) : null,
        content: data.content,
        type: data.type,
      },
    }) as Promise<Message>
  },

  async getMessagesByChannel(channelId: number, limit: number = 50, before?: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: {
        channelId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as Promise<Message[]>
  },

  // ========== 好友相关 ==========
  async createFriendRequest(userId: number, friendId: number): Promise<Friend> {
    return prisma.friend.create({
      data: {
        userId,
        friendId,
        status: FriendStatus.PENDING,
      },
    }) as Promise<Friend>
  },

  async findFriendRequest(fromUserId: number, toUserId: number): Promise<Friend | null> {
    const request = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: fromUserId, friendId: toUserId },
          { userId: toUserId, friendId: fromUserId },
        ],
      },
    })
    return request as Friend | null
  },

  async findFriendById(id: number): Promise<Friend | null> {
    return prisma.friend.findUnique({
      where: { id },
    }) as Promise<Friend | null>
  },

  async getFriends(userId: number): Promise<Friend[]> {
    return prisma.friend.findMany({
      where: {
        OR: [
          { userId, status: FriendStatus.ACCEPTED },
          { friendId: userId, status: FriendStatus.ACCEPTED },
        ],
      },
    }) as Promise<Friend[]>
  },

  async getFriendsByUser(userId: number): Promise<Friend[]> {
    return this.getFriends(userId)
  },

  async getPendingFriendRequests(userId: number): Promise<Friend[]> {
    return prisma.friend.findMany({
      where: {
        friendId: userId,
        status: FriendStatus.PENDING,
      },
    }) as Promise<Friend[]>
  },

  async updateFriendStatus(id: number, status: FriendStatusValue): Promise<Friend> {
    return prisma.friend.update({
      where: { id },
      data: { status },
    }) as Promise<Friend>
  },

  async deleteFriend(friendId: number): Promise<void> {
    await prisma.friend.delete({
      where: { id: friendId },
    })
  },

  // ========== 消息相关（补充） ==========
  async getMessagesByUser(userId: number): Promise<Message[]> {
    return prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<Message[]>
  },

  async deleteMessage(messageId: number): Promise<void> {
    await prisma.message.delete({
      where: { id: messageId },
    })
  },

  async markAllMessagesAsRead(userId: number): Promise<void> {
    await prisma.message.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true },
    })
  },

  async markMessageAsRead(messageId: number): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    })
  },

  // ========== 健身频道相关 ==========
  async createChannel(data: { name: string; description: string; creatorId: number; targetDays: number; targetCheckIns: number }): Promise<FitnessChannel> {
    return prisma.fitnessChannel.create({
      data: {
        name: data.name,
        description: data.description,
        creatorId: data.creatorId,
        targetDays: data.targetDays,
        targetCheckIns: data.targetCheckIns,
        status: ChannelStatus.ACTIVE,
      },
    }) as Promise<FitnessChannel>
  },

  async getChannelById(id: number): Promise<FitnessChannel | null> {
    return prisma.fitnessChannel.findUnique({
      where: { id },
    }) as Promise<FitnessChannel | null>
  },

  async getFitnessChannelById(id: number): Promise<FitnessChannel | null> {
    return this.getChannelById(id)
  },

  async getAllChannels(): Promise<FitnessChannel[]> {
    return prisma.fitnessChannel.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<FitnessChannel[]>
  },

  async getChannelsByMember(userId: number): Promise<FitnessChannel[]> {
    const memberships = await prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    })
    const channelIds = memberships.map(m => m.channelId)
    return prisma.fitnessChannel.findMany({
      where: { id: { in: channelIds } },
      orderBy: { createdAt: 'desc' },
    }) as Promise<FitnessChannel[]>
  },

  async deleteChannel(id: number): Promise<void> {
    await prisma.fitnessChannel.delete({
      where: { id },
    })
  },

  async updateChannelStatus(id: number, status: ChannelStatusValue): Promise<void> {
    await prisma.fitnessChannel.update({
      where: { id },
      data: { status },
    })
  },

  async getUserActiveChannel(userId: number): Promise<FitnessChannel | null> {
    const channel = await prisma.fitnessChannel.findFirst({
      where: {
        OR: [
          { creatorId: userId },
          { members: { some: { userId } } },
        ],
        status: { in: [ChannelStatus.PENDING, ChannelStatus.ACTIVE] },
      },
    })
    return channel as FitnessChannel | null
  },

  // ========== 频道成员相关 ==========
  async addChannelMember(data: { channelId: number; userId: number; role?: string }): Promise<ChannelMember> {
    return prisma.channelMember.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        role: data.role || 'MEMBER',
      },
    })
  },

  async getChannelMember(channelId: number, userId: number): Promise<ChannelMember | null> {
    return prisma.channelMember.findFirst({
      where: { channelId, userId },
    })
  },

  async getChannelMembers(channelId: number): Promise<(ChannelMember & { username?: string })[]> {
    const members = await prisma.channelMember.findMany({
      where: { channelId },
      include: { user: true },
    })
    return members.map(m => ({
      ...m,
      username: (m as any).user?.username,
    }))
  },

  async removeChannelMember(channelId: number, userId: number): Promise<void> {
    await prisma.channelMember.deleteMany({
      where: { channelId, userId },
    })
  },

  async isChannelMember(channelId: number, userId: number): Promise<boolean> {
    const member = await prisma.channelMember.findFirst({
      where: { channelId, userId },
    })
    return !!member
  },

  // ========== 评论相关 ==========
  // TODO: 添加 ChannelComment 模型到 Prisma schema
  async getChannelComments(channelId: number | string): Promise<ChannelComment[]> {
    return []
  },

  async createChannelComment(data: { channelId: number | string; userId: number | string; content: string }): Promise<ChannelComment> {
    throw new Error('评论功能需要添加 ChannelComment 模型到 Prisma schema')
  },

  async deleteChannelComment(commentId: number | string, userId: number | string): Promise<boolean> {
    return false
  },

  // ========== 请假相关 ==========
  // TODO: 添加 LeaveRequest 模型到 Prisma schema
  async getLeaveRequests(channelId: number | string): Promise<LeaveRequest[]> {
    return []
  },

  async getUserLeaveDays(channelId: number | string, userId: number | string): Promise<{ totalDays: number; leaves: LeaveRequest[] }> {
    return { totalDays: 0, leaves: [] }
  },

  async createLeaveRequest(data: { channelId: number | string; userId: number | string; startDate: Date; endDate: Date; reason?: string }): Promise<LeaveRequest> {
    throw new Error('请假功能需要添加 LeaveRequest 模型到 Prisma schema')
  },

  async updateLeaveStatus(requestId: number | string, status: string): Promise<void> {
    throw new Error('请假功能需要添加 LeaveRequest 模型到 Prisma schema')
  },

  // ========== 打卡相关 ==========
  async createCheckIn(data: { channelId: number; userId: number; checkDate: Date; duration?: number; note?: string; imageUrl?: string }): Promise<CheckIn> {
    return prisma.checkIn.create({
      data: {
        channelId: data.channelId,
        userId: data.userId,
        checkDate: data.checkDate,
        duration: data.duration || 30,
        note: data.note,
        imageUrl: data.imageUrl,
      },
    }) as Promise<CheckIn>
  },

  async getCheckInsByChannel(channelId: number): Promise<CheckIn[]> {
    return prisma.checkIn.findMany({
      where: { channelId },
      orderBy: { checkDate: 'desc' },
    }) as Promise<CheckIn[]>
  },

  async getCheckInsByUserAndChannel(channelId: number, userId: number): Promise<CheckIn[]> {
    return prisma.checkIn.findMany({
      where: { channelId, userId },
      orderBy: { checkDate: 'desc' },
    }) as Promise<CheckIn[]>
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
  async getWeeklyCheckInCount(channelId: number | string, userId: number | string) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    // Prisma 需要 number 类型，所以进行转换
    const cid = typeof channelId === 'string' ? parseInt(channelId, 10) : channelId
    const uid = typeof userId === 'string' ? parseInt(userId, 10) : userId
    
    return prisma.checkIn.count({
      where: {
        channelId: cid,
        userId: uid,
        checkDate: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    })
  },

  async getChannelWeeklyStats(channelId: number): Promise<any> {
    const channel = await prisma.fitnessChannel.findUnique({
      where: { id: channelId },
      include: {
        members: { include: { user: { select: { id: true, username: true } } } },
      },
    })
    if (!channel) return null
    
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    const checkIns = await prisma.checkIn.findMany({
      where: { channelId, checkDate: { gte: startOfWeek, lte: endOfWeek } },
      select: { userId: true },
    })
    
    const stats: Record<number, number> = {}
    checkIns.forEach((ci) => { stats[ci.userId] = (stats[ci.userId] || 0) + 1 })
    
    // TODO: 添加 weeklyCheckInCount 和 checkInMinutes 字段到 FitnessChannel 模型
    const weeklyCheckInCount = 3
    const checkInMinutes = 30
    
    return {
      weeklyRequired: weeklyCheckInCount,
      checkInMinutes: checkInMinutes,
      members: channel.members.map((m) => ({
        userId: m.userId,
        username: m.user?.username,
        completed: stats[m.userId] || 0,
        remaining: Math.max(0, weeklyCheckInCount - (stats[m.userId] || 0)),
      })),
    }
  },

  // ========== 统计相关 ==========
  async getAllUsers(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
  },

  async getAllWeightEntries(): Promise<WeightEntry[]> {
    return prisma.weightEntry.findMany({
      orderBy: { date: 'desc' },
    })
  },
}

// ==================== CloudBase 适配器 ====================

const cloudbaseAdapter = {
  // ========== 用户相关 ==========
  async createUser(data: { username: string; password: string; gender?: string }): Promise<User> {
    const { id } = await tcbDb.collection(COLLECTIONS.USERS).add({
      username: data.username,
      password: data.password,
      gender: data.gender || 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data } as User
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .where({ username })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async findUserByUsername(username: string): Promise<User | null> {
    return this.getUserByUsername(username)
  },

  async getUserById(id: number | string): Promise<User | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .where({ _id: id })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async findUserById(id: number | string): Promise<User | null> {
    return this.getUserById(id)
  },

  async findUserByWechatOpenId(openId: string): Promise<User | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .where({ wechatOpenId: openId })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async createWechatUser(data: { wechatOpenId: string; wechatUnionId?: string | null; nickname?: string | null; avatar?: string | null; gender?: string | null; role?: string }): Promise<User> {
    const { id } = await tcbDb.collection(COLLECTIONS.USERS).add({
      wechatOpenId: data.wechatOpenId,
      wechatUnionId: data.wechatUnionId,
      nickname: data.nickname,
      avatar: data.avatar,
      gender: data.gender,
      username: null,
      password: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data } as User
  },

  async updateUserPassword(id: number | string, password: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(id))
    await doc.update({
      password,
      updatedAt: new Date(),
    })
  },

  async updateUser(id: number | string, data: Partial<User>): Promise<User> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(id))
    await doc.update({
      ...data,
      updatedAt: new Date(),
    })
    return { id, ...data } as User
  },

  async updateUserLoginTime(id: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(id))
    await doc.update({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
  },

  async updateUserLastLogin(id: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(id))
    await doc.update({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
  },

  async updateUserGender(id: number | string, gender: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(id))
    await doc.update({
      gender,
      updatedAt: new Date(),
    })
  },

  // ========== 体重记录相关 ==========
  async createWeightEntry(data: { weight: number; note?: string; date: Date; userId: number | string }): Promise<WeightEntry> {
    const { id } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES).add({
      weight: data.weight,
      note: data.note,
      date: data.date,
      userId: data.userId,
      createdAt: new Date(),
    })
    return { id, ...data } as WeightEntry
  },

  async getWeightEntriesByUser(userId: number | string): Promise<WeightEntry[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .where({ userId })
      .orderBy('date', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getWeightEntryById(id: number | string): Promise<WeightEntry | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .where({ _id: id })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async updateWeightEntry(id: number | string, data: { weight?: number; note?: string; date?: Date }): Promise<WeightEntry> {
    const doc = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .doc(String(id))
    await doc.update(data)
    return { id, ...data } as WeightEntry
  },

  async deleteWeightEntry(id: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .doc(String(id))
    await doc.remove()
  },

  // ========== 用户设置相关 ==========
  async getUserSettings(userId: number | string): Promise<UserSettings | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS)
      .where({ userId })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async createUserSettings(data: { userId: number | string; height: number; targetWeight: number }): Promise<UserSettings> {
    const { id } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS).add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data } as UserSettings
  },

  async updateUserSettings(userId: number | string, data: { height?: number; targetWeight?: number }): Promise<UserSettings> {
    const settings = await cloudbaseAdapter.getUserSettings(userId)
    if (settings?.id) {
      const doc = await tcbDb.collection(COLLECTIONS.USER_SETTINGS)
        .doc(String(settings.id))
      await doc.update({
        ...data,
        updatedAt: new Date(),
      })
    }
    return { ...settings, ...data } as UserSettings
  },

  // ========== 消息相关 ==========
  async createMessage(data: { senderId: number | string; receiverId?: number | string; channelId?: number | string; content: string; type: MessageTypeValue }): Promise<Message> {
    const { id } = await tcbDb.collection(COLLECTIONS.MESSAGES).add({
      senderId: data.senderId,
      receiverId: data.receiverId,
      channelId: data.channelId,
      content: data.content,
      type: data.type,
      isRead: false,
      createdAt: new Date(),
    })
    return { id, ...data } as Message
  },

  async getMessagesByChannel(channelId: number | string, limit: number = 50, before?: string): Promise<Message[]> {
    let query = tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({ channelId })
      .orderBy('createdAt', 'desc')
      .limit(limit)
    
    if (before) {
      query = query.where({ createdAt: { $lt: new Date(before) } })
    }
    
    const { data } = await query.get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  // ========== 好友相关 ==========
  async createFriendRequest(userId: number | string, friendId: number | string): Promise<Friend> {
    const { id } = await tcbDb.collection(COLLECTIONS.FRIENDS).add({
      userId,
      friendId,
      status: FriendStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, userId, friendId, status: FriendStatus.PENDING } as Friend
  },

  async findFriendRequest(fromUserId: number | string, toUserId: number | string): Promise<Friend | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        $or: [
          { userId: fromUserId, friendId: toUserId },
          { userId: toUserId, friendId: fromUserId },
        ],
      })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async findFriendById(id: number | string): Promise<Friend | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({ _id: id })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async getFriends(userId: number | string): Promise<Friend[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        status: FriendStatus.ACCEPTED,
        $or: [
          { userId },
          { friendId: userId },
        ],
      })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getPendingFriendRequests(userId: number | string): Promise<Friend[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({ friendId: userId, status: FriendStatus.PENDING })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async updateFriendStatus(id: number | string, status: FriendStatusValue): Promise<Friend> {
    const doc = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(id))
    await doc.update({ status, updatedAt: new Date() })
    return { id, status } as Friend
  },

  // ========== 健身频道相关 ==========
  async createChannel(data: { name: string; description: string; creatorId: number | string; targetDays: number; targetCheckIns: number }): Promise<FitnessChannel> {
    const { id } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS).add({
      name: data.name,
      description: data.description,
      creatorId: data.creatorId,
      targetDays: data.targetDays,
      targetCheckIns: data.targetCheckIns,
      status: ChannelStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data } as FitnessChannel
  },

  async getChannelById(id: number | string): Promise<FitnessChannel | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({ _id: id })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async getFitnessChannelById(id: number | string): Promise<FitnessChannel | null> {
    return this.getChannelById(id)
  },

  async getAllChannels(): Promise<FitnessChannel[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getChannelsByMember(userId: number | string): Promise<FitnessChannel[]> {
    const { data: memberships } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ userId })
      .get()
    
    const channelIds = memberships.map((m: any) => m.channelId)
    if (channelIds.length === 0) return []
    
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({ _id: { $in: channelIds } })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async deleteChannel(id: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(id))
    await doc.remove()
  },

  async updateChannelStatus(id: number | string, status: ChannelStatusValue): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(id))
    await doc.update({ status, updatedAt: new Date() })
  },

  // ========== 频道成员相关 ==========
  async addChannelMember(data: { channelId: number | string; userId: number | string; role?: string }): Promise<ChannelMember> {
    const { id } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS).add({
      channelId: data.channelId,
      userId: data.userId,
      role: data.role || 'MEMBER',
      joinedAt: new Date(),
    })
    return { id, ...data } as ChannelMember
  },

  async getChannelMember(channelId: number | string, userId: number | string): Promise<ChannelMember | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ channelId, userId })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async getChannelMembers(channelId: number | string): Promise<(ChannelMember & { username?: string })[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
      .where({ channelId })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async removeChannelMember(channelId: number | string, userId: number | string): Promise<void> {
    const member = await cloudbaseAdapter.getChannelMember(channelId, userId)
    if (member?.id) {
      const doc = await tcbDb.collection(COLLECTIONS.CHANNEL_MEMBERS)
        .doc(String(member.id))
      await doc.remove()
    }
  },

  async isChannelMember(channelId: number | string, userId: number | string): Promise<boolean> {
    const member = await cloudbaseAdapter.getChannelMember(channelId, userId)
    return !!member
  },

  // ========== 评论相关 ==========
  async getChannelComments(channelId: number | string): Promise<ChannelComment[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHANNEL_COMMENTS)
      .where({ channelId })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async createChannelComment(data: { channelId: number | string; userId: number | string; content: string }): Promise<ChannelComment> {
    const { id } = await tcbDb.collection(COLLECTIONS.CHANNEL_COMMENTS).add({
      channelId: data.channelId,
      userId: data.userId,
      content: data.content,
      createdAt: new Date(),
    })
    return { id, ...data } as ChannelComment
  },

  async deleteChannelComment(commentId: number | string, userId: number | string): Promise<boolean> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHANNEL_COMMENTS)
      .where({ _id: commentId, userId })
      .limit(1)
      .get()
    if (data.length === 0) return false
    const doc = await tcbDb.collection(COLLECTIONS.CHANNEL_COMMENTS)
      .doc(String(commentId))
    await doc.remove()
    return true
  },

  // ========== 打卡相关 ==========
  async createCheckIn(data: { channelId: number | string; userId: number | string; checkDate: Date; duration?: number; note?: string; imageUrl?: string }): Promise<CheckIn> {
    const { id } = await tcbDb.collection(COLLECTIONS.CHECK_INS).add({
      channelId: data.channelId,
      userId: data.userId,
      checkDate: data.checkDate,
      duration: data.duration || 30,
      note: data.note,
      imageUrl: data.imageUrl,
      createdAt: new Date(),
    })
    return { id, ...data } as CheckIn
  },

  async getCheckInsByChannel(channelId: number | string): Promise<CheckIn[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({ channelId })
      .orderBy('checkDate', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getCheckInsByUserAndChannel(channelId: number | string, userId: number | string): Promise<CheckIn[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({ channelId, userId })
      .orderBy('checkDate', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
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
    return data[0] ? { ...data[0], id: data[0]._id } : null
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
      .count()
    return (data as any).total || 0
  },

  // ========== 统计相关 ==========
  async getAllUsers(): Promise<User[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getAllWeightEntries(): Promise<WeightEntry[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .orderBy('date', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  // ========== 请假相关 ==========
  async getLeaveRequests(channelId: number | string): Promise<LeaveRequest[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.LEAVE_REQUESTS)
      .where({ channelId })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getUserLeaveDays(channelId: number | string, userId: number | string): Promise<{ totalDays: number; leaves: LeaveRequest[] }> {
    const { data: leaves } = await tcbDb.collection(COLLECTIONS.LEAVE_REQUESTS)
      .where({ channelId, userId, status: 'APPROVED' })
      .get()
    let totalDays = 0
    for (const leave of leaves) {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      totalDays += days
    }
    return { totalDays, leaves: leaves.map((d: any) => ({ ...d, id: d._id })) }
  },

  async createLeaveRequest(data: { channelId: number | string; userId: number | string; startDate: Date; endDate: Date; reason?: string }): Promise<LeaveRequest> {
    const { id } = await tcbDb.collection(COLLECTIONS.LEAVE_REQUESTS).add({
      channelId: data.channelId,
      userId: data.userId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'PENDING',
      createdAt: new Date(),
    })
    return { id, ...data, status: 'PENDING' } as LeaveRequest
  },

  async updateLeaveStatus(requestId: number | string, status: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.LEAVE_REQUESTS)
      .doc(String(requestId))
    await doc.update({ status, updatedAt: new Date() })
  },

  // ========== 好友相关（补充） ==========
  async getFriendsByUser(userId: number | string): Promise<Friend[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        status: FriendStatus.ACCEPTED,
        $or: [{ userId }, { friendId: userId }],
      })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async deleteFriend(friendId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(friendId))
    await doc.remove()
  },

  // ========== 消息相关（补充） ==========
  async getMessagesByUser(userId: number | string): Promise<Message[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({ receiverId: userId })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async deleteMessage(messageId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .doc(String(messageId))
    await doc.remove()
  },

  async markAllMessagesAsRead(userId: number | string): Promise<void> {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({ receiverId: userId, isRead: false })
      .get()
    for (const msg of data) {
      const doc = await tcbDb.collection(COLLECTIONS.MESSAGES).doc(msg._id)
      await doc.update({ isRead: true })
    }
  },

  async markMessageAsRead(messageId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .doc(String(messageId))
    await doc.update({ isRead: true })
  },

  // ========== 频道相关（补充） ==========
  async getUserActiveChannel(userId: number | string): Promise<FitnessChannel | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({
        $or: [{ creatorId: userId }, { 'members.userId': userId }],
        status: { $in: [ChannelStatus.PENDING, ChannelStatus.ACTIVE] },
        endDate: { $gte: new Date() },
      })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  // ========== 打卡相关（补充） ==========
  async getChannelWeeklyStats(channelId: number | string): Promise<any> {
    const { data: channelData } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({ _id: channelId })
      .limit(1)
      .get()
    if (channelData.length === 0) return null
    const channel = channelData[0]
    
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    const { data: checkIns } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({ channelId, checkDate: { $gte: startOfWeek, $lte: endOfWeek } })
      .get()
    
    const stats: Record<string, number> = {}
    checkIns.forEach((ci: any) => { stats[ci.userId] = (stats[ci.userId] || 0) + 1 })
    
    return {
      weeklyRequired: channel.weeklyCheckInCount || 3,
      checkInMinutes: channel.checkInMinutes || 30,
      members: (channel.members || []).map((m: any) => ({
        userId: m.userId,
        username: m.username,
        completed: stats[m.userId] || 0,
        remaining: Math.max(0, (channel.weeklyCheckInCount || 3) - (stats[m.userId] || 0)),
      })),
    }
  },
}

// ==================== 导出适配器 ====================

export const adapter = CURRENT_DB === 'cloudbase' ? cloudbaseAdapter : prismaAdapter
