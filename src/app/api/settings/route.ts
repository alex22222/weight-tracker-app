import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'
import { verifyToken } from '../../../lib/auth'

// 验证 Token
function getUserFromToken(request: NextRequest): { userId: number; username: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/settings - 获取当前用户的设置
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    // 获取用户特定的设置
    const settings = await adapter.getUserSettings(user.userId)
    const userProfile = await adapter.getUserProfile(user.userId)
    
    return NextResponse.json({ 
      settings,
      user: userProfile
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 })
  }
}

// POST /api/settings - 更新当前用户的设置
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { height, targetWeight } = body

    // 验证输入
    if (height === undefined || targetWeight === undefined) {
      return NextResponse.json({ error: '缺少必要的参数' }, { status: 400 })
    }
    
    const heightValue = parseFloat(height)
    const targetWeightValue = parseFloat(targetWeight)
    
    if (isNaN(heightValue) || isNaN(targetWeightValue)) {
      return NextResponse.json({ error: '无效的数值' }, { status: 400 })
    }
    
    // 验证数值范围
    if (heightValue < 50 || heightValue > 300) {
      return NextResponse.json({ error: '身高应在 50-300 cm 之间' }, { status: 400 })
    }
    
    if (targetWeightValue < 10 || targetWeightValue > 500) {
      return NextResponse.json({ error: '目标体重应在 10-500 kg 之间' }, { status: 400 })
    }

    // 更新当前用户的设置
    const settings = await adapter.updateUserSettings({
      userId: user.userId,
      height: heightValue,
      targetWeight: targetWeightValue,
    } as any)

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 })
  }
}

// PATCH /api/settings - 更新个人信息（性别、头像等）
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { gender, avatar } = body

    // 验证性别值
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ error: '无效的性别值' }, { status: 400 })
    }

    // 更新性别
    if (gender) {
      await adapter.updateUserGender(user.userId, gender)
    }

    // 更新头像（验证 URL 格式）
    if (avatar !== undefined) {
      // 简单验证 URL 格式
      if (avatar && !avatar.match(/^https?:\/\/.+/)) {
        return NextResponse.json({ error: '无效的头像 URL' }, { status: 400 })
      }
      await adapter.updateUserAvatar(user.userId, avatar)
    }
    
    return NextResponse.json({ message: '个人信息更新成功' })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
