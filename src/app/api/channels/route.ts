import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { getUserFromRequest } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: '未登录或token无效' }, { status: 401 })

    // 获取所有频道
    const channels = await adapter.getFitnessChannels()

    // 为每个频道添加成员信息和我的加入状态，并转换状态值为大写
    const channelsWithDetails = channels.map((channel: any) => {
      // 转换状态为大写
      const status = channel.status?.toUpperCase?.() || channel.status
      
      // 检查当前用户是否是成员
      const isMember = channel.members?.some((m: any) => 
        String(m.userId) === String(user.userId)
      ) || false
      
      return {
        ...channel,
        status,
        isMember,
        memberCount: channel.members?.length || 0
      }
    })

    return NextResponse.json({ channels: channelsWithDetails })
  } catch (error) {
    console.error('获取频道列表错误:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: '未登录或token无效' }, { status: 401 })

    const body = await request.json()
    const { name, description, weeklyCheckInCount, checkInMinutes } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '频道名称不能为空' }, { status: 400 })
    }

    const channel = await adapter.createFitnessChannel({
      name: name.trim(),
      description: description?.trim() || '',
      creatorId: user.userId,
      weeklyCheckInCount: weeklyCheckInCount || 3,
      checkInMinutes: checkInMinutes || 30,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('创建频道错误:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
