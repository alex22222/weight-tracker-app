import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType } from '../../../../../lib/db-adapter'

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

// GET /api/channels/[id]/checkin - 获取频道的所有打卡记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = parseInt(params.id)
    const channel = await adapter.getFitnessChannelById(channelId)

    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 检查是否是成员
    const isMember = await adapter.isChannelMember(channelId, user.userId)
    const ownerId = (channel as any).ownerId || (channel as any).owner?.id
    
    if (ownerId !== user.userId && !isMember) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    const checkIns = await adapter.getCheckInsByChannel(channelId)
    return NextResponse.json({ checkIns })
  } catch (error) {
    console.error('Error getting check-ins:', error)
    return NextResponse.json({ error: '获取打卡记录失败' }, { status: 500 })
  }
}

// POST /api/channels/[id]/checkin - 创建打卡记录
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channelId = parseInt(params.id)
    const channel = await adapter.getFitnessChannelById(channelId)

    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 检查是否是成员
    const isMember = await adapter.isChannelMember(channelId, user.userId)
    const ownerId = (channel as any).ownerId || (channel as any).owner?.id
    
    if (ownerId !== user.userId && !isMember) {
      return NextResponse.json({ error: '请先加入频道' }, { status: 403 })
    }

    const body = await request.json()
    const { checkDate, duration, note, imageUrl } = body

    if (!checkDate) {
      return NextResponse.json({ error: '请选择打卡日期' }, { status: 400 })
    }

    const date = new Date(checkDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // 不能打卡未来日期
    if (date > today) {
      return NextResponse.json({ error: '不能打卡未来日期' }, { status: 400 })
    }

    // 检查是否已打卡
    const existingCheckIn = await adapter.getCheckInByDate(channelId, user.userId, date)
    if (existingCheckIn) {
      return NextResponse.json({ error: '该日期已打卡' }, { status: 409 })
    }

    // 验证打卡时长
    const requiredMinutes = (channel as any).checkInMinutes || 30
    const actualDuration = duration || 30
    
    if (actualDuration < requiredMinutes) {
      return NextResponse.json({ 
        error: `打卡时长不足`,
        message: `本频道要求每次打卡至少 ${requiredMinutes} 分钟，您当前打卡 ${actualDuration} 分钟。`,
        requiredMinutes,
        actualDuration
      }, { status: 400 })
    }

    // 创建打卡记录
    const checkIn = await adapter.createCheckIn({
      channelId,
      userId: user.userId,
      checkDate: date,
      duration: actualDuration,
      note,
      imageUrl,
    })

    // 发送打卡通知给其他成员
    const members = (channel as any).members || []
    for (const member of members) {
      const memberId = member.userId || member.user?.id
      if (memberId && memberId !== user.userId) {
        await adapter.createMessage({
          type: MessageType.CHANNEL_CHECKIN,
          title: '健身打卡提醒',
          content: `${user.username} 在「${(channel as any).name}」完成了 ${date.toLocaleDateString('zh-CN')} 的健身打卡`,
          fromUserId: user.userId,
          toUserId: memberId,
          relatedData: JSON.stringify({ channelId, checkInId: (checkIn as any).id || (checkIn as any)._id }),
        })
      }
    }

    return NextResponse.json({ 
      message: '打卡成功', 
      checkIn 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating check-in:', error)
    return NextResponse.json({ error: '打卡失败' }, { status: 500 })
  }
}
