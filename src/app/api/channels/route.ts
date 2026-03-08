import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType, ChannelStatus } from '../../../lib/db-adapter'

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

// GET /api/channels - 获取用户的所有频道
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const channels = await adapter.getFitnessChannelsByUser(user.userId)
    
    // 根据日期自动判断每个频道的实时状态
    const now = new Date()
    const channelsWithRealTimeStatus = channels.map((channel: any) => {
      const startDate = new Date(channel.startDate)
      const endDate = new Date(channel.endDate)
      let realTimeStatus = channel.status
      
      if (now < startDate) {
        realTimeStatus = 'PENDING'
      } else if (now >= startDate && now <= endDate) {
        realTimeStatus = 'ACTIVE'
      } else {
        realTimeStatus = 'COMPLETED'
      }
      
      return {
        ...channel,
        status: realTimeStatus
      }
    })
    
    return NextResponse.json({ channels: channelsWithRealTimeStatus })
  } catch (error) {
    console.error('Error getting channels:', error)
    return NextResponse.json({ error: '获取频道列表失败' }, { status: 500 })
  }
}

// POST /api/channels - 创建新频道
export async function POST(request: NextRequest) {
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
    const { name, description, startDate, endDate, weeklyCheckInCount, checkInMinutes, maxLeaveDays } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end < start) {
      return NextResponse.json({ error: '结束日期不能早于开始日期' }, { status: 400 })
    }

    // 检查用户是否已有进行中的频道
    const activeChannel = await adapter.getUserActiveChannel(user.userId)
    if (activeChannel) {
      return NextResponse.json({ 
        error: '已有进行中的健身频道',
        message: `您当前正在参与「${(activeChannel as any).name}」频道，该频道将于 ${new Date((activeChannel as any).endDate).toLocaleDateString('zh-CN')} 结束。请在当前频道结束后再创建新频道。`,
        activeChannel: {
          id: (activeChannel as any).id || (activeChannel as any)._id,
          name: (activeChannel as any).name,
          endDate: (activeChannel as any).endDate,
        }
      }, { status: 409 })
    }

    // 创建频道
    const channel = await adapter.createFitnessChannel({
      name,
      description,
      startDate: start,
      endDate: end,
      ownerId: user.userId,
      weeklyCheckInCount: weeklyCheckInCount || 3,
      checkInMinutes: checkInMinutes || 30,
      maxLeaveDays: maxLeaveDays ?? 3,
    })

    return NextResponse.json({ 
      message: '频道创建成功', 
      channel 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json({ error: '创建频道失败' }, { status: 500 })
  }
}

// DELETE /api/channels - 删除频道
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('id')

    if (!channelId) {
      return NextResponse.json({ error: '缺少频道ID' }, { status: 400 })
    }

    // 获取频道信息，验证权限
    const channel = await adapter.getFitnessChannelById(parseInt(channelId))
    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 只有创建者可以删除
    const ownerId = (channel as any).ownerId || (channel as any).owner?.id
    if (ownerId !== user.userId) {
      return NextResponse.json({ error: '无权删除该频道' }, { status: 403 })
    }

    await adapter.deleteFitnessChannel(parseInt(channelId))
    return NextResponse.json({ message: '频道已删除' })
  } catch (error) {
    console.error('Error deleting channel:', error)
    return NextResponse.json({ error: '删除频道失败' }, { status: 500 })
  }
}
