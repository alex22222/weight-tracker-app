import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'

export const dynamic = 'force-dynamic'

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

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = verifyToken(token)
    if (!user) return NextResponse.json({ error: '无效token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all, joined, created

    let channels: any[] = []

    if (type === 'joined') {
      channels = await adapter.getChannelsByMember(user.userId)
    } else if (type === 'created') {
      const allChannels = await adapter.getAllChannels()
      channels = allChannels.filter((c: any) => c.creatorId === user.userId)
    } else {
      channels = await adapter.getAllChannels()
    }

    // 为每个频道添加成员信息和我的加入状态
    const channelsWithDetails = await Promise.all(
      channels.map(async (channel) => {
        const members = await adapter.getChannelMembers(channel.id)
        const isMember = members.some((m: any) => m.userId === user.userId)
        return {
          ...channel,
          memberCount: members.length,
          isMember,
          isCreator: channel.creatorId === user.userId,
        }
      })
    )

    return NextResponse.json({ channels: channelsWithDetails })
  } catch (error) {
    console.error('获取频道列表错误:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = verifyToken(token)
    if (!user) return NextResponse.json({ error: '无效token' }, { status: 401 })

    const body = await request.json()
    const { name, description, targetDays, targetCheckIns } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '频道名称不能为空' }, { status: 400 })
    }

    const channel = await adapter.createChannel({
      name: name.trim(),
      description: description?.trim() || '',
      creatorId: user.userId,
      targetDays: targetDays || 30,
      targetCheckIns: targetCheckIns || 20,
    })

    // 自动将创建者加入频道
    if (!channel.id) {
      return NextResponse.json({ error: '创建频道失败' }, { status: 500 })
    }
    await adapter.addChannelMember({
      channelId: channel.id as number,
      userId: user.userId,
      role: 'CREATOR',
    })

    return NextResponse.json({ message: '创建成功', channel }, { status: 201 })
  } catch (error) {
    console.error('创建频道错误:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
