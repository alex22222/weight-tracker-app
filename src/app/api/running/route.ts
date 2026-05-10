import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../lib/db-adapter'
import { getUserFromRequest, validators } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/running - 获取用户的跑步记录
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const entries = await adapter.getRunningEntriesByUser(user.userId)
    return NextResponse.json({ entries })
  } catch (error: any) {
    console.error('[API /running] GET Error:', error)
    return NextResponse.json({ error: '获取记录失败', entries: [] }, { status: 500 })
  }
}

// POST /api/running - 添加跑步记录
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { distance, duration, note, date } = body

    const distanceVal = parseFloat(distance)
    if (isNaN(distanceVal) || distanceVal <= 0 || distanceVal > 100) {
      return NextResponse.json({ error: '请输入有效的距离 (0-100 km)' }, { status: 400 })
    }

    const durationVal = parseInt(duration)
    if (isNaN(durationVal) || durationVal <= 0 || durationVal > 1440) {
      return NextResponse.json({ error: '请输入有效的时长 (0-1440 分钟)' }, { status: 400 })
    }

    const dateValidation = validators.date(date || new Date().toISOString())
    if (!dateValidation.valid) {
      return NextResponse.json({ error: dateValidation.message }, { status: 400 })
    }

    const sanitizedNote = validators.sanitizeString(note || '', 500)

    const entry = await adapter.createRunningEntry({
      distance: distanceVal,
      duration: durationVal,
      note: sanitizedNote || undefined,
      date: dateValidation.value!,
      userId: user.userId,
    })

    return NextResponse.json({ entry })
  } catch (error: any) {
    console.error('[API /running] POST Error:', error?.message || error)
    console.error('[API /running] POST Stack:', error?.stack)
    return NextResponse.json({ error: '保存记录失败', detail: error?.message || String(error) }, { status: 500 })
  }
}

// DELETE /api/running?id={id} - 删除跑步记录
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '无效的记录ID' }, { status: 400 })
    }

    await adapter.deleteRunningEntry(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API /running] DELETE Error:', error)
    return NextResponse.json({ error: '删除记录失败' }, { status: 500 })
  }
}
