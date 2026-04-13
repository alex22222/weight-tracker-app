import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from "../../../lib/db-adapter"
import { getUserFromRequest } from "../../../lib/auth"

export const dynamic = 'force-dynamic'



export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    
    
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    
    

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
