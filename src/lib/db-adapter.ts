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
}

/**
 * 体重记录数据模型
 */
export interface WeightEntry {
  _id?: string
  weight: number
  note?: string
  date: Date
  createdAt?: Date
  _openid?: string  // CloudBase 用户标识
}

/**
 * 用户数据模型
 */
export interface User {
  _id?: string
  username: string
  password: string  // 已哈希的密码
  createdAt?: Date
  updatedAt?: Date
  _openid?: string  // CloudBase 用户标识
}

/**
 * 用户设置数据模型
 */
export interface UserSettings {
  _id?: string
  height: number
  targetWeight: number
  createdAt?: Date
  updatedAt?: Date
  _openid?: string  // CloudBase 用户标识
}

// ==================== Prisma 适配器 ====================

const prismaAdapter = {
  // 获取所有体重记录
  async getWeightEntries() {
    return prisma.weightEntry.findMany({
      orderBy: { date: 'desc' },
    })
  },

  // 创建体重记录
  async createWeightEntry(data: Omit<WeightEntry, '_id' | 'createdAt'>) {
    return prisma.weightEntry.create({
      data: {
        weight: data.weight,
        note: data.note || null,
        date: data.date,
      },
    })
  },

  // 删除体重记录
  async deleteWeightEntry(id: string | number) {
    return prisma.weightEntry.delete({
      where: { id: typeof id === 'string' ? parseInt(id) : id },
    })
  },

  // 根据ID查找用户
  async findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    })
  },

  // 创建用户
  async createUser(data: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
    return prisma.user.create({
      data: {
        username: data.username,
        password: data.password,
      },
    })
  },

  // 获取用户设置
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

  // 更新用户设置
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
}

// ==================== CloudBase 适配器 ====================

const cloudbaseAdapter = {
  // 获取所有体重记录
  async getWeightEntries() {
    const { data } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES)
      .orderBy('date', 'desc')
      .get()
    return data
  },

  // 创建体重记录
  async createWeightEntry(data: Omit<WeightEntry, '_id' | 'createdAt'>) {
    const entry: Omit<WeightEntry, '_id'> = {
      weight: data.weight,
      note: data.note,
      date: data.date,
      createdAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES).add(entry)
    return { _id: id, ...entry }
  },

  // 删除体重记录
  async deleteWeightEntry(id: string | number) {
    await tcbDb.collection(COLLECTIONS.WEIGHT_ENTRIES).doc(String(id)).remove()
    return { success: true }
  },

  // 根据用户名查找用户
  async findUserByUsername(username: string) {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .where({ username })
      .limit(1)
      .get()
    return data[0] || null
  },

  // 创建用户
  async createUser(data: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
    const user: Omit<User, '_id'> = {
      username: data.username,
      password: data.password,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.USERS).add(user)
    return { _id: id, ...user }
  },

  // 获取用户设置
  async getUserSettings() {
    const { data } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS)
      .limit(1)
      .get()
    
    if (data.length === 0) {
      const defaultSettings: Omit<UserSettings, '_id'> = {
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

  // 更新用户设置
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
    
    const newSettings: Omit<UserSettings, '_id'> = {
      height: data.height || 170,
      targetWeight: data.targetWeight || 65,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const { id } = await tcbDb.collection(COLLECTIONS.USER_SETTINGS).add(newSettings)
    return { _id: id, ...newSettings }
  },
}

// ==================== Prisma 适配器扩展 ====================

const prismaAdapterExtended = {
  ...prismaAdapter,
  
  // 获取所有用户（管理员功能）
  async getAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    })
  },
}

// ==================== CloudBase 适配器扩展 ====================

const cloudbaseAdapterExtended = {
  ...cloudbaseAdapter,
  
  // 获取所有用户（管理员功能）
  async getAllUsers() {
    const { data } = await tcbDb.collection(COLLECTIONS.USERS)
      .orderBy('createdAt', 'desc')
      .get()
    return data
  },
}

// ==================== 导出适配器 ====================

export const adapter = CURRENT_DB === 'cloudbase' ? cloudbaseAdapterExtended : prismaAdapterExtended
