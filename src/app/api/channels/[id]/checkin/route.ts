import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { getUserFromRequest } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/channels/[id]/checkin - 获取频道的打卡记录
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const channelId = params.id
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (date) {
      // 获取指定日期的打卡记录
      const checkIn = await adapter.getCheckInByDate(channelId, user.userId, date)
      return NextResponse.json({ checkIn })
    }

    // 获取所有打卡记录
    const checkIns = await adapter.getCheckInsByChannel(channelId)
    return NextResponse.json({ checkIns })
  } catch (error) {
    console.error('获取打卡记录错误:', error)
    return NextResponse.json({ error: '获取打卡记录失败' }, { status: 500 })
  }
}

// POST /api/channels/[id]/checkin - 创建打卡
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '未登录或token已过期' }, { status: 401 })
    }

    const channelId = params.id
    const body = await request.json()
    const { checkDate, duration, note, imageUrl } = body

    if (!checkDate) {
      return NextResponse.json({ error: '请选择打卡日期' }, { status: 400 })
    }

    // 验证日期格式 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(checkDate)) {
      return NextResponse.json({ error: '日期格式错误' }, { status: 400 })
    }

    // 检查是否已打卡
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
      note: note || '',
      imageUrl: imageUrl || '',
    })

    return NextResponse.json({ message: '打卡成功', checkIn }, { status: 201 })
  } catch (error) {
    console.error('打卡错误:', error)
    return NextResponse.json({ error: '打卡失败' }, { status: 500 })
  }
}
