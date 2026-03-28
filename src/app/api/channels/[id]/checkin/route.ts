import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../../lib/db-adapter'

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = verifyToken(token)
    if (!user) return NextResponse.json({ error: '无效token' }, { status: 401 })

    const channelId = parseInt(params.id)
    const checkIns = await adapter.getCheckInsByChannel(channelId)
    return NextResponse.json({ checkIns })
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = verifyToken(token)
    if (!user) return NextResponse.json({ error: '无效token' }, { status: 401 })

    const channelId = parseInt(params.id)
    const body = await request.json()
    const { checkDate, duration, note, imageUrl } = body

    if (!checkDate) {
      return NextResponse.json({ error: '请选择日期' }, { status: 400 })
    }

    // 验证日期格式 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(checkDate)) {
      return NextResponse.json({ error: '日期格式错误' }, { status: 400 })
    }

    // 直接传递字符串日期给适配器（适配器已更新为支持字符串输入）
    const existing = await adapter.getCheckInByDate(channelId, user.userId, checkDate)
    if (existing) {
      return NextResponse.json({ error: '该日期已打卡' }, { status: 409 })
    }

    // 创建打卡 - 使用 UTC 时间
    const [year, month, day] = checkDate.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

    const checkIn = await adapter.createCheckIn({
      channelId,
      userId: user.userId,
      checkDate: date,
      duration: duration || 30,
      note,
      imageUrl,
    })

    return NextResponse.json({ message: '打卡成功', checkIn }, { status: 201 })
  } catch (error) {
    console.error('打卡错误:', error)
    return NextResponse.json({ error: '打卡失败' }, { status: 500 })
  }
}
