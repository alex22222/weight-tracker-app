import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType } from '../../../../lib/db-adapter'

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

// GET /api/channels/[id] - 获取频道详情
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

    // 检查是否是成员或创建者
    const ownerId = (channel as any).ownerId || (channel as any).owner?.id
    const isMember = await adapter.isChannelMember(channelId, user.userId)
    
    if (ownerId !== user.userId && !isMember) {
      return NextResponse.json({ error: '无权访问该频道' }, { status: 403 })
    }

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Error getting channel:', error)
    return NextResponse.json({ error: '获取频道详情失败' }, { status: 500 })
  }
}

// POST /api/channels/[id] - 邀请好友加入频道
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

    // 只有创建者可以邀请
    const ownerId = (channel as any).ownerId || (channel as any).owner?.id
    if (ownerId !== user.userId) {
      return NextResponse.json({ error: '无权邀请好友' }, { status: 403 })
    }

    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: '请输入用户名' }, { status: 400 })
    }

    // 查找好友
    const targetUser = await adapter.findUserByUsername(username)
    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const targetUserId = (targetUser as any).id || (targetUser as any)._id

    // 不能邀请自己
    if (targetUserId === user.userId) {
      return NextResponse.json({ error: '不能邀请自己' }, { status: 400 })
    }

    // 检查是否已经是成员
    const isAlreadyMember = await adapter.isChannelMember(channelId, targetUserId)
    if (isAlreadyMember) {
      return NextResponse.json({ error: '该用户已在频道中' }, { status: 409 })
    }

    // 检查好友是否已有进行中的频道
    const friendActiveChannel = await adapter.getUserActiveChannel(targetUserId)
    if (friendActiveChannel) {
      return NextResponse.json({ 
        error: '该用户已有进行中的健身频道',
        message: `${username} 当前正在参与「${(friendActiveChannel as any).name}」频道，该频道将于 ${new Date((friendActiveChannel as any).endDate).toLocaleDateString('zh-CN')} 结束。请等待该用户完成当前健身计划后再邀请。`,
        activeChannel: {
          id: (friendActiveChannel as any).id || (friendActiveChannel as any)._id,
          name: (friendActiveChannel as any).name,
          endDate: (friendActiveChannel as any).endDate,
        }
      }, { status: 409 })
    }

    // 添加成员
    await adapter.addChannelMember(channelId, targetUserId)

    // 发送邀请通知
    await adapter.createMessage({
      type: MessageType.CHANNEL_INVITE,
      title: '频道邀请',
      content: `${user.username} 邀请你加入健身频道「${(channel as any).name}」`,
      fromUserId: user.userId,
      toUserId: targetUserId,
      relatedData: JSON.stringify({ channelId }),
    })

    return NextResponse.json({ message: '邀请成功' })
  } catch (error) {
    console.error('Error inviting member:', error)
    return NextResponse.json({ error: '邀请失败' }, { status: 500 })
  }
}

// DELETE /api/channels/[id] - 移除成员
export async function DELETE(
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

    // 只有创建者可以移除成员
    const ownerId = (channel as any).ownerId || (channel as any).owner?.id
    if (ownerId !== user.userId) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: '缺少成员ID' }, { status: 400 })
    }

    await adapter.removeChannelMember(channelId, parseInt(memberId))
    return NextResponse.json({ message: '成员已移除' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: '移除失败' }, { status: 500 })
  }
}
