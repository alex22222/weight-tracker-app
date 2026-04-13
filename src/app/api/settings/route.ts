import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { getUserFromRequest, validators } from '../../../lib/auth'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/settings - 获取用户设置
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }
    
    const userId = user.userId
    const username = user.username

    let settings = await adapter.getUserSettings(userId)
    
    if (!settings) {
      settings = await adapter.createUserSettings({
        userId: userId,
        height: 170,
        targetWeight: 65,
      })
    }
    
    // 获取用户信息（使用不同变量名避免冲突）
    const userInfo = await adapter.getUserById(userId)
    
    return NextResponse.json({ 
      settings,
      user: userInfo ? { 
        id: userInfo.id, 
        username: userInfo.username, 
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        gender: userInfo.gender 
      } : { 
        id: userId, 
        username: username || '用户', 
        nickname: null,
        avatar: null,
        gender: 'other' 
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/settings - 更新用户设置
export async function POST(request: NextRequest) {
  try {
    // 从 Token 获取用户
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }
    
    const userId = user.userId
    const body = await request.json()
    const { height, targetWeight, gender, age, avatar, nickname } = body

    // 验证数值
    if (height !== undefined) {
      const h = parseFloat(height)
      if (isNaN(h) || h < 50 || h > 300) {
        return NextResponse.json({ error: '身高必须在 50-300 cm 之间' }, { status: 400 })
      }
    }
    
    if (targetWeight !== undefined) {
      const w = parseFloat(targetWeight)
      if (isNaN(w) || w < 10 || w > 500) {
        return NextResponse.json({ error: '目标体重必须在 10-500 kg 之间' }, { status: 400 })
      }
    }

    let settings = await adapter.getUserSettings(userId)
    
    const updateData: any = {}
    if (height !== undefined) updateData.height = parseFloat(height)
    if (targetWeight !== undefined) updateData.targetWeight = parseFloat(targetWeight)
    if (gender !== undefined) updateData.gender = gender
    if (age !== undefined) updateData.age = parseInt(age)
    if (avatar !== undefined) updateData.avatar = avatar
    
    // 更新用户昵称（存储在 users 表中）
    if (nickname !== undefined && userId) {
      await adapter.updateUser(userId, { 
        nickname: validators.sanitizeString(nickname, 50) 
      })
    }

    if (settings) {
      settings = await adapter.updateUserSettings(userId, updateData)
    } else {
      settings = await adapter.createUserSettings({
        userId: userId,
        height: parseFloat(height) || 170,
        targetWeight: parseFloat(targetWeight) || 65,
      })
      // 更新其他字段
      if (Object.keys(updateData).length > 0) {
        settings = await adapter.updateUserSettings(userId, updateData)
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// PATCH /api/settings - 部分更新用户设置（与 POST 相同，支持 PATCH 方法）
export async function PATCH(request: NextRequest) {
  // 复用 POST 逻辑
  return POST(request)
}
