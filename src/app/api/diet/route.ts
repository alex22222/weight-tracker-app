import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/cloudbase'
import { getUserFromRequest } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/diet - 获取当前用户的饮食记录
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD，可选

    let query: any = { userId: user.userId }
    if (date) {
      query.date = date
    }

    const dietCollection = db.collection('diet_records')
    const result = await dietCollection
      .where(query)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    // 过滤掉分析中的记录，不显示在历史列表
    const records = (result.data || []).filter((r: any) => r.status !== 'analyzing')

    // 统计今日次数
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const todayCount = await dietCollection.where({ userId: user.userId, date: today }).count()

    return NextResponse.json({
      records,
      todayCount: todayCount.total || 0,
      maxDaily: 3,
    })
  } catch (error: any) {
    console.error('[API /diet] GET Error:', error)
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 })
  }
}

// DELETE /api/diet?id=xxx - 删除单条记录
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 })
    }

    const dietCollection = db.collection('diet_records')

    // 先查询确认归属
    const record = await dietCollection.doc(id).get()
    if (!record.data || record.data.userId !== user.userId) {
      return NextResponse.json({ error: '无权删除该记录' }, { status: 403 })
    }

    await dietCollection.doc(id).remove()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API /diet] DELETE Error:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
