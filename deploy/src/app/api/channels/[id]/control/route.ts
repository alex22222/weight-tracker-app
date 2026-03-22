import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, ChannelStatus } from '../../../../../lib/db-adapter'

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

// POST /api/channels/[id]/control - 启动或结束频道
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

    // 只有创建者可以控制频道
    const ownerId = (channel as any).ownerId || (channel as any).owner?.id
    if (ownerId !== user.userId) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body // 'start' 或 'end'

    if (action === 'start') {
      // 启动频道
      if ((channel as any).status !== ChannelStatus.PENDING) {
        return NextResponse.json({ error: '频道已启动或已结束' }, { status: 400 })
      }
      
      await adapter.updateChannelStatus(channelId, ChannelStatus.ACTIVE)
      return NextResponse.json({ message: '频道已启动' })
    } else if (action === 'end') {
      // 提前结束频道
      if ((channel as any).status === ChannelStatus.COMPLETED) {
        return NextResponse.json({ error: '频道已结束' }, { status: 400 })
      }
      
      await adapter.updateChannelStatus(channelId, ChannelStatus.COMPLETED)
      return NextResponse.json({ message: '频道已提前结束' })
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 })
  } catch (error) {
    console.error('Error controlling channel:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
