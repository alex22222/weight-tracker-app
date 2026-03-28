/**
 * 数据库适配器
 * 支持在 Prisma (SQLite) 和 CloudBase 数据库之间切换
 */

import { prisma } from './db'
import { db as tcbDb } from './cloudbase'

// 数据库类型
export type DatabaseType = 'prisma' | 'cloudbase'

// 当前使用的数据库类型 - 从环境变量读取，默认为 cloudbase（因为部署到 CloudBase）
export const CURRENT_DB: DatabaseType = process.env.DB_TYPE === 'prisma' ? 'prisma' : 'cloudbase'

// 调试日志
console.log('[DB Adapter] DB_TYPE env:', process.env.DB_TYPE)
console.log('[DB Adapter] CURRENT_DB:', CURRENT_DB)

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

export const ChannelStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
}

export const FriendStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
}

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
}

type MessageTypeValue = typeof MessageType[keyof typeof MessageType]

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
  gender?: string
  age?: number
  avatar?: string
  userId?: number | string
}

export interface Message {
  id?: number | string
  senderId: number | string
  receiverId?: number | string | null
  channelId?: number | string | null
  content: string
  type: MessageTypeValue
  isRead?: boolean
  createdAt?: Date
}

export interface Friend {
  id?: number | string
  userId: number | string
  friendId: number | string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt?: Date
  updatedAt?: Date
}

export interface FitnessChannel {
  id?: number | string
  name: string
  description?: string
  creatorId: number | string
  weeklyCheckInCount: number
  checkInMinutes: number
  startDate: Date
  endDate: Date
  status: 'pending' | 'active' | 'completed'
  members?: ChannelMember[]
  createdAt?: Date
  updatedAt?: Date
}

export interface ChannelMember {
  userId: number | string
  username: string
  joinedAt: Date
}

export interface CheckIn {
  id?: number | string
  channelId: number | string
  userId: number | string
  checkDate: Date
  duration: number
  note?: string
  createdAt?: Date
}

export interface ChannelComment {
  id?: number | string
  channelId: number | string
  userId: number | string
  content: string
  createdAt?: Date
}

