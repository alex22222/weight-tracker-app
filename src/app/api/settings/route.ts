import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter } from '../../../lib/db-adapter'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GET /api/settings?userId={userId} - 获取用户设置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let settings = await adapter.getUserSettings(userId)
    
    if (!settings) {
      settings = await adapter.createUserSettings({
        userId: userId,
        height: 170,
        targetWeight: 65,
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/settings - 更新用户设置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, height, targetWeight, gender, age, avatar } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (height !== undefined && targetWeight !== undefined) {
      if (isNaN(parseFloat(height)) || isNaN(parseFloat(targetWeight))) {
        return NextResponse.json({ error: 'Invalid values' }, { status: 400 })
      }
    }

    let settings = await adapter.getUserSettings(userId)
    
    const updateData: any = {}
    if (height !== undefined) updateData.height = parseFloat(height)
    if (targetWeight !== undefined) updateData.targetWeight = parseFloat(targetWeight)
    if (gender !== undefined) updateData.gender = gender
    if (age !== undefined) updateData.age = parseInt(age)
    if (avatar !== undefined) updateData.avatar = avatar

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
