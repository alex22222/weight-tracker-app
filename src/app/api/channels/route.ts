import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'

export const dynamic = 'force-dynamic'

function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, userId] = decoded.split(':')
    if (!username || !userId) return null
    return { userId, username }
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

    // 获取所有频道
    const channels = await adapter.getFitnessChannels()

    // 为每个频道添加成员信息和我的加入状态，并转换状态值为大写
    const channelsWithDetails = channels.map((channel: any) => {
      const members = channel.members || []
      const isMember = members.some((m: any) => m.userId === user.userId)
      return {
        ...channel,
        status: channel.status?.toUpperCase?.() || channel.status,
        memberCount: members.length,
        isMember,
        isCreator: channel.creatorId === user.userId,
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = verifyToken(token)
    if (!user) return NextResponse.json({ error: '无效token' }, { status: 401 })

    const body = await request.json()
    const { name, description, weeklyCheckInCount, checkInMinutes, startDate, endDate } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '频道名称不能为空' }, { status: 400 })
    }

    const channel = await adapter.createFitnessChannel({
      name: name.trim(),
      description: description?.trim() || '',
      creatorId: user.userId,
      weeklyCheckInCount: weeklyCheckInCount || 3,
      checkInMinutes: checkInMinutes || 30,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    // 自动将创建者加入频道
    if (!channel.id) {
      return NextResponse.json({ error: '创建频道失败' }, { status: 500 })
    }
    await adapter.joinFitnessChannel(channel.id, user.userId, user.username)

    return NextResponse.json({ message: '创建成功', channel }, { status: 201 })
  } catch (error) {
    console.error('创建频道错误:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
