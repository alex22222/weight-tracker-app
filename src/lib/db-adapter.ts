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
  READING_ENTRIES: 'reading_entries',
  USERS: 'users',
  USER_SETTINGS: 'user_settings',
  MESSAGES: 'messages',
  FRIENDS: 'friends',
  FITNESS_CHANNELS: 'fitness_channels',
  CHANNEL_MEMBERS: 'channel_members',
  CHECK_INS: 'check_ins',
  CHANNEL_COMMENTS: 'channel_comments',
  LEAVE_REQUESTS: 'leave_requests',
  GOALS: 'goals',
  TASKS: 'tasks',
  TASK_MEMBERS: 'task_members',
  TASK_CHECK_INS: 'task_check_ins',
  FEEDBACK: 'feedback',
  VERIFICATION_CODES: 'verification_codes',
  BOOK_RECOMMENDATIONS: 'book_recommendations',
  DIET_RECORDS: 'diet_records',
  RUNNING_ENTRIES: 'running_entries',
  CYCLING_ENTRIES: 'cycling_entries',
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
  SYSTEM_MESSAGE: 'SYSTEM_MESSAGE',
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
  imageUrl?: string | null
  date: Date
  createdAt?: Date
  userId?: number | string
}

export interface ReadingEntry {
  id?: number | string
  bookName: string
  pages: number
  note?: string | null
  date: Date
  createdAt?: Date
  userId?: number | string
}

export interface RunningEntry {
  id?: number | string
  distance: number
  duration: number
  note?: string | null
  date: Date
  createdAt?: Date
  userId?: number | string
}

export interface CyclingEntry {
  id?: number | string
  distance: number
  duration: number
  note?: string | null
  date: Date
  createdAt?: Date
  userId?: number | string
}

export interface User {
  id?: number | string
  username?: string | null
  password?: string | null
  email?: string | null
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
  friendRequestId?: number | string | null
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
  description?: string | null
  creatorId: number | string
  weeklyCheckInCount: number
  checkInMinutes: number
  startDate: Date
  endDate: Date
  status: 'pending' | 'active' | 'completed'
  members?: ChannelMember[]
}

export interface Goal {
  id?: number | string
  title: string
  description?: string | null
  category: 'fitness' | 'reading' | 'study' | 'work' | 'life' | 'other'
  targetCount: number
  currentCount: number
  unit: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'once'
  startDate: Date
  endDate?: Date | null
  status: 'active' | 'completed' | 'abandoned'
  userId?: number | string
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

// ========== 打卡任务相关接口 ==========
export interface Task {
  id?: number | string
  title: string
  description?: string
  type: 'fitness' | 'reading'
  creatorId: number | string
  startDate: Date
  endDate: Date
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  createdAt?: Date
  updatedAt?: Date
}

export interface TaskMember {
  id?: number | string
  taskId: number | string
  userId: number | string
  status: 'invited' | 'joined' | 'declined' | 'removed'
  joinedAt?: Date
  totalCount: number
}

export interface TaskCheckIn {
  id?: number | string
  taskId: number | string
  userId: number | string
  entryId: number | string
  entryType: 'weight' | 'reading'
  checkedAt: Date
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
  db: tcbDb,

  // ========== 用户相关 ==========
  async createUser(data: { username: string; password: string; email?: string; gender?: string }): Promise<User> {
    const userData: any = {
      username: data.username,
      password: data.password,
      gender: data.gender || 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    if (data.email) userData.email = data.email
    const { id } = await tcbDb.collection(COLLECTIONS.USERS).add(userData)
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

  async findUserByEmail(email: string): Promise<User | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .where({ email })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
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

  async updateUserGender(id: number | string, gender: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS)
      .doc(String(id))
    await doc.update({
      gender,
      updatedAt: new Date(),
    })
  },

  // ========== 体重记录相关 ==========
  async createWeightEntry(data: { weight: number; note?: string; imageUrl?: string; date: Date; userId: number | string }): Promise<WeightEntry> {
    const entryData: any = {
      weight: data.weight,
      note: data.note,
      date: data.date,
      userId: data.userId,
      createdAt: new Date(),
    }
    if (data.imageUrl) entryData.imageUrl = data.imageUrl
    const { id } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES).add(entryData)
    return { id, ...data } as WeightEntry
  },