export interface LeaveRequest {
  id?: number | string
  channelId: number | string
  userId: number | string
  startDate: Date
  endDate: Date
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: Date
  updatedAt?: Date
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
      userId: data.userId,
      height: data.height,
      targetWeight: data.targetWeight,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data } as UserSettings
  },

  async updateUserSettings(userId: number | string, data: { height?: number; targetWeight?: number; gender?: string }): Promise<UserSettings> {
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

  async getMessagesByUser(userId: number | string): Promise<Message[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({
        $or: [
          { receiverId: userId },
          { senderId: userId, receiverId: null }
        ]
      })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getUnreadMessagesCount(userId: number | string): Promise<number> {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({
        receiverId: userId,
        isRead: false
      })
      .get()
    return data.length
  },

  async markMessageAsRead(messageId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .doc(String(messageId))
    await doc.update({ isRead: true })
  },

  async markAllMessagesAsRead(userId: number | string): Promise<void> {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({
        receiverId: userId,
        isRead: false
      })
      .get()
    for (const msg of data) {
      const doc = await tcbDb.collection(COLLECTIONS.MESSAGES)
        .doc(String(msg._id))
      await doc.update({ isRead: true })
    }
  },

  async deleteMessage(messageId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .doc(String(messageId))
    await doc.remove()
  },

  async deleteAllReadMessages(userId: number | string): Promise<void> {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({
        receiverId: userId,
        isRead: true
      })
      .get()
    for (const msg of data) {
      const doc = await tcbDb.collection(COLLECTIONS.MESSAGES)
        .doc(String(msg._id))
      await doc.remove()
    }
  },

  // ========== 好友相关 ==========
  async createFriendRequest(data: { userId: number | string; friendId: number | string }): Promise<Friend> {
    const { id } = await tcbDb.collection(COLLECTIONS.FRIENDS).add({
      userId: data.userId,
      friendId: data.friendId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data, status: 'pending' } as Friend
  },

  async acceptFriendRequest(requestId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(requestId))
    await doc.update({
      status: 'accepted',
      updatedAt: new Date(),
    })
  },

  async rejectFriendRequest(requestId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(requestId))
    await doc.update({
      status: 'rejected',
      updatedAt: new Date(),
    })
  },

  async getFriendship(userId: number | string, friendId: number | string): Promise<Friend | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        userId,
        friendId
      })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async getFriendsByUser(userId: number | string): Promise<Friend[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        userId,
        status: 'accepted'
      })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getPendingFriendRequests(userId: number | string): Promise<Friend[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        friendId: userId,
        status: 'pending'
      })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async deleteFriend(userId: number | string, friendId: number | string): Promise<void> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        userId,
        friendId
      })
      .get()
    for (const item of data) {
      const doc = await tcbDb.collection(COLLECTIONS.FRIENDS)
        .doc(String(item._id))
      await doc.remove()
    }
  },

  async deleteFriendById(id: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(id))
    await doc.remove()
  },

  // ========== 健身频道相关 ==========
  async createFitnessChannel(data: { name: string; description?: string; creatorId: number | string; weeklyCheckInCount: number; checkInMinutes: number; startDate: Date; endDate: Date }): Promise<FitnessChannel> {
    const { id } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS).add({
      ...data,
      status: 'pending',
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data, status: 'pending', members: [] } as FitnessChannel
  },

  async getFitnessChannels(): Promise<FitnessChannel[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({
        status: { $in: ['pending', 'active'] },
        endDate: { $gte: new Date() }
      })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getFitnessChannelById(id: number | string): Promise<FitnessChannel | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({ _id: id })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async updateFitnessChannel(id: number | string, data: Partial<FitnessChannel>): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(id))
    await doc.update({
      ...data,
      updatedAt: new Date(),
    })
  },

  async joinFitnessChannel(channelId: number | string, userId: number | string, username: string): Promise<void> {
    const channel = await this.getFitnessChannelById(channelId)
    if (!channel) throw new Error('Channel not found')
    
    const members = channel.members || []
    if (!members.find((m: any) => m.userId === userId)) {
      members.push({
        userId,
        username,
        joinedAt: new Date()
      })
      const doc = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
        .doc(String(channelId))
      await doc.update({
        members,
        updatedAt: new Date(),
      })
    }
  },

  async leaveFitnessChannel(channelId: number | string, userId: number | string): Promise<void> {
    const channel = await this.getFitnessChannelById(channelId)
    if (!channel) throw new Error('Channel not found')
    
    const members = (channel.members || []).filter((m: any) => m.userId !== userId)
    const doc = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(channelId))
    await doc.update({
      members,
      updatedAt: new Date(),
    })
  },

  async checkInFitnessChannel(channelId: number | string, userId: number | string, duration: number, note?: string): Promise<void> {
    await tcbDb.collection(COLLECTIONS.CHECK_INS).add({
      channelId,
      userId,
      checkDate: new Date(),
      duration,
      note,
      createdAt: new Date(),
    })
  },

  async getChannelCheckIns(channelId: number | string, startDate: Date, endDate: Date): Promise<CheckIn[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({
        channelId,
        checkDate: { $gte: startDate, $lte: endDate }
      })
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async createChannelComment(data: { channelId: number | string; userId: number | string; content: string }): Promise<void> {
    await tcbDb.collection(COLLECTIONS.CHANNEL_COMMENTS).add({
      channelId: data.channelId,
      userId: data.userId,
      content: data.content,
      createdAt: new Date(),
    })
  },

  async getChannelComments(channelId: number | string): Promise<ChannelComment[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHANNEL_COMMENTS)
      .where({ channelId })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async deleteChannelComment(commentId: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.CHANNEL_COMMENTS)
      .doc(String(commentId))
    await doc.remove()
  },

  async createLeaveRequest(data: { channelId: number | string; userId: number | string; startDate: Date; endDate: Date; reason?: string }): Promise<void> {
    await tcbDb.collection(COLLECTIONS.LEAVE_REQUESTS).add({
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  },

  async getLeaveRequests(channelId: number | string): Promise<LeaveRequest[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.LEAVE_REQUESTS)
      .where({ channelId })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async updateLeaveStatus(requestId: number | string, status: 'approved' | 'rejected'): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.LEAVE_REQUESTS)
      .doc(String(requestId))
    await doc.update({
      status,
      updatedAt: new Date(),
    })
  },

  async isChannelCreator(channelId: number | string, userId: number | string): Promise<boolean> {
    const channel = await this.getFitnessChannelById(channelId)
    return channel?.creatorId === userId
  },

  async isChannelMember(channelId: number | string, userId: number | string): Promise<boolean> {
    const channel = await this.getFitnessChannelById(channelId)
    return !!(channel?.members?.find((m: any) => m.userId === userId))
  },

  async getActiveChannelForUser(userId: number | string): Promise<FitnessChannel | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .where({
        'members.userId': userId,
        status: { $in: ['pending', 'active'] },
        endDate: { $gte: new Date() },
      })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async getCheckInsByChannel(channelId: number | string): Promise<CheckIn[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({ channelId })
      .orderBy('checkDate', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getCheckInByDate(channelId: number | string, userId: number | string, checkDate: string): Promise<CheckIn | null> {
    const startOfDay = new Date(checkDate + 'T00:00:00.000Z')
    const endOfDay = new Date(checkDate + 'T23:59:59.999Z')
    const { data } = await tcbDb.collection(COLLECTIONS.CHECK_INS)
      .where({
        channelId,
        userId,
        checkDate: { $gte: startOfDay, $lte: endOfDay }
      })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async createCheckIn(data: { channelId: number | string; userId: number | string; checkDate: Date; duration: number; note?: string; imageUrl?: string }): Promise<CheckIn> {
    const { id } = await tcbDb.collection(COLLECTIONS.CHECK_INS).add({
      ...data,
      createdAt: new Date(),
    })
    return { id, ...data } as CheckIn
  },

  async findFriendRequest(fromUserId: number | string, toUserId: number | string): Promise<Friend | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        userId: fromUserId,
        friendId: toUserId,
        status: 'pending'
      })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async findFriendById(friendId: number | string): Promise<Friend | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({ _id: friendId })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async updateFriendStatus(friendId: number | string, status: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .doc(String(friendId))
    await doc.update({
      status,
      updatedAt: new Date(),
    })
  },

  async updateChannelStatus(channelId: number | string, status: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(channelId))
    await doc.update({
      status,
      updatedAt: new Date(),
    })
  },

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

  // ========== 统计相关（补充） ==========
  async getAllUsers(): Promise<User[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS).get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  async getAllWeightEntries(): Promise<WeightEntry[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .orderBy('date', 'desc')
      .get()
    return data.map((d: any) => ({ ...d, id: d._id }))
  },

  // 删除用户
  async deleteUser(id: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS).doc(String(id)).remove()
  },
}

// ==================== 导出适配器 ====================

export const adapter = CURRENT_DB === 'cloudbase' ? cloudbaseAdapter : cloudbaseAdapter

// 强制使用 CloudBase 适配器（因为我们部署到 CloudBase）
console.log('[DB Adapter] Using adapter:', CURRENT_DB === 'cloudbase' ? 'CloudBase' : 'CloudBase (default)')
