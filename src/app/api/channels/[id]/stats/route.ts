import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from "../../../../../lib/db-adapter"
import { getUserFromRequest } from "../../../../../lib/auth"

export const dynamic = 'force-dynamic'

// 验证 Token


// GET /api/channels/[id]/stats - 获取频道每周打卡统计
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    

    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = params.id
    const channel = await adapter.getFitnessChannelById(channelId)

    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 检查是否是成员或创建者
    const isMember = await adapter.isChannelMember(channelId, user.userId)
    
    if (channel.creatorId !== user.userId && !isMember) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    // 获取频道统计
    const channelStats = await adapter.getChannelWeeklyStats(channelId)
    const myStats = channelStats?.members?.find((m: any) => m.userId === user.userId)
    const weeklyCount = myStats?.completed || 0

    return NextResponse.json({
      weeklyCount: weeklyCount,
      weeklyRequired: channel.weeklyCheckInCount || 3,
      checkInMinutes: channel.checkInMinutes || 30,
      maxLeaveDays: 3,
      remaining: Math.max(0, (channel.weeklyCheckInCount || 3) - weeklyCount),
      allMembers: channelStats?.members || [],
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 })
  }
}