  async getWeightEntriesByUser(userId: number | string): Promise<WeightEntry[]> {
    try {
      console.log('[DB] Getting weight entries for user:', userId)
      
      // 检查 tcbDb 是否可用
      if (!tcbDb || !tcbDb.collection) {
        console.error('[DB] CloudBase database not initialized')
        return []
      }
      
      const collection = tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      console.log('[DB] Collection object:', typeof collection)
      
      const result = await collection
        .where({ userId })
        .orderBy('date', 'desc')
        .get()
      
      console.log('[DB] Query result:', typeof result, result ? Object.keys(result) : 'null')
      
      const data = result?.data || []
      console.log('[DB] Raw data:', Array.isArray(data) ? data.length : 'not array', data)
      
      const entries = Array.isArray(data) ? data.map((d: any) => ({ ...d, id: d._id })) : []
      console.log('[DB] Parsed entries:', entries.length)
      
      return entries
    } catch (error: any) {
      console.error('[DB] Error getting weight entries:', error.message || error)
      return []
    }
  },

  async getWeightEntryById(id: number | string): Promise<WeightEntry | null> {
    const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .where({ _id: id })
      .limit(1)
      .get()
    return data[0] ? { ...data[0], id: data[0]._id } : null
  },

  async getLastWeightEntryByUser(userId: number | string): Promise<WeightEntry | null> {
    try {
      const result = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
        .where({ userId })
        .orderBy('date', 'desc')
        .limit(1)
        .get()
      const data = result.data || []
      return data[0] ? { ...data[0], id: data[0]._id } : null
    } catch (error) {
      console.error('Error getting last weight entry:', error)
      return null
    }
  },

  async updateWeightEntry(id: number | string, data: { weight?: number; note?: string; imageUrl?: string; date?: Date }): Promise<WeightEntry> {
    const doc = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .doc(String(id))
    const updateData: any = { ...data }
    if (updateData.imageUrl === null || updateData.imageUrl === undefined) {
      delete updateData.imageUrl
    }
    await doc.update(updateData)
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
  async createMessage(data: { senderId: number | string; receiverId?: number | string; channelId?: number | string; content: string; type: MessageTypeValue; friendRequestId?: number | string }): Promise<Message> {
    const messageData: any = {
      senderId: data.senderId,
      receiverId: data.receiverId,
      channelId: data.channelId,
      content: data.content,
      type: data.type,
      isRead: false,
      createdAt: new Date(),
    }
    if (data.friendRequestId) {
      messageData.friendRequestId = String(data.friendRequestId)
    }
    const { id } = await tcbDb.collection(COLLECTIONS.MESSAGES).add(messageData)
    console.log('[DB] Created message with friendRequestId:', data.friendRequestId, 'message id:', id)
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

  async deleteAllMessages(userId: number | string): Promise<number> {
    const { data } = await tcbDb.collection(COLLECTIONS.MESSAGES)
      .where({
        receiverId: userId
      })
      .get()
    for (const msg of data) {
      const doc = await tcbDb.collection(COLLECTIONS.MESSAGES)
        .doc(String(msg._id))
      await doc.remove()
    }
    return data.length
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
    // 查询双向好友关系：我添加的 或 添加我的
    const { data: data1 } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        userId,
        status: 'accepted'
      })
      .get()
    
    const { data: data2 } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        friendId: userId,
        status: 'accepted'
      })
      .get()
    
    // 合并并去重
    const allFriends = [...data1, ...data2]
    const seen = new Set()
    const uniqueFriends = allFriends.filter((d: any) => {
      const id = d._id
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    
    // 获取好友详细信息
    const friendsWithDetails = await Promise.all(
      uniqueFriends.map(async (friend: any) => {
        // 确定好友ID（如果对方添加我，friendId是我的ID，userId是对方ID）
        const friendUserId = String(friend.userId) === String(userId) 
          ? friend.friendId 
          : friend.userId
        
        // 获取好友用户信息
        const friendInfo = await this.getUserById(friendUserId)
        
        return {
          ...friend,
          id: friend._id,
          friendUserId,
          friendInfo: friendInfo ? {
            username: friendInfo.username,
            nickname: friendInfo.nickname,
            avatar: friendInfo.avatar
          } : null
        }
      })
    )
    
    return friendsWithDetails
  },

  async getPendingFriendRequests(userId: number | string): Promise<Friend[]> {
    // 查询发给我的好友请求
    const { data } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        friendId: userId,
        status: 'pending'
      })
      .get()
    
