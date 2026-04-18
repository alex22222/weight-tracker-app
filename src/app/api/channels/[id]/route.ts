import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter, MessageType } from '../../../../../lib/db-adapter'
import { getUserFromRequest } from '../../../../../lib/auth'

// GET /api/channels/[id] - 获取频道详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const channelId = params.id
    const channel = await adapter.getFitnessChannelById(channelId)

    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 检查是否是成员
    const isMember = channel.members?.some((m: any) => String(m.userId) === String(user.userId))
    const isOwner = String(channel.creatorId) === String(user.userId)

    return NextResponse.json({
      channel: {
        ...channel,
        isMember: isMember || isOwner,
        isOwner
      }
    })
  } catch (error) {
    console.error('获取频道详情错误:', error)
    return NextResponse.json({ error: '获取频道详情失败' }, { status: 500 })
  }
}

// POST /api/channels/[id] - 邀请成员加入频道
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const channelId = params.id
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const channel = await adapter.getFitnessChannelById(channelId)
    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 只有创建者可以邀请
    if (String(channel.creatorId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权邀请成员' }, { status: 403 })
    }

    // 添加成员
    await adapter.addChannelMember(channelId, userId, user.username)

    // 发送邀请消息
    await adapter.createMessage({
      type: MessageType.CHANNEL_INVITE,
      content: `${user.username} 邀请你加入健身频道「${channel.name}」`,
      senderId: user.userId,
      receiverId: userId,
      channelId: channelId,
    })

    return NextResponse.json({ message: '邀请已发送' })
  } catch (error) {
    console.error('邀请成员错误:', error)
    return NextResponse.json({ error: '邀请成员失败' }, { status: 500 })
  }
}

// DELETE /api/channels/[id] - 删除频道
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const channelId = params.id
    const channel = await adapter.getFitnessChannelById(channelId)

    if (!channel) {
      return NextResponse.json({ error: '频道不存在' }, { status: 404 })
    }

    // 只有创建者可以删除
    if (String(channel.creatorId) !== String(user.userId)) {
      return NextResponse.json({ error: '无权删除频道' }, { status: 403 })
    }

    await adapter.deleteFitnessChannel(channelId)

    return NextResponse.json({ message: '频道已删除' })
  } catch (error) {
    console.error('删除频道错误:', error)
    return NextResponse.json({ error: '删除频道失败' }, { status: 500 })
  }
}
