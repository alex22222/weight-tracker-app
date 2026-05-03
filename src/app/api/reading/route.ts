import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from "../../../lib/db-adapter"
import { getUserFromRequest } from "../../../lib/auth"

export const dynamic = 'force-dynamic'

// 验证 Token

// GET /api/reading - 获取用户的读书记录
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    // 获取连续打卡天数
    const streak = await adapter.getReadingStreak(user.userId)
    
    // 获取阅读记录
    const entries = await adapter.getReadingEntriesByUser(user.userId)

    return NextResponse.json({
      streak,
      entries: entries.map(e => ({
        id: e.id,
        bookName: e.bookName,
        pages: e.pages,
        note: e.note,
        date: new Date(e.date).toISOString().split('T')[0],
        createdAt: e.createdAt
      }))
    })
  } catch (error) {
    console.error('Error getting reading entries:', error)
    return NextResponse.json({ error: '获取阅读记录失败' }, { status: 500 })
  }
}

// POST /api/reading - 提交读书打卡
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '无效的 token' }, { status: 401 })
    }

    const body = await request.json()
    const { bookName, pages, note, date } = body

    // 验证输入
    if (!bookName || typeof bookName !== 'string') {
      return NextResponse.json({ error: '请输入书名' }, { status: 400 })
    }

    if (!pages || isNaN(parseInt(pages)) || parseInt(pages) <= 0) {
      return NextResponse.json({ error: '请输入有效的页数' }, { status: 400 })
    }

    const entryDate = date ? new Date(date) : new Date()
    const dateStr = entryDate.toISOString().split('T')[0]

    // 检查今天是否已打卡
    const existingEntry = await adapter.getReadingEntriesByDate(user.userId, dateStr)
    if (existingEntry) {
      return NextResponse.json({ error: '今天已经打卡了' }, { status: 409 })
    }

    // 创建打卡记录
    const entry = await adapter.createReadingEntry({
      bookName: bookName.trim(),
      pages: parseInt(pages),
      note: note?.trim() || null,
      date: entryDate,
      userId: user.userId,
    })

    // 获取更新后的连续打卡天数
    const streak = await adapter.getReadingStreak(user.userId)

    return NextResponse.json({
      message: '打卡成功',
      entry: {
        id: entry.id,
        bookName: entry.bookName,
        pages: entry.pages,
        note: entry.note,
        date: dateStr,
      },
      streak
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reading entry:', error)
    return NextResponse.json({ error: '打卡失败' }, { status: 500 })
  }
}