    // 获取发送者信息
    const requestsWithInfo = await Promise.all(
      data.map(async (friend: any) => {
        const senderInfo = await this.getUserById(friend.userId)
        return {
          ...friend,
          id: friend._id,
          friendInfo: senderInfo ? {
            username: senderInfo.username,
            nickname: senderInfo.nickname,
            avatar: senderInfo.avatar
          } : null
        }
      })
    )
    
    return requestsWithInfo
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

  async deleteFitnessChannel(id: number | string): Promise<void> {
    await tcbDb.collection(COLLECTIONS.FITNESS_CHANNELS)
      .doc(String(id))
      .remove()
  },

  async joinFitnessChannel(channelId: number | string, userId: number | string, username: string): Promise<void> {
    const channel = await this.getFitnessChannelById(channelId)
    if (!channel) throw new Error('Channel not found')
    
    const userIdStr = String(userId)
    const members = channel.members || []
    if (!members.find((m: any) => String(m.userId) === userIdStr)) {
      members.push({
        userId: userIdStr,
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
    
    const userIdStr = String(userId)
    const members = (channel.members || []).filter((m: any) => String(m.userId) !== userIdStr)
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
    return String(channel?.creatorId) === String(userId)
  },

  async isChannelMember(channelId: number | string, userId: number | string): Promise<boolean> {
    const channel = await this.getFitnessChannelById(channelId)
    const userIdStr = String(userId)
    return !!(channel?.members?.find((m: any) => String(m.userId) === userIdStr))
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
    // 检查双向请求：A->B 或 B->A 都算已存在
    const { data: data1 } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        userId: fromUserId,
        friendId: toUserId,
        status: 'pending'
      })
      .limit(1)
      .get()
    
    if (data1[0]) {
      return { ...data1[0], id: data1[0]._id }
    }
    
    const { data: data2 } = await tcbDb.collection(COLLECTIONS.FRIENDS)
      .where({
        userId: toUserId,
        friendId: fromUserId,
        status: 'pending'
      })
      .limit(1)
      .get()
    
    return data2[0] ? { ...data2[0], id: data2[0]._id, isReverse: true } : null
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

  // ========== 读书打卡相关 ==========
  async createReadingEntry(data: { bookName: string; pages: number; note?: string; date: Date; userId: number | string }): Promise<ReadingEntry> {
    const { id } = await tcbDb.collection(COLLECTIONS.READING_ENTRIES).add({
      bookName: data.bookName,
      pages: data.pages,
      note: data.note || null,
      date: data.date,
      userId: data.userId,
      createdAt: new Date(),
    })
    return { id, ...data } as ReadingEntry
  },

  async getReadingEntriesByUser(userId: number | string): Promise<ReadingEntry[]> {
    try {
      const result = await tcbDb.collection(COLLECTIONS.READING_ENTRIES)
        .where({ userId })
        .orderBy('date', 'desc')
        .get()
      const data = result.data || []
      return Array.isArray(data) ? data.map((d: any) => ({ ...d, id: d._id })) : []
    } catch (error) {
      console.error('Error getting reading entries:', error)
      return []
    }
  },

  async getLastReadingEntryByUser(userId: number | string): Promise<ReadingEntry | null> {
    try {
      const result = await tcbDb.collection(COLLECTIONS.READING_ENTRIES)
        .where({ userId })
        .orderBy('date', 'desc')
        .limit(1)
        .get()
      const data = result.data || []
      return data[0] ? { ...data[0], id: data[0]._id } : null
    } catch (error) {
      console.error('Error getting last reading entry:', error)
      return null
    }
  },

  async getReadingEntriesByDate(userId: number | string, dateStr: string): Promise<ReadingEntry | null> {
    try {
      const result = await tcbDb.collection(COLLECTIONS.READING_ENTRIES)
        .where({ userId })
        .get()
      const entries = (result.data || []) as any[]
      const entry = entries.find(e => {
        const entryDateStr = new Date(e.date).toISOString().split('T')[0]
        return entryDateStr === dateStr
      })
      return entry ? { ...entry, id: entry._id } : null
    } catch (error) {
      console.error('Error getting reading entry by date:', error)
      return null
    }
  },

  // ========== 跑步记录相关 ==========
  async createRunningEntry(data: { distance: number; duration: number; note?: string; date: Date; userId: number | string }): Promise<RunningEntry> {
    const entryData: any = {
      distance: data.distance,
      duration: data.duration,
      note: data.note || null,
      date: data.date,
      userId: String(data.userId),
      createdAt: new Date(),
    }
    console.log('[DB] createRunningEntry:', entryData)
    const { id } = await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES).add(entryData)
    return { id, ...data } as RunningEntry
  },

  async getRunningEntriesByUser(userId: number | string): Promise<RunningEntry[]> {
    try {
      const uid = String(userId)
      const uidNum = parseInt(String(userId), 10)
      console.log('[DB] getRunningEntriesByUser, userId:', uid, 'num:', uidNum)
      let result: any
      let usedOrderBy = true
      try {
        result = await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES)
          .where({ userId: uid })
          .orderBy('date', 'desc')
          .get()
      } catch (orderByError) {
        console.warn('[DB] Running orderBy failed, fallback to plain query:', orderByError)
        usedOrderBy = false
        result = await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES)
          .where({ userId: uid })
          .get()
      }
      let data = result?.data || []
      console.log('[DB] Running string query result count:', data.length, 'usedOrderBy:', usedOrderBy)

      // 兼容旧数据：如果字符串查询为空，尝试数字 userId
      if (data.length === 0 && !isNaN(uidNum)) {
        console.log('[DB] Trying numeric userId query for running')
        let numResult: any
        try {
          numResult = await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES)
            .where({ userId: uidNum })
            .orderBy('date', 'desc')
            .get()
        } catch (orderByError) {
          console.warn('[DB] Running numeric orderBy failed, fallback:', orderByError)
          usedOrderBy = false
          numResult = await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES)
            .where({ userId: uidNum })
            .get()
        }
        const numData = numResult?.data || []
        console.log('[DB] Running numeric query result count:', numData.length)
        data = numData
      }

      const mapped = Array.isArray(data) ? data.map((d: any) => ({ ...d, id: d._id || d.id })) : []
      // 如果没有 orderBy，在内存中按 date 降序排序
      if (!usedOrderBy) {
        return mapped.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
      return mapped
    } catch (error) {
      console.error('Error getting running entries:', error)
      return []
    }
  },

  async getLastRunningEntryByUser(userId: number | string): Promise<RunningEntry | null> {
    try {
      const uid = String(userId)
      const uidNum = parseInt(String(userId), 10)
      let result = await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES)
        .where({ userId: uid })
        .orderBy('date', 'desc')
        .limit(1)
        .get()
      let data = result.data || []
      if (data.length === 0 && !isNaN(uidNum)) {
        result = await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES)
          .where({ userId: uidNum })
          .orderBy('date', 'desc')
          .limit(1)
          .get()
        data = result.data || []
      }
      return data[0] ? { ...data[0], id: data[0]._id } : null
    } catch (error) {
      console.error('Error getting last running entry:', error)
      return null
    }
  },

  async deleteRunningEntry(id: number | string): Promise<void> {
    await tcbDb.collection(COLLECTIONS.RUNNING_ENTRIES)
      .doc(String(id))
      .remove()
  },

  // ========== 骑行记录相关 ==========
  async createCyclingEntry(data: { distance: number; duration: number; note?: string; date: Date; userId: number | string }): Promise<CyclingEntry> {
    const entryData: any = {
      distance: data.distance,
      duration: data.duration,
      note: data.note || null,
      date: data.date,
      userId: String(data.userId),
      createdAt: new Date(),
    }
    console.log('[DB] createCyclingEntry:', entryData)
    const { id } = await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES).add(entryData)
    return { id, ...data } as CyclingEntry
  },

  async getCyclingEntriesByUser(userId: number | string): Promise<CyclingEntry[]> {
    try {
      const uid = String(userId)
      const uidNum = parseInt(String(userId), 10)
      console.log('[DB] getCyclingEntriesByUser, userId:', uid, 'num:', uidNum)
      let result: any
      let usedOrderBy = true
      try {
        result = await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES)
          .where({ userId: uid })
          .orderBy('date', 'desc')
          .get()
      } catch (orderByError) {
        console.warn('[DB] Cycling orderBy failed, fallback to plain query:', orderByError)
        usedOrderBy = false
        result = await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES)
          .where({ userId: uid })
          .get()
      }
      let data = result?.data || []
      console.log('[DB] Cycling string query result count:', data.length, 'usedOrderBy:', usedOrderBy)

      // 兼容旧数据：如果字符串查询为空，尝试数字 userId
      if (data.length === 0 && !isNaN(uidNum)) {
        console.log('[DB] Trying numeric userId query for cycling')
        let numResult: any
        try {
          numResult = await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES)
            .where({ userId: uidNum })
            .orderBy('date', 'desc')
            .get()
        } catch (orderByError) {
          console.warn('[DB] Cycling numeric orderBy failed, fallback:', orderByError)
          usedOrderBy = false
          numResult = await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES)
            .where({ userId: uidNum })
            .get()
        }
        const numData = numResult?.data || []
        console.log('[DB] Cycling numeric query result count:', numData.length)
        data = numData
      }

      const mapped = Array.isArray(data) ? data.map((d: any) => ({ ...d, id: d._id || d.id })) : []
      // 如果没有 orderBy，在内存中按 date 降序排序
      if (!usedOrderBy) {
        return mapped.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }
      return mapped
    } catch (error) {
      console.error('Error getting cycling entries:', error)
      return []
    }
  },

  async getLastCyclingEntryByUser(userId: number | string): Promise<CyclingEntry | null> {
    try {
      const uid = String(userId)
      const uidNum = parseInt(String(userId), 10)
      let result = await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES)
        .where({ userId: uid })
        .orderBy('date', 'desc')
        .limit(1)
        .get()
      let data = result.data || []
      if (data.length === 0 && !isNaN(uidNum)) {
        result = await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES)
          .where({ userId: uidNum })
          .orderBy('date', 'desc')
          .limit(1)
          .get()
        data = result.data || []
      }
      return data[0] ? { ...data[0], id: data[0]._id } : null
    } catch (error) {
      console.error('Error getting last cycling entry:', error)
      return null
    }
  },

  async deleteCyclingEntry(id: number | string): Promise<void> {
    await tcbDb.collection(COLLECTIONS.CYCLING_ENTRIES)
      .doc(String(id))
      .remove()
  },

  async getReadingStreak(userId: number | string): Promise<number> {
    try {
      const entries = await this.getReadingEntriesByUser(userId)
      if (entries.length === 0) return 0

      // 按日期去重并排序
      const dates = Array.from(new Set(entries.map((e: any) => new Date(e.date).toISOString().split('T')[0])) as Set<string>).sort().reverse()
      
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      
      // 检查今天或昨天是否有打卡
      if (dates[0] === today || dates[0] === yesterday) {
        streak = 1
        for (let i = 1; i < dates.length; i++) {
          const prevDate = new Date(dates[i - 1])
          const currDate = new Date(dates[i])
          const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / 86400000)
          if (diffDays === 1) {
            streak++
          } else {
            break
          }
        }
      }
      
      return streak
    } catch (error) {
      console.error('Error calculating reading streak:', error)
      return 0
    }
  },

  // ========== 目标/Flag 相关 ==========
  async createGoal(data: { title: string; description?: string; category: string; targetCount: number; unit: string; frequency: string; startDate: Date; endDate?: Date; userId: number | string }): Promise<Goal> {
    const { id } = await tcbDb.collection(COLLECTIONS.GOALS).add({
      title: data.title,
      description: data.description || null,
      category: data.category,
      targetCount: data.targetCount,
      currentCount: 0,
      unit: data.unit,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: 'active',
      userId: data.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data, currentCount: 0, status: 'active' } as Goal
  },

  async getGoalsByUser(userId: number | string): Promise<Goal[]> {
    try {
      const result = await tcbDb.collection(COLLECTIONS.GOALS)
        .where({ userId })
        .orderBy('createdAt', 'desc')
        .get()
      const data = result.data || []
      return Array.isArray(data) ? data.map((d: any) => ({ ...d, id: d._id })) : []
    } catch (error) {
      console.error('Error getting goals:', error)
      return []
    }
  },

  async getActiveGoalsByUser(userId: number | string): Promise<Goal[]> {
    try {
      const result = await tcbDb.collection(COLLECTIONS.GOALS)
        .where({ userId, status: 'active' })
        .orderBy('createdAt', 'desc')
        .get()
      const data = result.data || []
      return Array.isArray(data) ? data.map((d: any) => ({ ...d, id: d._id })) : []
    } catch (error) {
      console.error('Error getting active goals:', error)
      return []
    }
  },

  async getGoalById(id: number | string): Promise<Goal | null> {
    try {
      const { data } = await tcbDb.collection(COLLECTIONS.GOALS)
        .where({ _id: id })
        .limit(1)
        .get()
      return data[0] ? { ...data[0], id: data[0]._id } : null
    } catch (error) {
      console.error('Error getting goal by id:', error)
      return null
    }
  },

  async updateGoal(id: number | string, data: Partial<Goal>): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.GOALS)
      .doc(String(id))
    await doc.update({
      ...data,
      updatedAt: new Date(),
    })
  },

  async incrementGoalProgress(id: number | string, amount: number = 1): Promise<void> {
    const goal = await this.getGoalById(id)
    if (!goal) throw new Error('Goal not found')
    
    const newCount = (goal.currentCount || 0) + amount
    const isCompleted = newCount >= goal.targetCount
    
    await this.updateGoal(id, {
      currentCount: newCount,
      status: isCompleted ? 'completed' : 'active'
    })
  },

  async deleteGoal(id: number | string): Promise<void> {
    await tcbDb.collection(COLLECTIONS.GOALS)
      .doc(String(id))
      .remove()
  },

  // 删除用户
  async deleteUser(id: number | string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS).doc(String(id)).remove()
  },

  // ========== 打卡任务相关 ==========
  async createTask(data: { title: string; description?: string; type: 'fitness' | 'reading'; startDate: Date; endDate: Date; creatorId: number | string }): Promise<Task> {
    const { id } = await tcbDb.collection(COLLECTIONS.TASKS).add({
      title: data.title,
      description: data.description || null,
      type: data.type,
      creatorId: data.creatorId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id, ...data, status: 'pending' } as Task
  },

  async getTasksByUser(userId: number | string): Promise<Task[]> {
    try {
      // 获取用户创建的任务
      const { data: createdTasks } = await tcbDb.collection(COLLECTIONS.TASKS)
        .where({ creatorId: userId })
        .orderBy('createdAt', 'desc')
        .get()
      
      // 获取用户参与的任务
      const { data: memberships } = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
        .where({ userId, status: 'joined' })
        .get()
      
      const taskIds = memberships.map((m: any) => m.taskId)
      
      let joinedTasks: any[] = []
      if (taskIds.length > 0) {
        const { data: tasks } = await tcbDb.collection(COLLECTIONS.TASKS)
          .where({ _id: { $in: taskIds } })
          .get()
        joinedTasks = tasks || []
      }
      
      // 合并并去重
      const allTasks = [...createdTasks, ...joinedTasks]
      const uniqueTasks = allTasks.filter((t, i, arr) => 
        arr.findIndex(item => item._id === t._id) === i
      )
      
      return uniqueTasks.map((d: any) => ({ ...d, id: d._id }))
    } catch (error) {
      console.error('Error getting tasks:', error)
      return []
    }
  },

  async getTaskById(id: number | string): Promise<Task | null> {
    try {
      const { data } = await tcbDb.collection(COLLECTIONS.TASKS)
        .where({ _id: id })
        .limit(1)
        .get()
      return data[0] ? { ...data[0], id: data[0]._id } : null
    } catch (error) {
      console.error('Error getting task by id:', error)
      return null
    }
  },

  async updateTask(id: number | string, data: Partial<Task>): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.TASKS)
      .doc(String(id))
    await doc.update({
      ...data,
      updatedAt: new Date(),
    })
  },

  async deleteTask(id: number | string): Promise<void> {
    await tcbDb.collection(COLLECTIONS.TASKS)
      .doc(String(id))
      .remove()
  },

  // 任务成员相关
  async addTaskMember(data: { taskId: number | string; userId: number | string }): Promise<TaskMember> {
    const { id } = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS).add({
      taskId: data.taskId,
      userId: data.userId,
      status: 'invited',
      totalCount: 0,
      joinedAt: undefined,
    })
    return { id, ...data, status: 'invited', totalCount: 0 } as TaskMember
  },

  async updateTaskMemberStatus(taskId: number | string, userId: number | string, status: 'invited' | 'joined' | 'declined' | 'removed'): Promise<void> {
    const { data } = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
      .where({ taskId, userId })
      .limit(1)
      .get()
    
    if (data && data.length > 0) {
      const doc = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
        .doc(String(data[0]._id))
      await doc.update({
        status,
        joinedAt: status === 'joined' ? new Date() : data[0].joinedAt,
      })
    }
  },

  async getTaskMembers(taskId: number | string): Promise<TaskMember[]> {
    try {
      const { data } = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
        .where({ taskId })
        .get()
      return data.map((d: any) => ({ ...d, id: d._id }))
    } catch (error) {
      console.error('Error getting task members:', error)
      return []
    }
  },

  async getTaskMember(taskId: number | string, userId: number | string): Promise<TaskMember | null> {
    try {
      const { data } = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
        .where({ taskId, userId })
        .limit(1)
        .get()
      return data[0] ? { ...data[0], id: data[0]._id } : null
    } catch (error) {
      console.error('Error getting task member:', error)
      return null
    }
  },

  async incrementTaskMemberCount(taskId: number | string, userId: number | string): Promise<void> {
    const member = await this.getTaskMember(taskId, userId)
    if (member) {
      await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
        .doc(String(member.id))
        .update({
          totalCount: (member.totalCount || 0) + 1,
        })
    }
  },

  // 任务打卡相关
  async createTaskCheckIn(data: { taskId: number | string; userId: number | string; entryId: number | string; entryType: 'weight' | 'reading' }): Promise<TaskCheckIn> {
    const checkInData = {
      taskId: data.taskId,
      userId: data.userId,
      entryId: data.entryId,
      entryType: data.entryType,
      checkedAt: new Date(),
      createdAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.TASK_CHECK_INS).add(checkInData)
    
    // 更新成员打卡计数
    const { data: members } = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
      .where({ taskId: data.taskId, userId: data.userId })
      .get()
    
    if (members && members.length > 0) {
      const member = members[0]
      const doc = await tcbDb.collection(COLLECTIONS.TASK_MEMBERS)
        .doc(String(member._id))
      await doc.update({ totalCount: (member.totalCount || 0) + 1 })
    }
    
    return { id, ...checkInData } as TaskCheckIn
  },

  async getTaskCheckIns(taskId: number | string): Promise<TaskCheckIn[]> {
    try {
      const { data } = await tcbDb.collection(COLLECTIONS.TASK_CHECK_INS)
        .where({ taskId })
        .orderBy('checkedAt', 'desc')
        .get()
      return data.map((d: any) => ({ ...d, id: d._id }))
    } catch (error) {
      console.error('Error getting task check-ins:', error)
      return []
    }
  },

  async getUserTaskCheckIns(taskId: number | string, userId: number | string): Promise<TaskCheckIn[]> {
    try {
      const { data } = await tcbDb.collection(COLLECTIONS.TASK_CHECK_INS)
        .where({ taskId, userId })
        .orderBy('checkedAt', 'desc')
        .get()
      return data.map((d: any) => ({ ...d, id: d._id }))
    } catch (error) {
      console.error('Error getting user task check-ins:', error)
      return []
    }
  },

  // ========== 好友动态相关 ==========
  async getFriendsRecentActivity(userId: number | string): Promise<any[]> {
    try {
      // 获取好友列表
      const friends = await this.getFriendsByUser(userId)
      if (friends.length === 0) return []

      const friendIds = friends.map(f => String(f.friendId || f.userId)).filter(Boolean)
      
      // 获取所有好友的体重记录（最近10条）
      const weightPromises = friendIds.map(async (fid) => {
        const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
          .where({ userId: fid })
          .orderBy('date', 'desc')
          .limit(1)
          .get()
        if (data && data.length > 0) {
          const entry = data[0]
          const user = await this.findUserById(fid)
          return {
            type: 'weight',
            userId: fid,
            username: user?.nickname || user?.username || '未知用户',
            avatar: user?.avatar || null,
            content: `记录了体重 ${entry.weight} kg`,
            note: entry.note || '',
            date: entry.date,
            createdAt: entry.createdAt,
          }
        }
        return null
      })

      // 获取所有好友的读书记录（最近10条）
      const readingPromises = friendIds.map(async (fid) => {
        const { data } = await tcbDb.collection(COLLECTIONS.READING_ENTRIES)
          .where({ userId: fid })
          .orderBy('date', 'desc')
          .limit(1)
          .get()
        if (data && data.length > 0) {
          const entry = data[0]
          const user = await this.findUserById(fid)
          return {
            type: 'reading',
            userId: fid,
            username: user?.nickname || user?.username || '未知用户',
            avatar: user?.avatar || null,
            content: `阅读了《${entry.bookName}》${entry.pages} 页`,
            note: entry.note || '',
            date: entry.date,
            createdAt: entry.createdAt,
          }
        }
        return null
      })

      // 获取所有好友的目标打卡记录
      const goalPromises = friendIds.map(async (fid) => {
        const { data } = await tcbDb.collection(COLLECTIONS.GOALS)
          .where({ userId: fid, status: 'active' })
          .orderBy('updatedAt', 'desc')
          .limit(1)
          .get()
        if (data && data.length > 0) {
          const goal = data[0]
          // 只返回最近更新的目标
          const updatedAt = new Date(goal.updatedAt || goal.createdAt)
          const now = new Date()
          const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)
          
          // 只显示24小时内更新的目标
          if (hoursDiff <= 24 && goal.currentCount > 0) {
            const user = await this.findUserById(fid)
            return {
              type: 'goal',
              userId: fid,
              username: user?.nickname || user?.username || '未知用户',
              avatar: user?.avatar || null,
              content: `打卡了目标「${goal.title}」(${goal.currentCount}/${goal.targetCount}${goal.unit})`,
              note: '',
              date: goal.updatedAt || goal.createdAt,
              createdAt: goal.updatedAt || goal.createdAt,
            }
          }
        }
        return null
      })

      const [weightResults, readingResults, goalResults] = await Promise.all([
        Promise.all(weightPromises),
        Promise.all(readingPromises),
        Promise.all(goalPromises),
      ])

      // 合并所有结果，过滤空值，按时间排序
      const allActivities = [
        ...weightResults.filter(Boolean),
        ...readingResults.filter(Boolean),
        ...goalResults.filter(Boolean),
      ]

      // 按日期排序（最新的在前）
      allActivities.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date)
        const dateB = new Date(b.createdAt || b.date)
        return dateB.getTime() - dateA.getTime()
      })

      // 限制返回数量
      return allActivities.slice(0, 10)
    } catch (error) {
      console.error('Error getting friends recent activity:', error)
      return []
    }
  },

  // ========== 反馈相关 ==========
  async createFeedback(data: { userId: number | string; type: string; content: string; contact?: string }): Promise<{ id: string }> {
    const feedbackData = {
      userId: data.userId,
      type: data.type,
      content: data.content,
      contact: data.contact || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.FEEDBACK).add(feedbackData)
    return { id }
  },

  async getFeedbackByUser(userId: number | string): Promise<any[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FEEDBACK)
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((item: any) => ({ ...item, id: item._id }))
  },

  async getAllFeedback(): Promise<any[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.FEEDBACK)
      .orderBy('createdAt', 'desc')
      .get()
    return data.map((item: any) => ({ ...item, id: item._id }))
  },

  async updateFeedbackStatus(feedbackId: number | string, status: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.FEEDBACK)
      .doc(String(feedbackId))
    await doc.update({ status, updatedAt: new Date().toISOString() })
  },

  // ========== 书籍推荐相关 ==========
  async getBookRecommendations(): Promise<any[]> {
    const { data } = await tcbDb.collection(COLLECTIONS.BOOK_RECOMMENDATIONS)
      .where({ isActive: true })
      .orderBy('order', 'asc')
      .get()
    return data.map((item: any) => ({ ...item, id: item._id }))
  },

  // ========== 验证码相关 ==========
  async saveVerificationCode(data: { email: string; code: string; purpose: string; expiresAt: string }): Promise<void> {
    // 先删除该邮箱同目的的旧验证码
    const { data: oldCodes } = await tcbDb.collection(COLLECTIONS.VERIFICATION_CODES)
      .where({ email: data.email, purpose: data.purpose })
      .get()
    for (const old of oldCodes) {
      await tcbDb.collection(COLLECTIONS.VERIFICATION_CODES).doc(String(old._id)).remove()
    }

    await tcbDb.collection(COLLECTIONS.VERIFICATION_CODES).add({
      email: data.email,
      code: data.code,
      purpose: data.purpose,
      expiresAt: data.expiresAt,
      createdAt: new Date().toISOString(),
      used: false,
    })
  },

  async verifyCode(email: string, code: string, purpose: string): Promise<boolean> {
    const { data } = await tcbDb.collection(COLLECTIONS.VERIFICATION_CODES)
      .where({ email, purpose, used: false })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get()

    if (!data || data.length === 0) return false

    const record = data[0]
    const now = new Date().toISOString()
    if (record.expiresAt < now) return false
    if (record.code !== code) return false

    // 标记为已使用
    await tcbDb.collection(COLLECTIONS.VERIFICATION_CODES).doc(String(record._id)).update({ used: true })
    return true
  },

  async updateUserEmail(userId: number | string, email: string): Promise<void> {
    const doc = await tcbDb.collection(COLLECTIONS.USERS).doc(String(userId))
    await doc.update({ email, updatedAt: new Date().toISOString() })
  },

}

// ==================== 导出适配器 ====================

export const adapter = CURRENT_DB === 'cloudbase' ? cloudbaseAdapter : cloudbaseAdapter

// 强制使用 CloudBase 适配器（因为我们部署到 CloudBase）
console.log('[DB Adapter] Using adapter:', CURRENT_DB === 'cloudbase' ? 'CloudBase' : 'CloudBase (default)')
