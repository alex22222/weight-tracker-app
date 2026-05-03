import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { getUserFromRequest, validators } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/user - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const userInfo = await adapter.getUserById(user.userId)
    if (!userInfo) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      id: userInfo.id,
      username: userInfo.username,
      nickname: userInfo.nickname,
      avatar: userInfo.avatar,
      gender: userInfo.gender,
      createdAt: userInfo.createdAt,
    })
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }
}

// PATCH /api/user - 更新当前用户信息
export async function PATCH(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const body = await request.json()
    const { nickname, avatar, gender } = body

    const updateData: any = {}

    if (nickname !== undefined) {
      const sanitized = validators.sanitizeString(nickname, 50)
      if (sanitized) updateData.nickname = sanitized
    }

    if (avatar !== undefined) {
      if (typeof avatar === 'string' && avatar.length < 2000) {
        updateData.avatar = avatar
      }
    }

    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'other']
      if (validGenders.includes(gender)) updateData.gender = gender
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 })
    }

    await adapter.updateUser(user.userId, updateData)

    return NextResponse.json({
      message: '更新成功',
      user: { ...updateData, id: user.userId, username: user.username }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 })
  }
}
