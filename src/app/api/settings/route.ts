import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { resolveFileUrl } from '../../../lib/cloudbase'
import { getUserFromRequest, validators } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/settings - 获取用户设置
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    let settings = await adapter.getUserSettings(user.userId)
    
    if (!settings) {
      settings = await adapter.createUserSettings({
        userId: user.userId,
        height: 170,
        targetWeight: 65,
      })
    }
    
    const userInfo = await adapter.getUserById(user.userId)
    
    // 将 fileID 转换为临时 URL
    const avatarUrl = userInfo?.avatar ? await resolveFileUrl(userInfo.avatar) : null
    const settingsAvatarUrl = settings?.avatar ? await resolveFileUrl(settings.avatar) : null
    
    return NextResponse.json({ 
      settings: settings ? { ...settings, avatar: settingsAvatarUrl } : null,
      user: userInfo ? { 
        id: userInfo.id, 
        username: userInfo.username, 
        nickname: userInfo.nickname,
        avatar: avatarUrl,
        gender: userInfo.gender 
      } : { 
        id: user.userId, 
        username: user.username || '用户', 
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
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { height, targetWeight, gender, age, avatar, nickname } = body

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

    const updateData: any = {}
    if (height !== undefined) updateData.height = parseFloat(height)
    if (targetWeight !== undefined) updateData.targetWeight = parseFloat(targetWeight)
    if (gender !== undefined) updateData.gender = gender
    if (age !== undefined) updateData.age = parseInt(age)
    if (avatar !== undefined) updateData.avatar = avatar
    
    if (nickname !== undefined && user.userId) {
      await adapter.updateUser(user.userId, { 
        nickname: validators.sanitizeString(nickname, 50) 
      })
    }

    let settings = await adapter.getUserSettings(user.userId)
    
    if (settings) {
      settings = await adapter.updateUserSettings(user.userId, updateData)
    } else {
      settings = await adapter.createUserSettings({
        userId: user.userId,
        height: parseFloat(height) || 170,
        targetWeight: parseFloat(targetWeight) || 65,
      })
      if (Object.keys(updateData).length > 0) {
        settings = await adapter.updateUserSettings(user.userId, updateData)
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// PATCH - 同 POST
export async function PATCH(request: NextRequest) {
  return POST(request)
}
