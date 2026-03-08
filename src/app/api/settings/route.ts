import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'

// 验证 Token
function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId: parseInt(userId), username }
  } catch {
    return null
  }
}

// GET /api/settings - 获取用户设置和个人信息
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    let userProfile = null
    if (token) {
      const user = verifyToken(token)
      if (user) {
        userProfile = await adapter.getUserProfile(user.userId)
      }
    }
    
    const settings = await adapter.getUserSettings()
    return NextResponse.json({ ...settings, user: userProfile })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/settings - 更新用户设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { height, targetWeight } = body

    if (!height || !targetWeight || isNaN(parseFloat(height)) || isNaN(parseFloat(targetWeight))) {
      return NextResponse.json({ error: 'Invalid values' }, { status: 400 })
    }

    const settings = await adapter.updateUserSettings({
      height: parseFloat(height),
      targetWeight: parseFloat(targetWeight),
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// PATCH /api/settings - 更新个人信息（性别、头像等）
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const body = await request.json()
    const { gender, avatar } = body

    // 更新性别
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json({ error: '无效的性别值' }, { status: 400 })
    }
    if (gender) {
      await adapter.updateUserGender(user.userId, gender)
    }

    // 更新头像
    if (avatar !== undefined) {
      await adapter.updateUserAvatar(user.userId, avatar)
    }
    
    return NextResponse.json({ message: '个人信息更新成功' })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
